import path, { type ParsedPath } from 'node:path';

import { Chalk, type ChalkInstance, type Options as ChalkOptions } from 'chalk';
import { inflect } from 'inflection';
import stripAnsi from 'strip-ansi';
import terminalLink from 'terminal-link';
import table from 'text-table';

import {
    CLOSE_PARENTHESIS,
    COMMA,
    DOT,
    DOUBLE_NEWLINE,
    EMPTY,
    NEWLINE,
    OPEN_PARENTHESIS,
    SPACE,
} from '../../common/constants';
import { type AnyLinterResult } from '../../linter/fixer';
import { type LinterProblem } from '../../linter/linter-problem';
import { type LinterRuleMetaSerializable, LinterRuleSeverity } from '../../linter/rule';

import { type LinterCliReporter } from './reporter';

const ALIGN_LEFT = 'l';
const ALIGN_CENTER = 'c';

/**
 * Type for the collected problems, where the key is the file path and the value
 * is an array of problems.
 */
type CollectedProblems = { [key: string]: LinterProblem[] };

/**
 * Type for the collected metadata from all linter results.
 */
type CollectedMetadata = { [ruleId: string]: LinterRuleMetaSerializable };

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
     * Custom Chalk instance to use for coloring the console output.
     */
    private chalk: ChalkInstance;

    /**
     * Total number of warnings.
     */
    private warnings = 0;

    /**
     * Total number of errors.
     */
    private errors = 0;

    /**
     * Total number of fatal errors.
     */
    private fatalErrors = 0;

    /**
     * Creates a new console reporter instance.
     *
     * @param colors Whether to use colors in the console output or not.
     */
    constructor(colors = true) {
        // By default, Chalk determines the color support automatically, but we
        // want to disable colors if the user doesn't want them.
        const chalkOptions: ChalkOptions = colors ? {} : { level: 0 };

        this.chalk = new Chalk(chalkOptions);
    }

    /**
     * Collected problems, where the key is the file path and the value is an array of problems.
     * We only collect problems here, we don't log them, because we want to log them in the end.
     */
    private problems: CollectedProblems = {};

    /**
     * Collected metadata from all linter results.
     */
    private metadata: CollectedMetadata = {};

    /** @inheritdoc */
    onCliStart = () => {
        // Save the start time
        this.startTime = performance.now();
    };

    /** @inheritdoc */
    onFileStart = (file: ParsedPath) => {
        // Initialize the problems array for the file as empty
        this.problems[path.join(file.dir, file.base)] = [];
    };

    /** @inheritdoc */
    onFileEnd = (file: ParsedPath, result: AnyLinterResult) => {
        // Initialize the problems array for the file as empty
        this.problems[path.join(file.dir, file.base)]?.push(...result.problems);

        // Collect metadata if available
        if (result.metadata) {
            Object.assign(this.metadata, result.metadata);
        }

        // Count the problems
        this.warnings += result.warningCount;
        this.errors += result.errorCount;
        this.fatalErrors += result.fatalErrorCount;
    };

    /** @inheritdoc */
    onCliEnd = () => {
        // Calculate the linting time
        // eslint-disable-next-line max-len
        const lintTime = Math.round(((this.startTime ? performance.now() - this.startTime : 0) + Number.EPSILON) * 100) / 100;

        let output = EMPTY;
        let timeOutput = EMPTY;

        if (lintTime > 0) {
            timeOutput += `Linting took ${this.chalk.dim(lintTime)} ms.`;
        } else {
            timeOutput += this.chalk.red('Error: Could not calculate linting time.');
        }

        // If there are no problems, log that there are no problems
        if (this.warnings === 0 && this.errors === 0 && this.fatalErrors === 0) {
            output += this.chalk.green('No problems found!');
            output += DOUBLE_NEWLINE;
            output += timeOutput;

            // eslint-disable-next-line no-console
            console.log(output);
            return;
        }

        let fixableWarnings = 0;
        let fixableErrors = 0;

        // If there are problems, log them to the console
        // Sort files to keep the order consistent even if multiple threads are used
        const sortedFiles = Object.entries(this.problems).sort((a, b) => a[0].localeCompare(b[0]));

        for (const [file, problems] of sortedFiles) {
            // Typically when found problems are fixed
            if (problems.length === 0) {
                continue;
            }

            output += this.chalk.underline(file);
            output += NEWLINE;

            const rows = [];

            for (const problem of problems) {
                const row: string[] = [];

                // Column 1: Empty column
                row.push(EMPTY);

                // Column 2: Problem location
                row.push(`${problem.position.start.line}:${problem.position.start.column}`);

                if (problem.fatal) {
                    row.push(this.chalk.red('fatal'));
                } else if (problem.severity === LinterRuleSeverity.Warning) {
                    row.push(this.chalk.yellow('warn'));
                    if (problem.fix) {
                        fixableWarnings += 1;
                    }
                } else if (problem.severity === LinterRuleSeverity.Error) {
                    row.push(this.chalk.red('error'));
                    if (problem.fix) {
                        fixableErrors += 1;
                    }
                }

                // Column 4: Problem description
                row.push(problem.message);

                // Column 5: Linter rule name (if available)
                if (problem.ruleId) {
                    // Some terminals support links, so we can link to the rule documentation directly
                    // in this case.
                    if (terminalLink.isSupported) {
                        // Try to get URL from metadata first, fallback to undefined
                        const ruleUrl = this.metadata[problem.ruleId]?.docs?.url;
                        if (ruleUrl) {
                            row.push(terminalLink(problem.ruleId, ruleUrl));
                        } else {
                            row.push(this.chalk.dim(problem.ruleId));
                        }
                    } else {
                        row.push(this.chalk.dim(problem.ruleId));
                    }
                } else {
                    row.push(EMPTY);
                }

                rows.push(row);
            }

            if (rows.length > 0) {
                output += table(rows, {
                    align: [ALIGN_LEFT, ALIGN_CENTER, ALIGN_LEFT, ALIGN_LEFT, ALIGN_LEFT],
                    stringLength(str: string) {
                        return stripAnsi(str).length;
                    },
                });

                output += DOUBLE_NEWLINE;
            }
        }

        const anyErrors = this.errors > 0 || this.fatalErrors > 0;
        const total = this.warnings + this.errors + this.fatalErrors;

        // Stats
        output += 'Found';
        output += SPACE;
        output += this.chalk[anyErrors ? 'red' : 'yellow'](total);
        output += SPACE;
        output += inflect('problem', total);

        output += SPACE + OPEN_PARENTHESIS;

        // Warnings
        output += this.chalk.yellow(`${this.warnings} ${inflect('warning', this.warnings)}`);

        output += COMMA + SPACE;

        // Errors
        output += this.chalk.red(`${this.errors} ${inflect('error', this.errors)}`);

        output += SPACE;
        output += 'and';
        output += SPACE;

        // Fatal errors
        output += this.chalk.red(`${this.fatalErrors} fatal ${inflect('error', this.fatalErrors)}`);

        output += CLOSE_PARENTHESIS + DOT + NEWLINE;

        // show 0 errors and 1 warning potentially fixable with the `--fix` option.
        if (fixableWarnings > 0 || fixableErrors > 0) {
            const fixableParts = [];

            if (fixableWarnings > 0) {
                fixableParts.push(this.chalk.yellow(`${fixableWarnings} ${inflect('warning', fixableWarnings)}`));
            }

            if (fixableErrors > 0) {
                fixableParts.push(this.chalk.red(`${fixableErrors} ${inflect('error', fixableErrors)}`));
            }

            output += fixableParts.join(' and ');
            output += SPACE;
            output += 'potentially fixable with the `--fix` option.';
            output += NEWLINE;
        }

        output += NEWLINE;

        // Linting time
        output += timeOutput;

        // eslint-disable-next-line no-console
        console[anyErrors ? 'error' : 'warn'](output);
    };
}
