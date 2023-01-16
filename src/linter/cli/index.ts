import path, { ParsedPath } from "path";
import { access, readFile, readdir, writeFile } from "fs/promises";
import { Linter } from "../../index";
import { mergeConfigs } from "../config";
import { walkScannedDirectory } from "./walk";
import { scan } from "./scan";
import { LinterCliReporter } from "./reporter";
import cloneDeep from "clone-deep";
import { LinterConfig, defaultLinterConfig } from "../config";
import { CONFIG_FILE_NAMES } from "./constants";
import { parseConfigFile } from "./config-reader";

/**
 * Implements CLI functionality for the linter. Typically used by the `aglint` command in Node.js environment.
 */
export class LinterCli {
    /**
     * The reporter to be used for the CLI.
     */
    private readonly reporter: LinterCliReporter;

    private fix: boolean;

    private ignore: boolean;

    /**
     * Creates a new `LinterCli` instance.
     *
     * @param reporter The reporter to be used for the CLI
     * @param fix Fix fixable problems automatically
     * @param ignore Use `.aglintignore` files
     */
    constructor(reporter: LinterCliReporter, fix = false, ignore = true) {
        this.reporter = reporter;
        this.fix = fix;
        this.ignore = ignore;
    }

    /**
     * Lints a file with the given config. Also compatible with the `WalkEvent` type,
     * so it can be used with the `walkScannedDirectory` function.
     *
     * @param file The file to be linted
     * @param config The active linter config (merged from parent directories)
     */
    private lintFile = async (file: ParsedPath, config: LinterConfig) => {
        // Create a new linter instance and add the default rules
        const linter = new Linter();
        linter.addDefaultRules();

        // Get the file path from the current directory
        const filePath = path.join(file.dir, file.base);

        // Clone the config in order to prevent unwanted changes
        const configDeepClone = cloneDeep(config);

        // If the reporter has an onFileStart event, call it
        if (this.reporter.onFileStart) {
            this.reporter.onFileStart(file, configDeepClone);
        }

        // Lint the file
        let result = linter.lint(await readFile(filePath, "utf8"), this.fix || false);

        // If there are no problems, skip this file, no need to log anything
        if (result.problems.length === 0) {
            return;
        }

        // If fix is enabled and fixable problems were found, write the fixed file,
        // then re-lint the fixed file to see if there are still problems
        if (this.fix) {
            if (result.fixed) {
                await writeFile(filePath, result.fixed);

                // TODO: Currently fixing runs only once, but it should run until there are no more fixable problems
                result = linter.lint(result.fixed, this.fix || false);

                // If everything is fixed, skip this file
                if (result.problems.length === 0) {
                    return;
                }
            }
        }

        // If the reporter has an onFileStart event, call it
        if (this.reporter.onFileEnd) {
            this.reporter.onFileEnd(file, result, configDeepClone);
        }
    };

    /**
     * Checks if a file exists in the specified path.
     *
     * @param file The file to be checked
     * @returns `true` if the file exists, `false` otherwise
     */
    private fileExists = async (file: string): Promise<boolean> => {
        try {
            await access(file);
            return true;
        } catch {
            return false;
        }
    };

    /**
     * Lints the current working directory. If you specify files, it will only lint those files.
     *
     * @param files The files to be linted (if not specified, it will scan the cwd)
     */
    public run = async (files: string[] = []): Promise<void> => {
        // This specifies in which folder the "npx aglint" / "yarn aglint" command was invoked
        // and use "process.cwd" as fallback. This is the current working directory (cwd).
        const cwd = process.env.INIT_CWD || process.cwd();

        // If the reporter has an onLintStart event, call it
        if (this.reporter.onLintStart) {
            this.reporter.onLintStart();
        }

        // If files are specified, use them instead of scanning the cwd
        if (files.length > 0) {
            for (const file of files) {
                // Check if the file exists
                if (!(await this.fileExists(file))) {
                    throw new Error(`File "${file}" does not exist`);
                }

                // Parse the file path
                const parsedFile = path.parse(path.join(cwd, file));

                // Check for config files in the file's directory
                const items = await readdir(parsedFile.dir);
                const configs = items.filter((item) => CONFIG_FILE_NAMES.includes(item));

                // If multiple config files were found, throw an error, because we don't know which one to use
                if (configs.length > 1) {
                    throw new Error(
                        `Multiple config files found in directory "${parsedFile.dir}" (${configs.join(", ")})`
                    );
                }

                // If a config file was found, parse it
                const config =
                    configs.length === 1 ? await parseConfigFile(path.join(parsedFile.dir, configs[0])) : undefined;

                // Lint the file
                await this.lintFile(
                    parsedFile,
                    config === undefined ? defaultLinterConfig : mergeConfigs(defaultLinterConfig, config)
                );
            }
        } else {
            // Run the scanner on the cwd
            const scanResult = await scan(cwd, [], this.ignore);

            // Walk through the scanned directory and lint all files
            await walkScannedDirectory(
                scanResult,
                {
                    // Call the lint function for each file during the walk
                    file: this.lintFile,
                },
                defaultLinterConfig,
                this.fix
            );
        }

        // If the reporter has an onLintEnd event, call it
        if (this.reporter.onLintEnd) {
            this.reporter.onLintEnd();
        }
    };
}
