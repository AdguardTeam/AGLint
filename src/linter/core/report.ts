// core/report.ts
import { isNull } from '../../utils/type-guards';
import { type LinterProblem, type LinterSuggestion } from '../linter-problem';
import { type LinterProblemReport, LinterRuleSeverity } from '../rule';
import { type LinterRuleInstance } from '../rule-registry/rule-instance';
import { type LinterPositionRange } from '../source-code/source-code';

import { type LinterRuntime } from './runtime';

export type LinterReporter = (report: LinterProblemReport, ruleInstance: LinterRuleInstance) => void;

export function createReportFn(runtime: LinterRuntime): LinterReporter {
    return (report: LinterProblemReport, ruleInstance: LinterRuleInstance): void => {
        // Probably rule is disabled meantime with config comment
        if (ruleInstance.getSeverity() === LinterRuleSeverity.Off) {
            return;
        }

        let position: LinterPositionRange;

        // prefer position over node
        if (report.position) {
            position = report.position;
        } else {
            const range = runtime.getOffsetRangeForNode(report.node);
            if (!range) {
                throw new Error('Node has no offset range');
            }

            const pos = runtime.sourceCode.getLinterPositionRangeFromOffsetRange(range);
            if (!pos) {
                throw new Error('Node has no position');
            }
            position = pos;
        }

        const problem: LinterProblem = {
            ruleId: ruleInstance.getId(),
            severity: ruleInstance.getSeverity(),
            position,
            message: ruleInstance.getMessage(report),
        };

        if (process.env.NODE_ENV === 'test') {
            problem.messageId = report.messageId;
            problem.data = report.data;
        }

        if (report.fix) {
            if (!ruleInstance.hasFix()) {
                throw new Error(
                    // eslint-disable-next-line max-len
                    `Rule '${ruleInstance.getId()}' tried to report a fix, but its meta does not specify that it has a fix`,
                );
            }

            const fix = report.fix(runtime.fixGenerator);

            if (!isNull(fix)) {
                problem.fix = fix;
            }
        }

        if (report.suggest) {
            if (!ruleInstance.hasSuggestions()) {
                throw new Error(
                    // eslint-disable-next-line max-len
                    `Rule '${ruleInstance.getId()}' tried to report suggestions, but its meta does not specify that it has suggestions`,
                );
            }

            problem.suggestions = [];

            for (const suggest of report.suggest) {
                const fix = suggest.fix(runtime.fixGenerator);

                if (isNull(fix)) {
                    continue;
                }

                const suggestion: LinterSuggestion = {
                    message: ruleInstance.getMessage(suggest),
                    fix,
                };

                if (process.env.NODE_ENV === 'test') {
                    suggestion.messageId = suggest.messageId;
                    suggestion.data = suggest.data;
                }

                problem.suggestions.push(suggestion);
            }
        }

        problem.category = ruleInstance.getType();

        runtime.problems.push(problem);
    };
}
