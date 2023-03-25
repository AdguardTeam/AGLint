import { SEVERITY } from '../severity';
import { GenericRuleContext, LinterRule } from '../common';
import { AnyRule, CommentRuleType, RuleCategory } from '../../parser/common';

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
export const UnknownPreProcessorDirectives = <LinterRule>{
    meta: {
        severity: SEVERITY.error,
    },
    events: {
        onRule: (context: GenericRuleContext): void => {
            // Get actually iterated adblock rule
            const ast = <AnyRule>context.getActualAdblockRuleAst();
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            // Check if the rule is a preprocessor comment
            if (ast.category === RuleCategory.Comment && ast.type === CommentRuleType.PreProcessorCommentRule) {
                if (!isKnownPreProcessorDirective(ast.name.value)) {
                    context.report({
                        message: `Unknown preprocessor directive "${ast.name.value}"`,
                        position: {
                            startLine: line,
                            startColumn: 0,
                            endLine: line,
                            endColumn: raw.length,
                        },
                    });
                }
            }
        },
    },
};
