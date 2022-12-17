/** AGLint CLI */

// TODO: dev run
// node --no-warnings --loader ts-node/esm --experimental-specifier-resolution=node cli.ts

import chalk from "chalk";

// TODO: commander

// import globPkg from "glob";
// const { glob } = globPkg;

import { readFileSync } from "fs";

// ! It is important that the CLI invokes everything via AGLint root, so
// ! please don't call anything directly from the library source files!
import { Linter } from ".";

// TODO: Find config file
// TODO: Yaml config?
// const findConfigFile = () => {

// }

(() => {
    const startTime = performance.now();

    // TODO: Read config

    // Create new linter instance
    const linter = new Linter();

    // TODO: Read file list from args / process all txt files

    const problems = linter.lint(readFileSync("src/a.txt").toString(), true);

    console.log(problems.fixed);

    for (const problem of problems.problems) {
        let message = "";

        // Problem type
        switch (problem.severity) {
            case 1: {
                message += chalk.yellow("warning");
                break;
            }
            case 2: {
                message += chalk.red("error");
                break;
            }
            case 3: {
                message += chalk.bgRed.white("fatal");
                break;
            }
            default: {
                message += chalk.red("error");
            }
        }

        message += chalk.gray(": ");

        // Problem description
        message += chalk.gray(problem.message);

        // Problem location
        message += chalk.gray(" ");
        message += chalk.white(`at line ${problem.position.startLine}`);

        if (typeof problem.position.startColumn !== "undefined") {
            message += chalk.white(`:${problem.position.startColumn}`);
        }

        console.error(message);
    }

    console.log(`Linter runtime: ${performance.now() - startTime} ms`);
})();
