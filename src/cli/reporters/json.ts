import path, { type ParsedPath } from 'node:path';

import { type AnyLinterResult } from '../../linter/fixer';

import { type LinterCliReporter } from './reporter';

/**
 * Type for the result object where keys are file paths and values are linter results.
 */
type JsonReporterOutput = { [filePath: string]: AnyLinterResult };

/**
 * JSON reporter that outputs linting results as a JSON object.
 *
 * The output is a JSON object where:
 * - Keys are absolute file paths
 * - Values are linter results (problems, counts, etc.)
 * - Keys are sorted alphabetically for consistent output.
 */
export class LinterJsonReporter implements LinterCliReporter {
    /**
     * Collected results, where the key is the file path and the value is the linter result.
     */
    private results: JsonReporterOutput = {};

    /** @inheritdoc */
    onFileEnd = (file: ParsedPath, result: AnyLinterResult) => {
        const filePath = path.join(file.dir, file.base);
        this.results[filePath] = result;
    };

    /** @inheritdoc */
    onCliEnd = () => {
        // Sort keys alphabetically and create sorted output
        const sortedKeys = Object.keys(this.results).sort((a, b) => a.localeCompare(b));
        const sortedResults: JsonReporterOutput = {};

        for (const key of sortedKeys) {
            sortedResults[key] = this.results[key]!;
        }

        // Output as JSON
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(sortedResults, null, 2));
    };
}
