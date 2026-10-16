import { type CommentRule } from '@adguard/agtree';
import * as v from 'valibot';

import { getErrorMessage } from '../../utils/error';
import { linterRulesConfigSchema } from '../config';
import { parseConfigComment } from '../config-comment';
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
};

/**
 * Creates a visitor function that processes inline configuration comments.
 *
 * This function handles two types of inline comments:
 * 1. Configuration comments that modify rule settings on-the-fly
 *    (e.g., `! Aglint "rule-1": "off"`)
 * 2. Disable/enable directives that control rule activation
 *    (e.g., `! Aglint-disable rule-1`, `! Aglint-enable`).
 *
 * @param runtime The linter runtime environment.
 *
 * @returns An object containing:
 * - `onComment`: Visitor function to attach to CommentRule nodes
 * - `disabled`: Array of disable directives found during traversal.
 */
export function createConfigCommentVisitor(runtime: LinterRuntime) {
    const disabled: DisableComment[] = [];

    const toPos = (node: { start?: number; end?: number }) => {
        const range = runtime.getOffsetRangeForNode(node);

        if (!range) {
            return null;
        }

        return runtime.sourceCode.getLinterPositionRangeFromOffsetRange(range);
    };

    const reportError = (message: string, node: { start?: number; end?: number }) => {
        const position = toPos(node);

        if (!position) {
            return;
        }

        runtime.problems.push({
            severity: LinterRuleSeverity.Error,
            message,
            position,
            fatal: true,
        });
    };

    const onComment = (node: CommentRule) => {
        let parsed;

        try {
            parsed = parseConfigComment(node);
        } catch (e) {
            reportError(getErrorMessage(e), node);
            return;
        }

        if (!parsed) {
            return;
        }

        const cmd = parsed.command.value;

        if (cmd === LinterConfigCommentType.Main) {
            // e.g. `! aglint "rule": "off"` - apply config from this point
            if (!parsed.params || parsed.params.type !== 'ConfigNode') {
                return;
            }

            try {
                const rulesConfig = v.parse(linterRulesConfigSchema, parsed.params.value);
                runtime.ruleRegistry.applyConfig(rulesConfig);
            } catch (e) {
                reportError(getErrorMessage(e), node);
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
            const position = toPos(parsed.params && ruleId ? parsed.params : node);

            if (!position) {
                return;
            }

            disabled.push({
                command: cmd,
                position,
                ruleId,
            });
        };

        if (parsed.params?.type === 'ParameterList') {
            // e.g. `! aglint-disable rule-1, rule-2`
            for (const p of parsed.params.children) {
                push(p.value);
            }
        } else {
            // e.g. `! aglint-disable`
            push();
        }
    };

    return { onComment, disabled };
}
