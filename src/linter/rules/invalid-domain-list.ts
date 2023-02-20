// Linter stuff
import { GenericRuleContext } from "..";
import { LinterRule } from "../rule";
import { SEVERITY } from "../severity";

// Parser stuff
import { AnyRule } from "../../parser";
import { RuleCategory } from "../../parser/categories";
import { DomainUtils } from "../../utils/domain";

/**
 * Rule that checks if a preprocessor directive is known
 */
export const InvalidDomainList: LinterRule = {
    meta: {
        severity: SEVERITY.error,
    },
    events: {
        onRule: (context: GenericRuleContext): void => {
            // TODO: Remove type assertion
            // Get actually iterated adblock rule
            const ast = <AnyRule>context.getActualAdblockRuleAst();
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            // Check if the rule is a cosmetic rule (any cosmetic rule)
            if (ast.category === RuleCategory.Cosmetic) {
                for (const { domain } of ast.domains) {
                    if (!DomainUtils.isValidDomainOrHostname(domain)) {
                        context.report({
                            message: `Invalid domain "${domain}"`,
                            position: {
                                startLine: line,
                                startColumn: 0,
                                endLine: line,
                                endColumn: raw.length,
                            },
                        });
                    }
                }
            }
        },
    },
};
