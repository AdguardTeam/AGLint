// phase/postprocess.ts
import { LinterInlineDisableApplier } from '../inline-disable-applier';
import { type LinterProblem } from '../linter-problem';
import { LinterRuleSeverity } from '../rule';

import { type DisableComment } from './inline-config';

/**
 * Filters problems based on inline disable directives.
 *
 * Removes problems that are covered by disable directives
 * (e.g., `! Aglint-disable`, `! Aglint-disable-next-line`).
 * Fatal errors are preserved regardless of disable directives..
 *
 * @param problems Array of problems to filter (modified in place).
 * @param directives Array of disable directives found in the source.
 */
export function applyDisableDirectives(
    problems: LinterProblem[],
    directives: DisableComment[],
) {
    const applier = new LinterInlineDisableApplier(directives, { keepFatal: true });
    applier.filterInPlace(problems);
}

/**
 * Counts problems by severity level.
 *
 * Categorizes problems into warnings, errors, and fatal errors
 * for summary reporting.
 *
 * @param problems Array of linter problems to summarize.
 *
 * @returns Object with counts for each severity level.
 */
export function summarize(problems: LinterProblem[]) {
    let warningCount = 0;
    let errorCount = 0;
    let fatalErrorCount = 0;

    for (const problem of problems) {
        if (problem.fatal) {
            fatalErrorCount += 1;
        } else if (problem.severity === LinterRuleSeverity.Warning) {
            warningCount += 1;
        } else if (problem.severity === LinterRuleSeverity.Error) {
            errorCount += 1;
        }
    }
    return {
        warningCount,
        errorCount,
        fatalErrorCount,
    };
}
