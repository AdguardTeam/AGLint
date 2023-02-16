// Linter stuff
import { GenericRuleContext } from "..";
import { LinterRule } from "../rule";
import { SEVERITY } from "../severity";

// Parser stuff
import { AnyRule } from "../../parser";
import { RuleCategory } from "../../parser/categories";
import { NetworkRuleType } from "../../parser/network/types";
import { DASH, EMPTY } from "../../utils/constants";
import { StringUtils } from "../../utils/string";

/**
 * Checks if a modifier name is valid
 *
 * @param modifier Modifier name
 * @returns `true` if the modifier name is valid, `false` otherwise
 */
function isValidModifierName(modifier: string): boolean {
    // Modifier name shouldn't start or end with a dash
    if (modifier.startsWith(DASH) || modifier.endsWith(DASH)) {
        return false;
    }

    // A valid modifier name should contain only:
    // - lowercase letters or
    // - numbers or
    // - dashes, but not at the beginning or end of the name, and not two dashes after each other
    return modifier
        .split(EMPTY)
        .every(
            (char, idx) =>
                StringUtils.isSmallLetter(char) ||
                StringUtils.isDigit(char) ||
                (char === DASH && modifier[idx - 1] !== DASH)
        );
}

/**
 * Rule that detects if a network rule modifier name is invalid
 */
export const InvalidModifierName = <LinterRule>{
    meta: {
        severity: SEVERITY.error,
    },
    events: {
        onRule: (context: GenericRuleContext): void => {
            // TODO: Remove type assertions
            // Get actually iterated adblock rule
            const ast = <AnyRule>context.getActualAdblockRuleAst();
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            // Check if the rule is an element hiding rule
            if (ast.category == RuleCategory.Network && ast.type === NetworkRuleType.BasicNetworkRule) {
                for (const { modifier } of ast.modifiers) {
                    if (!isValidModifierName(modifier)) {
                        context.report({
                            message: `Name of the modifier "${modifier}" has invalid format`,
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
