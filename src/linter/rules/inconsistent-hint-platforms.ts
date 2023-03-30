import { LinterRule } from '../common';
import { SEVERITY } from '../severity';
import { EMPTY } from '../../utils/constants';
import { ArrayUtils } from '../../utils/array';
import { CommentRuleType, RuleCategory } from '../../parser/common';

const PLATFORM = 'PLATFORM';
const NOT_PLATFORM = 'NOT_PLATFORM';

/**
 * Rule that checks if a platform targeted by a PLATFORM() hint is also excluded by a NOT_PLATFORM()
 * hint at the same time.
 */
export const InconsistentHintPlatforms: LinterRule = {
    meta: {
        severity: SEVERITY.error,
    },
    events: {
        onRule: (context): void => {
            // Get actually iterated adblock rule
            const ast = context.getActualAdblockRuleAst();
            const raw = context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            if (ast.category === RuleCategory.Comment && ast.type === CommentRuleType.HintCommentRule) {
                // Only makes sense to check this, if there are at least two hints within the comment
                if (ast.children.length < 2) {
                    return;
                }

                // Collect platforms targeted and excluded by PLATFORM() and NOT_PLATFORM() hints,
                // so we can compare them later
                let targeted: string[] = [];
                let excluded: string[] = [];

                // Iterate over all hints within the comment rule
                for (const hint of ast.children) {
                    if (hint.name.value === PLATFORM) {
                        // Platform targeted by a PLATFORM() hint
                        targeted = targeted.concat(hint.params?.children.map((param) => param.value) ?? []);
                    } else if (hint.name.value === NOT_PLATFORM) {
                        // Platform excluded by a NOT_PLATFORM() hint
                        excluded = excluded.concat(hint.params?.children.map((param) => param.value) ?? []);
                    }
                }

                // Get platforms that are targeted and excluded at the same time
                // and don't forget to filter out empty parameter (if there are any)
                const intersection = ArrayUtils.getIntersection(targeted, excluded);

                // Report problems
                for (const platform of intersection) {
                    // Skip empty parameter
                    if (platform === EMPTY) {
                        continue;
                    }

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
