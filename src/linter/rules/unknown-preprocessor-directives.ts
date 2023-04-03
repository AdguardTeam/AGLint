import { SEVERITY } from '../severity';
import { LinterRule } from '../common';
import { CommentRuleType, RuleCategory } from '../../parser/common';

const COMMON_PREPROCESSOR_DIRECTIVES = [
    'if',
    'endif',
    'include',
    'safari_cb_affinity',
];

/**
 * Checks if a preprocessor directive is known
 *
 * @param name Preprocessor directive name to check
 * @returns `true` if the preprocessor directive is known, `false` otherwise
 */
function isKnownPreProcessorDirective(name: string): boolean {
    return COMMON_PREPROCESSOR_DIRECTIVES.includes(name);
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
