import { Struct, enums } from "superstruct";
import cloneDeep from "clone-deep";

// Linter stuff
import { GenericRuleContext, LinterProblemReport } from "..";
import { LinterRule } from "../rule";
import { SEVERITY } from "../severity";

// Parser stuff
import { AnyRule } from "../../parser";
import { RuleCategory } from "../../parser/categories";
import { CosmeticRuleType } from "../../parser/cosmetic/types";
import { ScriptletParameter, ScriptletParameterType } from "../../parser/cosmetic/body/scriptlet";

// Utils
import { AdblockSyntax } from "../../utils/adblockers";
import { StringUtils } from "../../utils/string";

/**
 * Possible quote types
 */
type QuoteType = "none" | "single" | "double";

/**
 * Inserting the storage type definition into the context
 */
type RuleContext = GenericRuleContext & {
    config: QuoteType;
};

/**
 * Converts a quote type to a ScriptletParameterType. For simplicity, we use
 * "none", "single" and "double" as quote types instead of the ScriptletParameterType.
 *
 * @param preferred Preferred quote type
 * @returns ScriptletParameterType
 */
function convertQuoteType(preferred: QuoteType): ScriptletParameterType {
    switch (preferred) {
        case "single":
            return ScriptletParameterType.SingleQuoted;
        case "double":
            return ScriptletParameterType.DoubleQuoted;
        default:
            return ScriptletParameterType.Unquoted;
    }
}

/**
 * Checks if a quote type of a parameter is different from the preferred quote type, but handles
 * some edge cases.
 *
 * @param parameter Scriptlet parameter
 * @param preferred Preferred quote type
 * @returns `true` if the quote type of the parameter is different from the preferred quote type, `false` otherwise
 */
function isQuoteMismatch(parameter: ScriptletParameter, preferred: ScriptletParameterType): boolean {
    if (parameter.type !== preferred) {
        // Ignore regex parameters
        if (parameter.type === ScriptletParameterType.RegExp) {
            return false;
        }

        if (preferred === ScriptletParameterType.SingleQuoted || preferred === ScriptletParameterType.DoubleQuoted) {
            // Parameter can't contain the preferred quote type, so it's fine. For example, if the preferred
            // quote type is single quotes, then the parameter `foo'bar` is fine, because if we change it to
            // `'foo\'bar'`, then its readability will be worse.
            const char = preferred === ScriptletParameterType.SingleQuoted ? "'" : '"';
            return StringUtils.findNextUnescapedCharacter(parameter.value, char) === -1;
        }

        return true;
    }

    return false;
}

/**
 * Rule that checks if a cosmetic rule contains multiple selectors
 */
export const AdgScriptletQuotes = <LinterRule>{
    meta: {
        severity: SEVERITY.warn,
        config: {
            default: "single",
            schema: enums(["none", "single", "double"]) as Struct,
        },
    },
    events: {
        onRule: (context: RuleContext): void => {
            // Get actually iterated adblock rule
            const ast = <AnyRule>context.getActualAdblockRuleAst();
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            // Get preferred quote from linter rule options
            const preferredQuote = convertQuoteType(context.config);

            // Check if a rule is an AdGuard scriptlet rule
            if (
                ast.syntax == AdblockSyntax.Adg &&
                ast.category == RuleCategory.Cosmetic &&
                ast.type == CosmeticRuleType.ScriptletRule
            ) {
                // Any quote mismatch
                let mismatch = false;

                // Scriptlet names doesn't contain quote characters in normal cases,
                // so we don't need to check them here
                if (ast.body.scriptlets[0].scriptlet.type !== preferredQuote) {
                    mismatch = true;
                }

                if (!mismatch && ast.body.scriptlets[0].parameters) {
                    for (const parameter of ast.body.scriptlets[0].parameters) {
                        if (isQuoteMismatch(parameter, preferredQuote)) {
                            mismatch = true;
                            break;
                        }
                    }
                }

                if (mismatch) {
                    let message = "The scriptlet should not use quotes";

                    if (context.config !== "none") {
                        message = `The scriptlet should use ${context.config} quotes`;
                    }

                    // Basic problem report
                    const report = <LinterProblemReport>{
                        message,
                        position: {
                            startLine: line,
                            startColumn: 0,
                            endLine: line,
                            endColumn: raw.length,
                        },
                    };

                    if (context.fixingEnabled()) {
                        report.fix = cloneDeep(ast);

                        // Fix the scriptlet and its parameters
                        report.fix.body.scriptlets[0].scriptlet.type = preferredQuote;

                        if (report.fix.body.scriptlets[0].parameters) {
                            for (const parameter of report.fix.body.scriptlets[0].parameters) {
                                if (isQuoteMismatch(parameter, preferredQuote)) {
                                    parameter.type = preferredQuote;
                                }
                            }
                        }
                    }

                    // Report the problem to the linting context
                    context.report(report);
                }
            }
        },
    },
};
