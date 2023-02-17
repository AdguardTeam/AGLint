// Linter stuff
import { GenericRuleContext } from "..";
import { LinterRule } from "../rule";
import { SEVERITY } from "../severity";

// Parser stuff
import { AnyRule } from "../../parser";
import { RuleCategory } from "../../parser/categories";
import { CommentRuleType } from "../../parser/comment/types";
import { EMPTY } from "../../utils/constants";
import { ArrayUtils } from "../../utils/array";

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
                // Only makes sense to check this, if there are at least two hints within the comment
                if (ast.hints.length < 2) {
                    return;
                }

                // Collect platforms targeted and excluded by PLATFORM() and NOT_PLATFORM() hints,
                // so we can compare them later
                const targeted: string[] = [];
                const excluded: string[] = [];

                // Iterate over all hints within the comment rule
                for (const hint of ast.hints) {
                    if (hint.name === PLATFORM || hint.name === NOT_PLATFORM) {
                        // Check if the PLATFORM or NOT_PLATFORM hint has any parameters. If it
                        // has 1 parameter and it's empty, it means "PLATFORM()" or "NOT_PLATFORM()",
                        // which has no parameters practically
                        if (hint.params.length > 1 || (hint.params.length === 1 && hint.params[0] !== EMPTY)) {
                            for (const param of hint.params) {
                                if (hint.name === PLATFORM) {
                                    // Platform targeted by a PLATFORM() hint
                                    targeted.push(param);
                                } else {
                                    // Platform excluded by a NOT_PLATFORM() hint
                                    excluded.push(param);
                                }
                            }
                        }
                    }
                }

                // Get platforms that are targeted and excluded at the same time
                const intersection = ArrayUtils.getIntersection(targeted, excluded);

                // Report problems
                for (const platform of intersection) {
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
        },
    },
};
