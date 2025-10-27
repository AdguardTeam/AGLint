import { type ConfigCommentRule } from '@adguard/agtree';
import * as v from 'valibot';

import { getErrorMessage } from '../../utils/error';
import { linterRulesConfigSchema } from '../config';
import { LinterConfigCommentType } from '../config-comment-type';
import { type LinterRuntime } from '../core/runtime';
import { LinterRuleSeverity } from '../rule';
import { type LinterPositionRange } from '../source-code/source-code';

/**
 * Represents a disable/enable directive found in inline comments.
 *
 * These directives control which rules are active for specific
 * portions of the source code.
 */
export type DisableComment = {
    /**
     * The type of directive (disable, enable, or disable-next-line).
     */
    command: LinterConfigCommentType;

    /**
     * The position of the directive in the source code.
     */
    position: LinterPositionRange;

    /**
     * Optional specific rule ID that this directive applies to.
     * If omitted, the directive applies to all rules.
     */
    ruleId?: string;

    /**
     * The AST node representing the comment.
     */
    commentNode: ConfigCommentRule;
};

/**
 * Creates a visitor function that processes inline configuration comments.
 *
 * This function handles two types of inline comments:
 * 1. Configuration comments that modify rule settings on-the-fly
 *    (e.g., `! aglint "rule-1": "off"`)
 * 2. Disable/enable directives that control rule activation
 *    (e.g., `! aglint-disable rule-1`, `! aglint-enable`)
 *
 * @param runtime - The linter runtime environment
 *
 * @returns An object containing:
 * - `onConfigComment`: Visitor function to attach to ConfigCommentRule nodes
 * - `disabled`: Array of disable directives found during traversal
 */
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
