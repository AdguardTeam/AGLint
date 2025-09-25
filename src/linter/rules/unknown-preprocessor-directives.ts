import { CommentRuleType, RuleCategory } from '@adguard/agtree';

import { SUPPORTED_PREPROCESSOR_DIRECTIVES } from '../../common/constants';
import { type LinterRule } from '../common';
import { SEVERITY } from '../severity';

/**
 * Checks if a preprocessor directive is known.
 *
 * @param name Preprocessor directive name to check.
 *
 * @returns `true` if the preprocessor directive is known, `false` otherwise.
 */
function isKnownPreProcessorDirective(name: string): boolean {
    return SUPPORTED_PREPROCESSOR_DIRECTIVES.has(name);
}

/**
 * Rule that checks if a preprocessor directive is known.
 *
 * Directives are case-sensitive, so `!#IF` is to be considered as invalid.
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
