// phase/postprocess.ts
import { LinterInlineDisableApplier, type UnusedDisableDirective } from '../inline-disable-applier';
import { type LinterProblem } from '../linter-problem';
import { LinterRuleSeverity } from '../rule';

import { type DisableComment } from './inline-config';

/**
 * Converts unused disable directives to linter problems.
 *
 * @param unusedDirectives Array of unused disable directives.
 * @param severity Severity level for the problems.
 *
 * @returns Array of linter problems representing unused directives.
 */
function convertUnusedDirectivesToProblems(
    unusedDirectives: UnusedDisableDirective[],
    severity: 'warn' | 'error',
): LinterProblem[] {
    const ruleSeverity = severity === 'warn' ? LinterRuleSeverity.Warning : LinterRuleSeverity.Error;

    return unusedDirectives.map((unused) => {
        const { directive, unusedRuleIds } = unused;

        let message: string;
        if (unusedRuleIds && unusedRuleIds.length > 0) {
            // eslint-disable-next-line max-len
            message = `Unused disable directive for rule${unusedRuleIds.length > 1 ? 's' : ''}: ${unusedRuleIds.join(', ')}`;
        } else {
            message = 'Unused disable directive';
        }

        return {
            ruleId: 'unused-disable-directive',
            message,
            severity: ruleSeverity,
            position: directive.position,
        };
    });
}

/**
 * Filters problems based on inline disable directives.
 *
 * Removes problems that are covered by disable directives
 * (e.g., `! Aglint-disable`, `! Aglint-disable-next-line`).
 * Fatal errors are preserved regardless of disable directives.
 *
 * @param problems Array of problems to filter (modified in place).
 * @param directives Array of disable directives found in the source.
 * @param reportUnused Whether to report unused disable directives.
 * @param severity Severity level for unused directive problems.
 */
export function applyDisableDirectives(
    problems: LinterProblem[],
    directives: DisableComment[],
    reportUnused = false,
    severity: 'warn' | 'error' = 'warn',
) {
    const applier = new LinterInlineDisableApplier(directives, { keepFatal: true });

    if (reportUnused) {
        const { problems: filtered, unusedDirectives } = applier.filterWithUnusedDirectives(problems);
        // Replace problems array contents
        // eslint-disable-next-line no-param-reassign
        problems.length = 0;
        problems.push(...filtered, ...convertUnusedDirectivesToProblems(unusedDirectives, severity));
    } else {
        applier.filterInPlace(problems);
    }
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
