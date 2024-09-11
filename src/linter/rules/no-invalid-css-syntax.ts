import { CosmeticRuleType, RuleCategory } from '@adguard/agtree';

import { type LinterRule } from '../common';
import { SEVERITY } from '../severity';
import { isUndefined } from '../../utils/type-guards';
import { CssTreeParsingContext } from '../helpers/css-tree-types';

/**
 * Rule that checks if all CSS is syntactically valid
 */
export const NoInvalidCssSyntax: LinterRule = {
    meta: {
        severity: SEVERITY.error,
    },
    events: {
        onRule: (context): void => {
            const ast = context.getActualAdblockRuleAst();

            if (ast.category !== RuleCategory.Cosmetic) {
                return;
            }

            if (ast.type === CosmeticRuleType.ElementHidingRule) {
                const rawSelectorList = ast.body.selectorList;
                context.getCssNode(rawSelectorList, CssTreeParsingContext.SelectorList);
            } else if (ast.type === CosmeticRuleType.CssInjectionRule) {
                const rawSelectorList = ast.body.selectorList;
                context.getCssNode(rawSelectorList, CssTreeParsingContext.SelectorList);

                const rawDeclarationList = ast.body.declarationList;
                if (ast.body.remove !== true && !isUndefined(rawDeclarationList)) {
                    context.getCssNode(rawDeclarationList, CssTreeParsingContext.DeclarationList);
                }
            }
        },
    },
};
