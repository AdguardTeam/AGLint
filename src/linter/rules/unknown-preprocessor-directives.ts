// Linter stuff
import { GenericRuleContext } from "..";
import { LinterRule } from "../rule";
import { SEVERITY } from "../severity";

// Parser stuff
import { AnyRule } from "../../parser";
import { RuleCategory } from "../../parser/categories";
import { CommentRuleType } from "../../parser/comment/types";

const KNOWN_PREPROCESSOR_DIRECTIVES = ["if", "endif", "include"];

/**
 * Rule that checks if a preprocessor directive is known
 */
export const UnknownPreProcessorDirectives = <LinterRule>{
    meta: {
        severity: SEVERITY.error,
    },
    events: {
        onRule: (context: GenericRuleContext): void => {
            // Get actually iterated adblock rule
            const ast = <AnyRule>context.getActualAdblockRuleAst();
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            // Check if the rule is a preprocessor comment
            if (ast.category == RuleCategory.Comment && ast.type === CommentRuleType.PreProcessor) {
                if (!KNOWN_PREPROCESSOR_DIRECTIVES.includes(ast.name)) {
                    context.report({
                        message: `Unknown preprocessor directive "${
                            ast.name
                        }", known preprocessor directives are: ${KNOWN_PREPROCESSOR_DIRECTIVES.join(", ")}`,
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
