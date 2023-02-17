// Linter stuff
import { GenericRuleContext } from "..";
import { LinterRule } from "../rule";
import { SEVERITY } from "../severity";

// Parser stuff
import { AnyRule } from "../../parser";
import { RuleCategory } from "../../parser/categories";
import { CommentRuleType } from "../../parser/comment/types";
import { EMPTY } from "../../utils/constants";

const PLATFORM = "PLATFORM";
const NOT_PLATFORM = "NOT_PLATFORM";

const FLAG_TARGETED = 1;
const FLAG_EXCLUDED = 2;

/**
 * Rule that checks if a platform targeted by a PLATFORM() hint is also excluded by a NOT_PLATFORM()
 * hint at the same time.
 */
export const InconsistentHintPlatforms = <LinterRule>{
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

            if (ast.category == RuleCategory.Comment && ast.type === CommentRuleType.Hint) {
                // Only makes sense to check this, if there are at least two hints within the comment
                if (ast.hints.length < 2) {
                    return;
                }

                // Store all affected platforms in an object, where the key is the platform name and the
                // value is a flag number, where
                //  - the first bit indicates if the platform is targeted by a PLATFORM hint and
                //  - the second bit indicates if the platform is excluded by a NOT_PLATFORM hint
                const platforms: { [key: string]: number } = {};

                // Iterate over all hints within the comment rule
                for (const hint of ast.hints) {
                    if (hint.name === PLATFORM || hint.name === NOT_PLATFORM) {
                        // Check if the PLATFORM or NOT_PLATFORM hint has any parameters. If it
                        // has 1 parameter and it's empty, it means "PLATFORM()" or "NOT_PLATFORM()",
                        // which has no parameters practically
                        if (hint.params.length > 1 || (hint.params.length === 1 && hint.params[0] !== EMPTY)) {
                            for (const param of hint.params) {
                                // Add the platform to the table if it's not already there
                                if (!(param in platforms)) {
                                    platforms[param] = hint.name === PLATFORM ? FLAG_TARGETED : FLAG_EXCLUDED;
                                } else {
                                    // Update the platforms table (leave the other value untouched)
                                    platforms[param] |= hint.name === PLATFORM ? FLAG_TARGETED : FLAG_EXCLUDED;
                                }
                            }
                        }
                    }
                }

                // Report problems based on the platforms table
                for (const [platform, flags] of Object.entries(platforms)) {
                    // The platform targeted and excluded at the same time
                    if (flags === (FLAG_TARGETED | FLAG_EXCLUDED)) {
                        context.report({
                            // eslint-disable-next-line max-len
                            message: `Platform "${platform}" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time`,
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
