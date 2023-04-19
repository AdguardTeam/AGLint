/**
 * @file AGLint CLI
 * @todo DEV run: node --no-warnings --loader ts-node/esm --experimental-specifier-resolution=node src/cli.ts
 */

import { program } from 'commander';
import { readFileSync } from 'fs';
import { readdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { LinterCli, LinterConsoleReporter } from './index';
import { CONFIG_FILE_NAMES } from './linter/cli/constants';
import { NoConfigError } from './linter/cli/errors/no-config-error';

// Based on https://github.com/rollup/plugins/tree/master/packages/json#usage
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

/**
 * Print error to the console, also handle unknown errors.
 *
 * @param error Error to print
 */
function printError(error: unknown): void {
    const lines = [
        'Oops! Something went wrong! :(',
        '',
        `AGLint: ${pkg.version}`,
        '',
    ];

    if (error instanceof Error) {
        const { message, stack } = error;

        lines.push(message || 'No error message provided');
        lines.push('');

        // Very basic stack trace formatting
        lines.push(
            ...(stack || '').split('\n').map((line) => `  ${line}`),
        );
    } else {
        // Convert any unknown error to string
        lines.push(String(error));
    }

    // Print generated lines to the console as error
    // eslint-disable-next-line no-console
    console.error(lines.join('\n'));
}

(async () => {
    try {
        // Set-up Commander
        program
            // Basic info
            .name('AGLint')
            .description('Adblock filter list linter')
            .version(pkg.version, '-v, --version', 'Output the version number')
            .usage('[options] [file paths...]')

            // Customized help option
            .helpOption('-h, --help', 'Display help for command')

            // Options
            .option(
                '-f, --fix',
                'Enable automatic fix, if possible (BE CAREFUL, this overwrites original files with the fixed ones)',
                false,
            )
            .option('-c, --colors', 'Force enabling colors', true)
            .option('--no-colors', 'Force disabling colors')
            .option('--no-ignores', 'Force ignoring .aglintignore files')

            // Parse the arguments
            .parse(process.argv);

        // This specifies in which folder the "npx aglint" / "yarn aglint" command was invoked
        // and use "process.cwd" as fallback. This is the current working directory (cwd).
        const cwd = process.env.INIT_CWD || process.cwd();

        // "aglint init": initialize config file in the current directory (cwd)
        if (program.args[0] === 'init') {
            // Don't allow to initialize config file if another config file already exists
            const cwdItems = await readdir(cwd);

            for (const item of cwdItems) {
                if (CONFIG_FILE_NAMES.includes(item)) {
                    // Show which config file is conflicting exactly
                    // eslint-disable-next-line no-console
                    console.error(`Config file already exists in directory "${cwd}" as "${item}"`);
                    process.exit(1);
                }
            }

            // Create the config file
            // TODO: This is a very basic implementation, we should implement a proper config
            // file generator in the future
            // eslint-disable-next-line max-len
            await writeFile(join(cwd, '.aglintrc.yaml'), '# AGLint root config file\n# Documentation: https://github.com/AdguardTeam/AGLint#configuration\nroot: true\nextends:\n  - aglint:recommended\n');

            // Notify the user that the config file was created successfully
            // eslint-disable-next-line no-console
            console.log(`Config file was created successfully in directory "${cwd}" as ".aglintrc.yaml"`);

            // Notify user about root: true option
            // eslint-disable-next-line no-console, max-len
            console.log('Note: "root: true" option was added to the config file. Please make sure that the config file is located in the root directory of your project.');

            // We should exit the process here, because we don't want to run the linter after
            // initializing the config file
            process.exit(0);
        }

        // TODO: Custom reporter support with --reporter option
        const cli = new LinterCli(
            new LinterConsoleReporter(program.opts().colors),
            !!program.opts().fix,
            !!program.opts().ignores,
        );

        await cli.run(cwd, program.args);

        // If there are errors, exit with code 1. This is necessary for CI/CD pipelines,
        // see https://docs.github.com/en/actions/creating-actions/setting-exit-codes-for-actions#about-exit-codes
        if (cli.hasErrors()) {
            process.exit(1);
        }
    } catch (error: unknown) {
        if (error instanceof NoConfigError && error.name === 'NoConfigError') {
            /* eslint-disable max-len, no-console */
            // Show a detailed error message if the config file was not found
            console.error([
                'AGLint couldn\'t find the config file. To set up a configuration file for this project, please run:',
                '',
                '    If you use NPM:\tnpx aglint init',
                '    If you use Yarn:\tyarn aglint init',
                '',
                'IMPORTANT: The init command creates a root config file, so be sure to run it in the root directory of your project!',
                '',
                'AGLint will try to find the config file in the current directory (cwd), but if the config file is not found',
                'there, it will try to find it in the parent directory, and so on until it reaches your OS root directory.',
            ].join('\n'));
            /* eslint-enable max-len, no-console */

            // Exit with code 1. This is necessary for CI/CD pipelines
            process.exit(1);
        }

        // If any error occurs it means that the linter failed to run
        // Format and print error to the console
        printError(error);

        // Exit with code 2. This is necessary for CI/CD pipelines
        process.exit(2);
    }
})();
