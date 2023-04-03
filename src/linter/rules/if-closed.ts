import {
    CommentRuleType,
    PreProcessorCommentRule,
    RuleCategory,
} from '../../parser/common';
import { LinterRule } from '../common';
import { SEVERITY } from '../severity';

const IF_DIRECTIVE = 'if';
const ENDIF_DIRECTIVE = 'endif';

/**
 * Concreting the storage type definition (the linter only provides a general
 * form where the value type is unknown)
 */
interface Storage {
    /**
     * Array of all open if directives
     */
    openIfs: PreProcessorCommentRule[];
}

/**
 * Rule that checks if all if directives are closed
 */
export const IfClosed: LinterRule<Storage> = {
    meta: {
        severity: SEVERITY.error,
    },
    events: {
        onStartFilterList: (context): void => {
            // Each rule ONLY sees its own storage. At the beginning of the filter list,
            // we just initialize the storage.
            context.storage.openIfs = [];
        },
        onRule: (context): void => {
            // Get actually iterated adblock rule
            const rule = context.getActualAdblockRuleAst();

            // Check adblock rule category and type
            if (rule.category === RuleCategory.Comment && rule.type === CommentRuleType.PreProcessorCommentRule) {
                // Check for "if" and "endif" directives
                if (rule.name.value === IF_DIRECTIVE) {
                    // Collect open "if"
                    context.storage.openIfs.push(rule);
                } else if (rule.name.value === ENDIF_DIRECTIVE) {
                    if (context.storage.openIfs.length === 0) {
                        context.report({
                            // eslint-disable-next-line max-len
                            message: `Using an "${ENDIF_DIRECTIVE}" directive without an opening "${IF_DIRECTIVE}" directive`,
                            node: rule,
                        });
                    } else {
                        // Mark "if" as closed (simply delete it from collection)
                        context.storage.openIfs.pop();
                    }
                }
            }
        },
        onEndFilterList: (context): void => {
            // If there are any collected "if"s, that means they aren't closed, so a problem must be reported for them
            for (const rule of context.storage.openIfs) {
                context.report({
                    message: `Unclosed "${IF_DIRECTIVE}" directive`,
                    node: rule,
                });
            }
        },
    },
};
