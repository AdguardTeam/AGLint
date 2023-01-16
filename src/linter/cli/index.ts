import path, { ParsedPath } from "path";
import { readFile, writeFile } from "fs/promises";
import { Linter } from "../../index";
import { mergeConfigs } from "../config";
import { walkScannedDirectory } from "./walk";
import { scan } from "./scan";
import { LinterCliReporter } from "./reporter";
import cloneDeep from "clone-deep";
import { LinterConfig, defaultLinterConfig } from "../config";

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
     * Lints the current working directory.
     *
     * @param config Initial config
     * @param files Files to be linted (glob patterns)
     */
    public lintCurrentWorkingDirectory = async (config?: LinterConfig, files: string[] = []): Promise<void> => {
        // This specifies in which folder the "npx aglint" / "yarn aglint" command was invoked
        // and use "process.cwd" as fallback. This is the current working directory (cwd).
        const cwd = process.env.INIT_CWD || process.cwd();

        // If the reporter has an onLintStart event, call it
        if (this.reporter.onLintStart) {
            this.reporter.onLintStart();
        }

        // If files are specified, use them instead of scanning the cwd
        if (files.length > 0) {
            // TODO: Implement this
            // for (const file of files) {
            //
            // }
        } else {
            // Run the scanner on the cwd
            const scanResult = await scan(cwd);

            // Walk through the scanned directory and lint all files
            await walkScannedDirectory(
                scanResult,
                {
                    // Call the lint function for each file during the walk
                    file: this.lintFile,
                },

                // Merge the parsed config with the default config
                config === undefined ? defaultLinterConfig : mergeConfigs(defaultLinterConfig, config),

                this.fix
            );
        }

        // If the reporter has an onLintEnd event, call it
        if (this.reporter.onLintEnd) {
            this.reporter.onLintEnd();
        }
    };
}
