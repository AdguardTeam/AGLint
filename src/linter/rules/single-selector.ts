import cloneDeep from 'clone-deep';
import { CosmeticRuleType, RuleCategory } from '@adguard/agtree';
import { type Selector } from '@adguard/ecss-tree';

import { type LinterProblemReport, type LinterRule } from '../common';
import { SEVERITY } from '../severity';
import { isNull } from '../../utils/type-guards';
import { CssTreeParsingContext } from '../helpers/css-tree-types';
import { generateSelector } from '../helpers/css-generate';

/**
 * Rule that checks if a cosmetic rule contains multiple selectors
 */
export const SingleSelector: LinterRule = {
    meta: {
        severity: SEVERITY.warn,
    },
    events: {
        onRule: (context): void => {
            // Get actually iterated adblock rule
            const ast = context.getActualAdblockRuleAst();

            // Check if the rule is an element hiding rule
            if (ast.category === RuleCategory.Cosmetic && ast.type === CosmeticRuleType.ElementHidingRule) {
                const rawSelectorList = ast.body.selectorList;
                const selectorListNode = context.getCssNode(rawSelectorList, CssTreeParsingContext.SelectorList);

                if (isNull(selectorListNode)) {
                    return;
                }

                // Only makes sense to check this, if there are at least two selectors within the rule
                if (selectorListNode.children.size < 2) {
                    return;
                }

                // Prepare the problem report
                const report: LinterProblemReport = {
                    message: 'An element hiding rule should contain only one selector',
                    node: ast.body.selectorList,
                };

                // Suggest a fix for the problem if the user wants to fix the problem automatically
                if (context.fixingEnabled()) {
                    // Collect selectors into different rules (one selector per rule)
                    report.fix = [];

                    // Iterate over all selectors in the current rule
                    for (const selector of selectorListNode.children) {
                        // Create a new rule with the same properties as the current rule.
                        const clone = cloneDeep(ast);

                        // Replace the selector list with a new selector list containing only
                        // the currently iterated selector
                        clone.body.selectorList.value = generateSelector(selector as Selector);

                        // The only difference is that the new rule only contains one selector,
                        // which has the currently iterated selector in its body.
                        report.fix.push(clone);
                    }
                }

                // Report the problem to the linting context
                context.report(report);
            }
        },
    },
};
