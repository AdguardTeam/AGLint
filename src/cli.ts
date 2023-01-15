/**
 * AGLint CLI
 *
 * @todo DEV run: node --no-warnings --loader ts-node/esm --experimental-specifier-resolution=node src/cli.ts
 */

import { program } from "commander";
import { readFileSync } from "fs";
import { defaultLinterCliConfig, LinterCliConfig } from "./linter/cli/config";
import { LinterCli } from "./linter/cli";
import { ConsoleReporter } from "./linter/cli/reporters/console";

// Based on https://github.com/rollup/plugins/tree/master/packages/json#usage
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

(async () => {
    // Set-up Commander
    program
        // Basic info
        .name("AGLint")
        .description("Adblock filter list linter")
        .version(pkg.version, "-v, --version", "Output the version number")
        .usage("[options] [file paths...]")

        // Customized help option
        .helpOption("-h, --help", "Display help for command")

        // Options
        .option(
            "-f, --fix",
            "Enable automatic fix, if possible (BE CAREFUL, this overwrites original files with the fixed ones)",
            defaultLinterCliConfig.fix
        )
        .option("-c, --colors", "Force enabling colors", true)
        .option("--no-colors", "Force disabling colors")
        .option("--no-ignores", "Force ignoring .aglintignore files")

        // Parse the arguments
        .parse(process.argv);

    // Create config based on the parsed arguments
    const parsedConfig: LinterCliConfig = {
        fix: !!program.opts().fix,
        ignores: !!program.opts().ignores,
    };

    // TODO: Custom reporter support with --reporter option
    const cli = new LinterCli(new ConsoleReporter(program.opts().colors));

    await cli.lintCurrentWorkingDirectory(parsedConfig);
})();
