// phase/postprocess.ts
import { LinterInlineDisableApplier } from '../inline-disable-applier';
import { type LinterProblem } from '../linter-problem';
import { LinterRuleSeverity } from '../rule';

import { type DisableComment } from './inline-config';

export function applyDisableDirectives(
    problems: LinterProblem[],
    directives: DisableComment[],
) {
    const applier = new LinterInlineDisableApplier(directives, { keepFatal: true });
    applier.filterInPlace(problems);
}

export function summarize(problems: LinterProblem[]) {
    let warningCount = 0;
    let errorCount = 0;
    let fatalErrorCount = 0;

    for (const problem of problems) {
        if (problem.severity === LinterRuleSeverity.Warning) {
            warningCount += 1;
        } else if (problem.severity === LinterRuleSeverity.Error) {
            errorCount += 1;
        }

        if (problem.fatal) {
            fatalErrorCount += 1;
        }
    }
    return {
        warningCount,
        errorCount,
        fatalErrorCount,
    };
}
