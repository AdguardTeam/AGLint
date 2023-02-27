// Linter stuff
import { SEVERITY } from '../severity';

// Parser stuff
import { AnyRule } from '../../parser';
import { RuleCategory } from '../../parser/categories';
import { CommentRuleType } from '../../parser/comment/types';
import { CLOSE_PARENTHESIS, EMPTY, OPEN_PARENTHESIS } from '../../utils/constants';
import { GenericRuleContext, LinterRule } from '../common';

const COMMON_PREPROCESSOR_DIRECTIVES = [
    'if',
    'endif',
    'include',
];

// Special case: Safari Content Blocker Affinity
const SAFARI_CB_AFFINITY = 'safari_cb_affinity';

/**
 * Checks if a preprocessor directive is known
 *
 * @param name Preprocessor directive name to check
 * @returns `true` if the preprocessor directive is known, `false` otherwise
 */
function isKnownPreProcessorDirective(name: string): boolean {
    if (COMMON_PREPROCESSOR_DIRECTIVES.includes(name)) {
        return true;
    }

    // Special case: safari_cb_affinity and safari_cb_affinity(params) are also valid
    if (name.startsWith(SAFARI_CB_AFFINITY)) {
        const params = name.substring(SAFARI_CB_AFFINITY.length);
        return params === EMPTY || (params.startsWith(OPEN_PARENTHESIS) && params.endsWith(CLOSE_PARENTHESIS));
    }

    return false;
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
            if (ast.category === RuleCategory.Comment && ast.type === CommentRuleType.PreProcessor) {
                if (!isKnownPreProcessorDirective(ast.name)) {
                    context.report({
                        message: `Unknown preprocessor directive "${ast.name}"`,
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
