/**
 * AGLint CLI
 *
 * @todo DEV run: node --no-warnings --loader ts-node/esm --experimental-specifier-resolution=node cli.ts
 */

import { program } from "commander";
import chalk from "chalk";
import fs from "fs";
import yaml from "js-yaml";
import ss from "superstruct";
import merge from "deepmerge";
import { readFileSync, readdirSync, statSync } from "fs";
import ignore, { Ignore } from "ignore";
import globPkg from "glob";
const { glob } = globPkg;

// https://github.com/rollup/plugins/tree/master/packages/json#usage
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

// ! It is important that the CLI invokes everything via AGLint root, so
// ! please don't call anything directly from the library source files!
import { Linter } from ".";

// eslint-disable-next-line prettier/prettier
const CONFIG_FILE_NAMES = [
    "aglint.config.json",
    "aglint.config.yaml",
    "aglint.config.yml",
]

/**
 * Name of the ignore file
 */
const IGNORE_FILE_NAME = ".aglintignore";

/**
 * CLI configuration interface
 */
interface LinterCliConfig {
    colors: boolean;
    fix: boolean;
}

/**
 * Superstruct schema for the config (for validation)
 */
const configSchema = ss.object({
    colors: ss.boolean(),
    fix: ss.boolean(),
});

const defaultCliConfig: LinterCliConfig = {
    colors: true,
    fix: true,
};

/**
 * Reads and parses a configuration file.
 *
 * @param filename - The name of the configuration file to be read and parsed.
 * @returns The parsed config object.
 * @throws If the file extension is not supported or if the config object fails validation.
 */
function parseConfigFile(filename: string): LinterCliConfig {
    // Determine the file extension
    const extension = filename.split(".").pop();

    // Read the file contents
    const contents = fs.readFileSync(filename, "utf8");

    // At this point, we don't know exactly what the file contains,
    // so simply mark it as unknown, later we validate it anyway
    let parsed: unknown;

    // Parse the file contents based on the extension
    switch (extension) {
        case "json":
            parsed = JSON.parse(contents);
            break;

        case "yaml":
        case "yml":
            parsed = yaml.load(contents);
            break;

        // TODO: .aglintrc, js/ts
        default:
            throw new Error(`Unsupported file extension: ${extension}`);
    }

    // Validate the parsed config object against the config schema using superstruct
    ss.assert(parsed, configSchema);

    return parsed;
}

/**
 * Lints a directory by reading all files and directories in the given directory, and
 * searching for a configuration file.
 * If a configuration file is found, it is parsed and used to update the provided CLI
 * configuration.
 *
 * @param dir - The directory to lint.
 * @param cliConfig - CLI configuration. If not provided, a default configuration will be used.
 * @param ignores - File ignores
 * @throws If multiple configuration files are found in the given directory.
 */
const lintDirectory = (
    dir: string,
    cliConfig: LinterCliConfig = defaultCliConfig,
    ignores: Ignore | undefined = undefined
) => {
    let config = { ...cliConfig }; // create a copy of the provided CLI config to modify later
    let configFile: string | null = null; // variable to store the path to the configuration file if found

    const files: string[] = []; // array to store file names
    const dirs: string[] = []; // array to store directory names

    const items = readdirSync(dir); // get all items in the directory

    for (const item of items) {
        const stats = statSync(`${dir}/${item}`); // get stats for the current item

        // classify the current item based on its type (only handle dirs and files)
        if (stats.isDirectory()) dirs.push(item);
        else if (stats.isFile()) {
            files.push(item);

            // if the current file is a configuration file, store its name
            if (CONFIG_FILE_NAMES.includes(item)) {
                if (configFile !== null) {
                    // throw error if multiple config files are found
                    throw new Error(`Multiple configuration files in directory "${dir}"`);
                }

                configFile = item;
            }
        }
    }

    // if a config file was found, parse it and use it to update the CLI config
    if (configFile) {
        const parsedCliConfig = parseConfigFile(`${dir}/${configFile}`);
        config = merge(cliConfig, parsedCliConfig);
    }

    // TODO: Lint based on config & ignore
};

(() => {
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
        .option("-f, --fix", "Enable automatic fix, if possible (this overwrites original files)", false)
        .option("-c, --colors", "Enable colors in console reporting", true)
        .parse(process.argv);

    // Create an options object from the parsed options
    const cliConfig: LinterCliConfig = {
        fix: !!program.opts().fix,
        colors: !!program.opts().colors,
    };

    // Get file list after options
    const files = program.args;

    // TODO: Handle file ignores
    const ignores = ignore();

    console.log(cliConfig);
    console.log(files);

    const startTime = performance.now();

    // Start linter
    lintDirectory(cwd, merge(defaultCliConfig, cliConfig), ignores);

    console.log(`AGLint runtime: ${performance.now() - startTime} ms`);

    // // TODO: Read config

    // // Create new linter instance
    // const linter = new Linter();

    // // TODO: Read file list from args / process all txt files

    // const problems = linter.lint(readFileSync("src/a.txt").toString(), true);

    // console.log(problems.fixed);

    // for (const problem of problems.problems) {
    //     let message = "";

    //     // Problem type
    //     switch (problem.severity) {
    //         case 1: {
    //             message += chalk.yellow("warning");
    //             break;
    //         }
    //         case 2: {
    //             message += chalk.red("error");
    //             break;
    //         }
    //         case 3: {
    //             message += chalk.bgRed.white("fatal");
    //             break;
    //         }
    //         default: {
    //             message += chalk.red("error");
    //         }
    //     }

    //     message += chalk.gray(": ");

    //     // Problem description
    //     message += chalk.gray(problem.message);

    //     // Problem location
    //     message += chalk.gray(" ");
    //     message += chalk.white(`at line ${problem.position.startLine}`);

    //     if (typeof problem.position.startColumn !== "undefined") {
    //         message += chalk.white(`:${problem.position.startColumn}`);
    //     }

    //     console.error(message);
    // }

    // console.log(`Linter runtime: ${performance.now() - startTime} ms`);
})();
