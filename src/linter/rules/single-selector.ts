// Linter stuff
import { LinterContext, LinterProblemReport } from "..";
import { LinterRule, LinterRuleSeverity, LinterRuleType } from "../rule";

// Parser stuff
import { AnyRule } from "../../parser";
import { RuleCategory } from "../../parser/categories";
import { CosmeticRuleType } from "../../parser/cosmetic/types";

/**
 * Rule that checks if a cosmetic rule contains multiple selectors
 */
export const SingleSelector = <LinterRule>{
    meta: {
        type: LinterRuleType.Problem,
        severity: LinterRuleSeverity.Warn,
    },
    events: {
        onRule: (context: LinterContext): void => {
            // Get actually iterated adblock rule
            const ast = <AnyRule>context.getActualAdblockRuleAst();
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            // Check if the rule is an element hiding rule
            if (ast.category == RuleCategory.Cosmetic && ast.type == CosmeticRuleType.ElementHidingRule) {
                // The parser separates the selectors, but it is not recommended to use multiple selectors within a rule
                if (ast.body.selectors.length > 1) {
                    // Basic problem report
                    const report = <LinterProblemReport>{
                        message: "An element hiding rule should contain only one selector",
                        position: {
                            startLine: line,
                            startColumn: 0,
                            endLine: line,
                            endColumn: raw.length,
                        },
                    };

                    // Suggest a fix for the problem if the user wants to fix the problem automatically
                    if (context.fixingEnabled()) {
                        // Collect selectors into different rules (one selector per rule)
                        report.fix = [];

                        // Iterate over all selectors in the current rule
                        for (const selector of ast.body.selectors) {
                            // Create a new rule with the same properties as the current rule.
                            // The only difference is that the new rule only contains one selector,
                            // which has the currently iterated selector in its body.
                            report.fix.push({
                                // Copy all properties from the current rule
                                ...ast,

                                // Simply replace the selectors array with a new array containing only the
                                // currently iterated selector
                                body: {
                                    selectors: [{ ...selector }],
                                },
                            });
                        }
                    }

                    // Report the problem to the linting context
                    context.report(report);
                }
            }
        },
    },
};
