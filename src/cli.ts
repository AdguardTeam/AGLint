/**
 * AGLint CLI
 *
 * @todo DEV run: node --no-warnings --loader ts-node/esm --experimental-specifier-resolution=node cli.ts
 */

import { program } from "commander";
import chalk from "chalk";
import { readFileSync } from "fs";
import { LinterCliConfig } from "./linter/cli/config";
import { scan } from "./linter/cli/scan";
import { walkScannedDirectory } from "./linter/cli/walk";
import path, { ParsedPath } from "path";
import { Linter } from ".";
import { readFile } from "fs/promises";

// Based on https://github.com/rollup/plugins/tree/master/packages/json#usage
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

(async () => {
    // This specifies in which folder the "npx aglint" / "yarn aglint" command was invoked
    // and use "process.cwd" as fallback
    const cwd = process.env.INIT_CWD || process.cwd();

    // Set-up Commander
    program
        // Basic info
        .name("AGLint")
        .description(pkg.description)
        .version(pkg.version)
        .usage("[options] [file...]")

        // Options
        .option(
            "-f, --fix",
            "Enable automatic fix, if possible (BE CAREFUL, this overwrites original files with the fixed ones)",
            false
        )
        .option("-c, --colors", "Enable colors in console reporting", true)
        .parse(process.argv);

    // Any problems encountered?
    let anyProblem = false;

    // Get start time
    const startTime = performance.now();

    // Get file list from args, but this can be empty
    // const files = program.args;
    const scanResult = await scan(cwd);

    // TODO: If no files are specified, lint all supported files in the cwd

    walkScannedDirectory(scanResult, {
        file: async (file: ParsedPath, config: LinterCliConfig) => {
            const linter = new Linter();
            linter.addDefaultRules();
            const result = linter.lint(await readFile(path.join(file.dir, file.base), "utf8"), config.fix || false);

            // If there are no problems, skip this file, no need to log anything
            if (result.problems.length === 0) {
                return;
            }

            anyProblem = true;

            // Log file name
            console.log(path.join(file.dir, file.base));

            // Log problems
            for (const problem of result.problems) {
                let message = "";

                // Problem location
                message += "\t";

                message += problem.position.startLine;

                if (typeof problem.position.startColumn !== "undefined") {
                    message += ":";
                    message += problem.position.startColumn;
                }

                message += "\t";

                // Problem type
                switch (problem.severity) {
                    case 1: {
                        message += config.colors ? chalk.yellow("warning") : "warning";
                        break;
                    }
                    case 2: {
                        message += config.colors ? chalk.red("error") : "error";
                        break;
                    }
                    case 3: {
                        message += config.colors ? chalk.bgRed.white("fatal") : "fatal";
                        break;
                    }
                    default: {
                        message += config.colors ? chalk.red("error") : "error";
                    }
                }

                message += "\t";

                // Problem description
                message += config.colors ? chalk.gray(problem.message) : problem.message;

                console.error(message);
            }
        },
    });

    if (!anyProblem) {
        console.log(chalk.green("No problems found"));
    }

    // Calculate and log runtime
    console.log(`Linter runtime: ${performance.now() - startTime} ms`);
})();
