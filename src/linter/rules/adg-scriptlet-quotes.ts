import { enums } from "superstruct";
import cloneDeep from "clone-deep";

// Linter stuff
import { GenericRuleContext, LinterProblemReport } from "..";
import { LinterRule } from "../rule";
import { LinterRuleSeverity } from "../severity";

// Parser stuff
import { AnyRule } from "../../parser";
import { RuleCategory } from "../../parser/categories";
import { CosmeticRuleType } from "../../parser/cosmetic/types";
import { ScriptletParameterType } from "../../parser/cosmetic/body/scriptlet";

// Utils
import { AdblockSyntax } from "../../utils/adblockers";

/**
 * Possible quote types (basically same as in the parser, but we ignore regexes here)
 */
type QuoteType =
    | ScriptletParameterType.Unquoted
    | ScriptletParameterType.SingleQuoted
    | ScriptletParameterType.DoubleQuoted;

const CONFIG = {
    default: ScriptletParameterType.SingleQuoted,
    schema: enums([
        ScriptletParameterType.Unquoted,
        ScriptletParameterType.SingleQuoted,
        ScriptletParameterType.DoubleQuoted,
    ]),
};

/**
 * Inserting the storage type definition into the context
 */
type RuleContext = GenericRuleContext & {
    config: QuoteType;
};

/**
 * Rule that checks if a cosmetic rule contains multiple selectors
 */
export const AdgScriptletQuotes = <LinterRule>{
    meta: {
        severity: LinterRuleSeverity.Warn,
        config: CONFIG,
    },
    events: {
        onRule: (context: RuleContext): void => {
            // Get actually iterated adblock rule
            const ast = <AnyRule>context.getActualAdblockRuleAst();
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            // Get preferred quote from linter rule options
            const preferredQuote = context.config || CONFIG.default;

            // Check if a rule is an AdGuard scriptlet rule
            if (
                ast.syntax == AdblockSyntax.Adg &&
                ast.category == RuleCategory.Cosmetic &&
                ast.type == CosmeticRuleType.ScriptletRule
            ) {
                // Any quote mismatch
                let mismatch = false;

                if (ast.body.scriptlets[0].scriptlet.type !== preferredQuote) {
                    mismatch = true;
                }

                if (!mismatch && ast.body.scriptlets[0].parameters) {
                    for (const parameter of ast.body.scriptlets[0].parameters) {
                        if (parameter.type !== preferredQuote && parameter.type !== ScriptletParameterType.RegExp) {
                            mismatch = true;
                            break;
                        }
                    }
                }

                if (mismatch) {
                    // Basic problem report
                    const report = <LinterProblemReport>{
                        message: `The scriptlet should use ${preferredQuote} quotes`,
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
                                if (parameter.type !== ScriptletParameterType.RegExp) {
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
