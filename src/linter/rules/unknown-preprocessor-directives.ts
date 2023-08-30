import { CommentRuleType, RuleCategory } from '@adguard/agtree';

import { SEVERITY } from '../severity';
import { type LinterRule } from '../common';

const COMMON_PREPROCESSOR_DIRECTIVES = new Set([
    'if',
    'endif',
    'include',
    'safari_cb_affinity',
]);

/**
 * Checks if a preprocessor directive is known
 *
 * @param name Preprocessor directive name to check
 * @returns `true` if the preprocessor directive is known, `false` otherwise
 */
function isKnownPreProcessorDirective(name: string): boolean {
    return COMMON_PREPROCESSOR_DIRECTIVES.has(name);
}

/**
 * Rule that checks if a preprocessor directive is known
 */
export const UnknownPreProcessorDirectives: LinterRule = {
    meta: {
        severity: SEVERITY.error,
    },
    events: {
        onRule: (context): void => {
            // Get actually iterated adblock rule
            const ast = context.getActualAdblockRuleAst();

            // Check if the rule is a preprocessor comment
            if (ast.category === RuleCategory.Comment && ast.type === CommentRuleType.PreProcessorCommentRule) {
                if (!isKnownPreProcessorDirective(ast.name.value)) {
                    context.report({
                        message: `Unknown preprocessor directive "${ast.name.value}"`,
                        node: ast.name,
                    });
                }
            }
        },
    },
};
