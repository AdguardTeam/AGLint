import chalk from "chalk";
import { LinterProblem, LinterResult } from "../../index";
import { LinterCliReporter } from "../reporter";
import { ParsedPath } from "path";

/**
 * Type for the collected problems, where the key is the file path and the value
 * is an array of problems.
 */
type CollectedProblems = { [key: string]: LinterProblem[] };

/**
 * Implements a simple reporter that logs the problems to the console.
 * You can implement any reporter you want, as long as it implements the
 * `LinterCliReporter` interface.
 */
export class ConsoleReporter implements LinterCliReporter {
    /**
     * We save the start time here, so we can calculate the total time at the end.
     */
    private startTime: number | null = null;

    /**
     * Total number of warnings
     */
    private warnings = 0;

    /**
     * Total number of errors
     */
    private errors = 0;

    /**
     * Total number of fatal errors
     */
    private fatals = 0;

    /**
     * Creates a new console reporter instance.
     *
     * @param colors Whether to use colors in the console output or not
     */
    constructor(private readonly colors: boolean = true) {}

    /**
     * Collected problems, where the key is the file path and the value is an array of problems.
     * We only collect problems here, we don't log them, because we want to log them in the end.
     */
    private problems: CollectedProblems = {};

    onLintStart = () => {
        // Save the start time
        this.startTime = performance.now();
    };

    onFileStart = (file: ParsedPath) => {
        // Initialize the problems array for the file as empty
        this.problems[file.base] = [];
    };

    onFileEnd = (file: ParsedPath, result: LinterResult) => {
        // Initialize the problems array for the file as empty
        this.problems[file.base].push(...result.problems);

        // Count the problems
        this.warnings += result.warningCount;
        this.errors += result.errorCount;
        this.fatals += result.fatalErrorCount;
    };

    onLintEnd = () => {
        // Calculate the linting time
        const lintTime = this.startTime ? performance.now() - this.startTime : 0;

        // If there are no problems, log that there are no problems
        if (Object.keys(this.problems).length === 0) {
            console.log(this.colors ? chalk.green("No problems found!") : "No problems found!");
            return;
        }

        // If there are problems, log them to the console
        for (const [file, problems] of Object.entries(this.problems)) {
            console.log(
                this.colors
                    ? chalk.red(`Found ${problems.length} problems in ${file}:`)
                    : `Found ${problems.length} problems in ${file}:`
            );

            for (const problem of problems) {
                let message = "";

                // Problem location
                message += "  ";

                message += problem.position.startLine;

                if (typeof problem.position.startColumn !== "undefined") {
                    message += ":";
                    message += problem.position.startColumn;
                }

                message += "\t";

                // Problem type
                switch (problem.severity) {
                    case 1: {
                        message += this.colors ? chalk.yellow("warning") : "warning";
                        break;
                    }
                    case 2: {
                        message += this.colors ? chalk.red("error") : "error";
                        break;
                    }
                    case 3: {
                        message += this.colors ? chalk.bgRed.white("fatal") : "fatal";
                        break;
                    }
                    default: {
                        message += this.colors ? chalk.red("error") : "error";
                    }
                }

                message += "\t";

                // Problem description
                message += this.colors ? chalk.gray(problem.message) : problem.message;

                // Log problem to console
                console.error(message);
            }

            console.log();
        }

        // Log stats
        let stats = "";
        stats += "Found ";
        stats += this.colors ? chalk.yellow(`${this.warnings} warnings`) : `${this.warnings} warnings`;
        stats += ", ";
        stats += this.colors ? chalk.red(`${this.errors} errors`) : `${this.errors} errors`;
        stats += " and ";
        stats += this.colors ? chalk.bgRed.white(`${this.fatals} fatal errors`) : `${this.fatals} fatal errors`;
        stats += ".";

        console.log(stats);
        console.log();

        // Log the linting time
        if (lintTime > 0) {
            console.log(`Linting took ${lintTime} ms.`);
        } else {
            console.log("Error: Could not calculate linting time.");
        }
    };
}
