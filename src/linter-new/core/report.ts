// core/report.ts
import { isNull } from '../../utils/type-guards';
import { type LinterProblem } from '../linter-problem';
import { type LinterProblemReport, LinterRuleSeverity, type WithMessages } from '../rule';
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

        let messages: WithMessages;

        if (report.message) {
            messages = {
                message: report.message,
            };
        } else if (report.messageId) {
            messages = {
                messageId: report.messageId,
                data: report.data,
            };
        } else {
            // This should never happen if the report is properly constructed
            throw new Error('Report must have either message or messageId');
        }

        const problem: LinterProblem = {
            ruleId: ruleInstance.getId(),
            severity: ruleInstance.getSeverity(),
            position,
            ...messages,
        };

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

            for (const suggestion of report.suggest) {
                const fix = suggestion.fix(runtime.fixGenerator);

                if (isNull(fix)) {
                    continue;
                }

                problem.suggestions.push({
                    ...suggestion,
                    fix,
                });
            }
        }

        problem.category = ruleInstance.getType();

        runtime.problems.push(problem);
    };
}
