import { RuleCategory } from "../../parser/categories";
import { CommentRuleType } from "../../parser/comment/types";
import { ValidFilterListEntry } from "../../parser/filterlist";
import { LinterContext } from "..";
import { LinterRule, LinterRuleSeverity, LinterRuleType } from "../rule";

const IF_DIRECTIVE = "if";
const ENDIF_DIRECTIVE = "endif";

/** Concreting the storage type definition (the linter only provides a general form where the value is unknown) */
interface RuleStorage {
    openIfs: Array<ValidFilterListEntry>;
}

/** Inserting the storage type definition into the context */
type RuleContext = LinterContext & {
    storage: RuleStorage;
};

export const IfClosed = <LinterRule>{
    meta: {
        type: LinterRuleType.Problem,
        severity: LinterRuleSeverity.Error,
        fixable: false,
    },
    events: {
        onStartFilterList: (context: RuleContext): void => {
            // Each rule ONLY sees its own storage
            context.storage.openIfs = [];
        },
        onRule: (context: RuleContext): void => {
            // Get actually iterated adblock rule
            const entry = context.getActualAdblockRule();
            const { ast, line } = entry;

            if (ast.category == RuleCategory.Comment && ast.type == CommentRuleType.PreProcessor) {
                if (ast.name == IF_DIRECTIVE) {
                    // Collect open "if"
                    context.storage.openIfs.push(entry);
                } else if (ast.name == ENDIF_DIRECTIVE) {
                    if (context.storage.openIfs.length == 0) {
                        context.report({
                            // eslint-disable-next-line max-len
                            message: `Using an "${ENDIF_DIRECTIVE}" directive without an opening "${IF_DIRECTIVE}" directive`,
                            position: {
                                startLine: line,
                                startColumn: 0,
                                endLine: line,
                                endColumn: entry.raw.length,
                            },
                        });
                    } else {
                        // Mark "if" as closed (simply delete it from collection)
                        context.storage.openIfs.pop();
                    }
                }
            }
        },
        onEndFilterList: (context: RuleContext): void => {
            // If there are any collected "if"s, that means they aren't closed, so a problem must be reported for them
            for (const entry of context.storage.openIfs) {
                context.report({
                    message: `Unclosed "${IF_DIRECTIVE}" directive`,
                    position: {
                        startLine: entry.line,
                        startColumn: 0,
                        endLine: entry.line,
                        endColumn: entry.raw.length,
                    },
                });
            }
        },
    },
};
