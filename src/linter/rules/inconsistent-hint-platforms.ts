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
                // Store all affected platforms in an object, where the key is the platform name and the
                // value is a tuple of two booleans, where the first one indicates if the platform is
                // targeted by a PLATFORM hint and the second one indicates if the platform is
                // excluded by a NOT_PLATFORM hint
                const platforms: {
                    [key: string]: [
                        // Targeted by PLATFORM
                        boolean,

                        // Excluded by NOT_PLATFORM
                        boolean
                    ];
                } = {};

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
                                    platforms[param] = [hint.name === PLATFORM, hint.name === NOT_PLATFORM];
                                } else {
                                    // Update the platforms table (leave the other value untouched)
                                    if (hint.name === PLATFORM) {
                                        platforms[param] = [true, platforms[param][1]];
                                    } else {
                                        platforms[param] = [platforms[param][0], true];
                                    }
                                }
                            }
                        }
                    }
                }

                // Report problems based on the platforms table
                for (const [platform, [targeted, excluded]] of Object.entries(platforms)) {
                    // The platform targeted and excluded at the same time
                    if (targeted && excluded) {
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
