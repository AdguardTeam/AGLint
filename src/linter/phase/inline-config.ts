import { type ConfigCommentRule } from '@adguard/agtree';
import * as v from 'valibot';

import { getErrorMessage } from '../../utils/error';
import { linterRulesConfigSchema } from '../config';
import { LinterConfigCommentType } from '../config-comment-type';
import { type LinterRuntime } from '../core/runtime';
import { LinterRuleSeverity } from '../rule';
import { type LinterPositionRange } from '../source-code/source-code';

export type DisableComment = {
    command: LinterConfigCommentType;
    position: LinterPositionRange;
    ruleId?: string;
    commentNode: ConfigCommentRule;
};

export function makeConfigCommentVisitor(runtime: LinterRuntime) {
    const disabled: DisableComment[] = [];
    const toPos = (node: any) => {
        const range = runtime.getOffsetRangeForNode(node)!;
        return runtime.sourceCode.getLinterPositionRangeFromOffsetRange(range)!;
    };

    const onConfigComment = (node: ConfigCommentRule) => {
        const cmd = node.command.value;

        if (cmd === LinterConfigCommentType.Main) {
            // e.g. `! aglint` - it does not make sense, so we just ignore it
            if (!node.params || node.params.type !== 'ConfigNode') {
                return;
            }

            // Apply config comment
            // e.g. `! aglint "rule-1": ["warn", { "option1": "value1" }], "rule-2": "off"`
            try {
                const rulesConfig = v.parse(linterRulesConfigSchema, node.params.value);
                runtime.ruleRegistry.applyConfig(rulesConfig);
            } catch (e) {
                runtime.problems.push({
                    severity: LinterRuleSeverity.Error,
                    message: getErrorMessage(e),
                    position: toPos(node),
                    fatal: true,
                });
            }
            return;
        }

        if (
            cmd !== LinterConfigCommentType.Disable
            && cmd !== LinterConfigCommentType.DisableNextLine
            && cmd !== LinterConfigCommentType.Enable
        ) {
            return;
        }

        // Disable / Enable / DisableNextLine
        const push = (ruleId?: string) => {
            disabled.push({
                command: cmd,
                position: toPos(node.params && ruleId ? node.params : node),
                ruleId,
                commentNode: node,
            });
        };

        if (node.params?.type === 'ParameterList') {
            // e.g. `! aglint-disable rule-1 rule-2`
            for (const p of node.params.children) {
                if (p) push(p.value);
            }
        } else {
            // e.g. `! aglint-disable`
            push();
        }
    };

    return { onConfigComment, disabled };
}
