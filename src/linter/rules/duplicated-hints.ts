import { AnyRule, CommentRuleType, RuleCategory } from '../../parser/common';
import { GenericRuleContext, LinterRule } from '../common';
import { SEVERITY } from '../severity';

/**
 * Rule that checks if hints are duplicated within the same comment rule.
 */
export const DuplicatedHints: LinterRule = {
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

            if (ast.category === RuleCategory.Comment && ast.type === CommentRuleType.HintCommentRule) {
                // Only makes sense to check this, if there are at least two hints within the comment
                if (ast.hints.length < 2) {
                    return;
                }

                // Count the number of various hints
                const stats: {
                    [key: string]: number;
                } = {};

                // Iterate over all hints within the comment rule
                for (const hint of ast.hints) {
                    const name = hint.name.value;

                    // Add the hint to the stats if it's not already there
                    if (!(name in stats)) {
                        stats[name] = 1;
                    } else {
                        // Increment the counter
                        stats[name] += 1;
                    }
                }

                // Report problems based on the stats
                for (const [hint, count] of Object.entries(stats)) {
                    // Report if a hint is occurring more than once
                    if (count > 1) {
                        context.report({
                            // eslint-disable-next-line max-len
                            message: `The hint "${hint}" is occurring more than once within the same comment rule`,
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
