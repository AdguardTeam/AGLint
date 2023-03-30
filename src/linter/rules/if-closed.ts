import {
    CommentRuleType,
    PreProcessorCommentRule,
    RuleCategory,
} from '../../parser/common';
import {
    LinterPosition,
    LinterRule,
} from '../common';
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
    openIfs: Array<StoredIf>;
}

/**
 * Interface for storing the directive and its position
 */
interface StoredIf {
    /**
     * Position of the directive
     */
    position: LinterPosition;

    /**
     * Collected if directive
     */
    rule: PreProcessorCommentRule;
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
            const ast = context.getActualAdblockRuleAst();
            const raw = context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            // Check adblock rule category and type
            if (ast.category === RuleCategory.Comment && ast.type === CommentRuleType.PreProcessorCommentRule) {
                // Check for "if" and "endif" directives
                if (ast.name.value === IF_DIRECTIVE) {
                    // Collect open "if"
                    context.storage.openIfs.push({
                        position: {
                            startLine: line,
                            startColumn: 0,
                            endLine: line,
                            endColumn: raw.length,
                        },
                        rule: ast,
                    });
                } else if (ast.name.value === ENDIF_DIRECTIVE) {
                    if (context.storage.openIfs.length === 0) {
                        context.report({
                            // eslint-disable-next-line max-len
                            message: `Using an "${ENDIF_DIRECTIVE}" directive without an opening "${IF_DIRECTIVE}" directive`,
                            position: {
                                startLine: line,
                                startColumn: 0,
                                endLine: line,
                                endColumn: raw.length,
                            },
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
            for (const openIf of context.storage.openIfs) {
                context.report({
                    message: `Unclosed "${IF_DIRECTIVE}" directive`,
                    position: openIf.position,
                });
            }
        },
    },
};
