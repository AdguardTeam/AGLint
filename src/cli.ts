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

// Based on https://github.com/rollup/plugins/tree/master/packages/json#usage
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

(async () => {
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
        // TODO: This is a very basic implementation, we should implement a proper config file generator in the future
        // eslint-disable-next-line max-len
        await writeFile(join(cwd, '.aglintrc.yaml'), '# AGLint config file\n# Documentation: https://github.com/AdguardTeam/AGLint#configuration\nextends:\n  - aglint:recommended\n');

        // We should exit the process here, because we don't want to run the linter after initializing the config file
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
})();
