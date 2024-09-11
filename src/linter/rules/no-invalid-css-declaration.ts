import { CosmeticRuleType, RuleCategory } from '@adguard/agtree';
import { type CssNode, type Declaration } from '@adguard/ecss-tree';

import { type LinterRule } from '../common';
import { SEVERITY } from '../severity';
import { isUndefined } from '../../utils/type-guards';
import { CssTreeParsingContext } from '../helpers/css-tree-types';
import { validateDeclaration } from '../helpers/css-validator';

/**
 * Rule that checks if CSS declarations are valid
 */
export const NoInvalidCssDeclaration: LinterRule = {
    meta: {
        severity: SEVERITY.error,
    },
    events: {
        onRule: (context): void => {
            const ast = context.getActualAdblockRuleAst();

            if (ast.category !== RuleCategory.Cosmetic || ast.type !== CosmeticRuleType.CssInjectionRule) {
                return;
            }

            const rawDeclarationList = ast.body.declarationList;

            if (ast.body.remove !== true && !isUndefined(rawDeclarationList)) {
                const declarationListNode = context.getCssNode(
                    rawDeclarationList,
                    CssTreeParsingContext.DeclarationList,
                );

                if (!declarationListNode) {
                    return;
                }

                declarationListNode.children.forEach((declarationNode: CssNode) => {
                    validateDeclaration(declarationNode as Declaration).forEach((error) => {
                        context.report({
                            message: error.message,
                            // Note: DO NOT use `declarationNode` CSS node here, we should use the AGTree node instead.
                            // Error locations are relative to the AGTree node.
                            node: rawDeclarationList,
                            relativeNodeStartOffset: error.start,
                            relativeNodeEndOffset: error.end,
                        });
                    });
                });
            }
        },
    },
};
