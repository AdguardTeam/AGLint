import chalk from "chalk";
import stripAnsi from "strip-ansi";
import table from "text-table";
import { inflect } from "inflection";
import { LinterProblem, LinterResult } from "../../index";
import { LinterCliReporter } from "../reporter";
import path, { ParsedPath } from "path";
import {
    CLOSE_PARENTHESIS,
    COMMA,
    DOT,
    DOUBLE_NEWLINE,
    EMPTY,
    NEWLINE,
    OPEN_PARENTHESIS,
    SPACE,
} from "src/utils/constants";

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
export class LinterConsoleReporter implements LinterCliReporter {
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
        this.problems[path.join(file.dir, file.base)] = [];
    };

    onFileEnd = (file: ParsedPath, result: LinterResult) => {
        // Initialize the problems array for the file as empty
        this.problems[path.join(file.dir, file.base)].push(...result.problems);

        // Count the problems
        this.warnings += result.warningCount;
        this.errors += result.errorCount;
        this.fatals += result.fatalErrorCount;
    };

    onLintEnd = () => {
        // Calculate the linting time
        const lintTime =
            Math.round(((this.startTime ? performance.now() - this.startTime : 0) + Number.EPSILON) * 100) / 100;

        let output = EMPTY;
        let timeOutput = EMPTY;

        if (lintTime > 0) {
            timeOutput += `Linting took ${this.colors ? chalk.dim(lintTime) : lintTime} ms.`;
        } else {
            timeOutput += this.colors
                ? chalk.red("Error: Could not calculate linting time.")
                : "Error: Could not calculate linting time.";
        }

        // If there are no problems, log that there are no problems
        if (this.warnings === 0 && this.errors === 0 && this.fatals === 0) {
            output += this.colors ? chalk.green("No problems found!") : "No problems found!";
            output += DOUBLE_NEWLINE;
            output += timeOutput;

            console.log(output);
            return;
        }

        // If there are problems, log them to the console
        for (const [file, problems] of Object.entries(this.problems)) {
            // Typically when found problems are fixed
            if (problems.length === 0) {
                continue;
            }

            output += this.colors ? chalk.underline(file) : file;
            output += NEWLINE;

            const rows = [];

            for (const problem of problems) {
                const row = [];

                // Column: Empty column
                row.push(EMPTY);

                // Column: Problem location
                row.push(
                    `${problem.position.startLine}:${
                        problem.position.startColumn !== undefined ? problem.position.startColumn : 0
                    }`
                );

                // Column: Problem type
                switch (problem.severity) {
                    case 1: {
                        row.push(this.colors ? chalk.yellow("warn") : "warn");
                        break;
                    }
                    case 2: {
                        row.push(this.colors ? chalk.red("error") : "error");
                        break;
                    }
                    case 3: {
                        row.push(this.colors ? chalk.red("fatal") : "fatal");
                        break;
                    }
                    default: {
                        row.push(this.colors ? chalk.red("error") : "error");
                    }
                }

                // Column: Problem description
                row.push(this.colors ? chalk.dim(problem.message) : problem.message);

                rows.push(row);
            }

            if (rows.length > 0) {
                output += table(rows, {
                    align: ["l", "c", "l", "l"],
                    stringLength(str: string) {
                        return stripAnsi(str).length;
                    },
                });

                output += DOUBLE_NEWLINE;
            }
        }

        const anyErrors = this.errors > 0 || this.fatals > 0;
        const total = this.warnings + this.errors + this.fatals;

        // Stats
        output += "Found";
        output += SPACE;
        output += this.colors ? chalk[anyErrors ? "red" : "yellow"](total) : total;
        output += SPACE;
        output += inflect("problem", total);

        output += SPACE + OPEN_PARENTHESIS;

        // Warnings
        output += this.colors
            ? chalk.yellow(`${this.warnings} ${inflect("warning", this.warnings)}`)
            : `${this.warnings} ${inflect("warning", this.warnings)}`;

        output += COMMA + SPACE;

        // Errors
        output += this.colors
            ? chalk.red(`${this.errors} ${inflect("error", this.errors)}`)
            : `${this.errors} ${inflect("error", this.errors)}`;

        output += SPACE;
        output += "and";
        output += SPACE;

        // Fatal errors
        output += this.colors
            ? chalk.red(`${this.fatals} fatal ${inflect("error", this.fatals)}`)
            : `${this.fatals} fatal ${inflect("error", this.fatals)}`;

        output += CLOSE_PARENTHESIS + DOT + DOUBLE_NEWLINE;

        // Linting time
        output += timeOutput;

        console[anyErrors ? "error" : "warn"](output);
    };
}
