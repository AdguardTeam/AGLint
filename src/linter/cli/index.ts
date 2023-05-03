import path, { ParsedPath } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { pathExists } from 'fs-extra';
import cloneDeep from 'clone-deep';
import { Linter } from '../index';
import { walk } from './walk';
import { scan } from './scan';
import { LinterCliReporter } from './reporter';
import { LinterConfig } from '../common';
import { buildConfigForDirectory } from './config-builder';
import { NoConfigError } from './errors/no-config-error';

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

    private errors: boolean;

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
        this.errors = false;
    }

    /**
     * Resolves the linter config for the given file or directory. If the given path is
     * a file, the config for the directory where the file is located will be resolved.
     * Mainly for debugging purposes.
     *
     * @param fileOrDir File or directory to be debugged
     * @param cwd Current working directory (optional)
     * @returns Resolved linter config object for the given file or directory
     * @throws If the file or directory does not exist
     * @throws If no config file was found in the given directory or any of its parents
     */
    public static async resolveConfig(fileOrDir: string, cwd: string | null = process.cwd()): Promise<LinterConfig> {
        // Determine the full path of the file or directory
        let fullPath: string;

        if (path.isAbsolute(fileOrDir)) {
            fullPath = fileOrDir;
        } else {
            if (!cwd) {
                throw new Error('Current working directory should be specified if the path is relative');
            }

            fullPath = path.join(cwd, fileOrDir);
        }

        // Check if the path exists
        if (!(await pathExists(fullPath))) {
            throw new Error(`File "${fullPath}" does not exist`);
        }

        // Resolve config for the given directory (or the directory where the file is located)
        const parsedPath = path.parse(fullPath);
        const config = await buildConfigForDirectory(parsedPath.dir);

        // If the config is null, throw an error, because no config file was found
        // in the given directory or any of its parents
        if (!config) {
            throw new NoConfigError(parsedPath.dir);
        }

        // Create a new linter instance and add the default rules
        const linter = new Linter(true, config);

        // Get the generated config from the linter instance
        return linter.getConfig();
    }

    /**
     * Lints a file with the given config. Also compatible with the `WalkEvent` type,
     * so it can be used with the `walk` function.
     *
     * @param file The file to be linted
     * @param config The active linter config (merged from parent directories)
     */
    private lintFile = async (file: ParsedPath, config: LinterConfig) => {
        // Create a new linter instance and add the default rules
        const linter = new Linter(true, config);

        // Get the file path from the current directory
        const filePath = path.join(file.dir, file.base);

        // Clone the config in order to prevent unwanted changes
        const configDeepClone = cloneDeep(config);

        // If the reporter has an onFileStart event, call it
        if (this.reporter.onFileStart) {
            this.reporter.onFileStart(file, configDeepClone);
        }

        // Lint the file
        let result = linter.lint(await readFile(filePath, 'utf8'), this.fix || false);

        // Set the errors flag if there are any errors
        if (!this.errors && (result.errorCount > 0 || result.fatalErrorCount > 0)) {
            this.errors = true;
        }

        // If fix is enabled and fixable problems were found, write the fixed file,
        // then re-lint the fixed file to see if there are still problems
        if (this.fix) {
            if (result.fixed) {
                await writeFile(filePath, result.fixed);

                // TODO: Currently fixing runs only once, but it should run until there are no more fixable problems
                result = linter.lint(result.fixed, this.fix || false);
            }
        }

        // If the reporter has an onFileStart event, call it
        if (this.reporter.onFileEnd) {
            this.reporter.onFileEnd(file, result, configDeepClone);
        }
    };

    /**
     * Returns true if the linter found any errors.
     *
     * @returns `true` if the linter found any errors, `false` otherwise
     */
    public hasErrors = (): boolean => {
        return this.errors;
    };

    /**
     * Lints the current working directory. If you specify files, it will only lint those files.
     *
     * @param cwd The current working directory
     * @param files The files to be linted (if not specified, it will scan the cwd)
     */
    public run = async (cwd: string, files: string[] = []): Promise<void> => {
        // If the reporter has an onLintStart event, call it
        if (this.reporter.onLintStart) {
            this.reporter.onLintStart();
        }

        // If files are specified, use them instead of scanning the cwd
        if (files.length > 0) {
            for (const file of files) {
                const fullPath = path.join(cwd, file);

                // Check if the file exists
                if (!(await pathExists(fullPath))) {
                    throw new Error(`File "${fullPath}" does not exist`);
                }

                // Parse the file path
                const parsedFile = path.parse(fullPath);

                // Get config for the directory where the file is located
                const config = await buildConfigForDirectory(parsedFile.dir);

                // Lint the file
                await this.lintFile(parsedFile, config);
            }
        } else {
            // Get the config for the cwd, should exist
            const rootConfig = await buildConfigForDirectory(cwd);

            if (!rootConfig) {
                throw new NoConfigError(cwd);
            }

            // Run the scanner on the cwd
            const scanResult = await scan(cwd, [], this.ignore);

            // Walk through the scanned directory and lint all files
            await walk(
                scanResult,
                {
                    // Call the lint function for each file during the walk
                    file: this.lintFile,
                },
                // Use cwd config as base config for the walker
                rootConfig,
                this.fix,
            );
        }

        // If the reporter has an onLintEnd event, call it
        if (this.reporter.onLintEnd) {
            this.reporter.onLintEnd();
        }
    };
}
