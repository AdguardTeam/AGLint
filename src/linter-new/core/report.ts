// core/report.ts
import { isNull } from '../../utils/type-guards';
import { type LinterProblem } from '../linter-problem';
import { type LinterProblemReport, LinterRuleSeverity, type WithMessages } from '../rule';
import { type LinterRuleInstance } from '../rule-registry/rule-instance';

import { type LinterRuntime } from './runtime';

export type LinterReporter = (r: LinterProblemReport, ruleInstance: LinterRuleInstance) => void;

export function createReportFn(rt: LinterRuntime): LinterReporter {
    return (r: LinterProblemReport, ruleInstance: LinterRuleInstance): void => {
        if (ruleInstance.getSeverity() === LinterRuleSeverity.Off) return;

        const pos = r.position ?? (() => {
            const range = rt.getOffsetRangeForNode(r.node);
            if (!range) throw new Error('Node has no offset range');
            const p = rt.sourceCode.getLinterPositionRangeFromOffsetRange(range);
            if (!p) throw new Error('Node has no position');
            return p;
        })();

        let messages: WithMessages;
        if (r.message) messages = { message: r.message };
        else if (r.messageId) messages = { messageId: r.messageId, data: r.data };
        else throw new Error('Report must have either message or messageId');

        const problem: LinterProblem = {
            ruleId: ruleInstance.getId(),
            severity: ruleInstance.getSeverity(),
            position: pos,
            ...messages,
        };

        if (r.fix) {
            if (!ruleInstance.hasFix()) {
                throw new Error(`Rule '${ruleInstance.getId()}' tried to report a fix, but meta.hasFix !== true`);
            }
            const fix = r.fix(rt.fixGen);
            if (!isNull(fix)) problem.fix = fix;
        }

        if (r.suggest) {
            if (!ruleInstance.hasSuggestions()) {
                throw new Error(
                    `Rule '${ruleInstance.getId()}' tried to report suggestions, but meta.hasSuggestions !== true`,
                );
            }
            problem.suggestions = [];
            for (const s of r.suggest) {
                const fix = s.fix(rt.fixGen);
                if (!isNull(fix)) {
                    problem.suggestions.push({ ...s, fix });
                }
            }
        }

        rt.problems.push(problem);
    };
}
