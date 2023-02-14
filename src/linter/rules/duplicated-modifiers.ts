// Linter stuff
import { GenericRuleContext } from "..";
import { LinterRule } from "../rule";
import { SEVERITY } from "../severity";

// Parser stuff
import { AnyRule } from "../../parser";
import { RuleCategory } from "../../parser/categories";
import { NetworkRuleType } from "../../parser/network/types";

/**
 * Rule that checks if a network rule contains multiple same modifiers
 */
export const DuplicatedModifiers = <LinterRule>{
    meta: {
        severity: SEVERITY.error,
    },
    events: {
        onRule: (context: GenericRuleContext): void => {
            // Get actually iterated adblock rule
            const ast = <AnyRule>context.getActualAdblockRuleAst();
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            // Check if the rule is an element hiding rule
            if (ast.category == RuleCategory.Network && ast.type === NetworkRuleType.BasicNetworkRule) {
                // Do not report problem for EVERY modifier, just only for the first one
                const alreadyHandledModifiers: string[] = [];

                for (const { modifier } of ast.modifiers) {
                    // Check if the modifier is already handled
                    if (alreadyHandledModifiers.includes(modifier)) {
                        continue;
                    }

                    // Check if the modifier is occurs multiple times
                    const count = ast.modifiers.filter((m) => m.modifier === modifier).length;
                    if (count > 1) {
                        context.report({
                            // eslint-disable-next-line max-len
                            message: `The modifier "${modifier}" is used multiple times, but it should be used only once`,
                            position: {
                                startLine: line,
                                startColumn: 0,
                                endLine: line,
                                endColumn: raw.length,
                            },
                        });
                    }

                    // Add the modifier to the already handled modifiers
                    alreadyHandledModifiers.push(modifier);
                }
            }
        },
    },
};
