import { RuleCategory } from "../../parser/categories";
import { LinterContext } from "..";
import { CosmeticRuleType } from "../../parser/cosmetic/types";
import { LinterRule, LinterRuleSeverity, LinterRuleType } from "../rule";

export const SingleSelector = <LinterRule>{
    meta: {
        type: LinterRuleType.Problem,
        severity: LinterRuleSeverity.Warn,
        // TODO: This issue can be easily fixed, need to implement fixable interface
        fixable: false,
    },
    events: {
        onRule: (context: LinterContext): void => {
            // Get actually iterated adblock rule
            const { ast, line, raw } = context.getActualAdblockRule();

            if (ast.category == RuleCategory.Cosmetic && ast.type == CosmeticRuleType.ElementHidingRule) {
                // The parser separates the selectors, but it is not recommended to use multiple selectors within a rule
                if (ast.body.selectors.length > 1) {
                    context.report({
                        message: "An element hiding rule should contain only one selector",
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
