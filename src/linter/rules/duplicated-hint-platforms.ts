// Linter stuff
import { GenericRuleContext } from "..";
import { LinterRule } from "../rule";
import { SEVERITY } from "../severity";

// Parser stuff
import { AnyRule } from "../../parser";
import { RuleCategory } from "../../parser/categories";
import { CommentRuleType } from "../../parser/comment/types";

const PLATFORM = "PLATFORM";
const NOT_PLATFORM = "NOT_PLATFORM";

/**
 * Rule that checks if a platform is used more than once within the same PLATFORM / NOT_PLATFORM hint.
 */
export const DuplicatedHintPlatforms = <LinterRule>{
    meta: {
        severity: SEVERITY.warn,
    },
    events: {
        onRule: (context: GenericRuleContext): void => {
            // TODO: Remove type assertion
            // Get actually iterated adblock rule
            const ast = <AnyRule>context.getActualAdblockRuleAst();
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            if (ast.category == RuleCategory.Comment && ast.type === CommentRuleType.Hint) {
                // Iterate over all hints within the comment rule
                for (const hint of ast.hints) {
                    // Only makes sense to check this, if the hint is a PLATFORM or NOT_PLATFORM hint
                    // and there are at least two platforms within the hint
                    if ((hint.name !== PLATFORM && hint.name !== NOT_PLATFORM) || hint.params.length < 2) {
                        continue;
                    }

                    // Count the number of various platforms
                    const stats: {
                        [key: string]: number;
                    } = {};

                    // Iterate over all platforms within the hint
                    for (const platform of hint.params) {
                        // Add the platform to the stats if it's not already there
                        if (!(platform in stats)) {
                            stats[platform] = 1;
                        } else {
                            // Increment the counter
                            stats[platform]++;
                        }
                    }

                    // Report problems based on the stats
                    for (const [platform, count] of Object.entries(stats)) {
                        // Report if a platform is occurring more than once
                        if (count > 1) {
                            context.report({
                                // eslint-disable-next-line max-len
                                message: `The platform "${platform}" is occurring more than once within the same "${hint.name}" hint`,
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
            }
        },
    },
};
