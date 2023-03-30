import { LinterRule } from '../common';
import { SEVERITY } from '../severity';
import { CommentRuleType, RuleCategory } from '../../parser/common';

const NOT_OPTIMIZED = 'NOT_OPTIMIZED';
const PLATFORM = 'PLATFORM';
const NOT_PLATFORM = 'NOT_PLATFORM';

// https://adguard.com/kb/general/ad-filtering/create-own-filters/#hints
const KNOWN_HINTS = [NOT_OPTIMIZED, PLATFORM, NOT_PLATFORM];

// https://adguard.com/kb/general/ad-filtering/create-own-filters/#platform-and-not_platform-hints
const KNOWN_PLATFORMS = [
    'windows',
    'mac',
    'android',
    'ios',
    'ext_chromium',
    'ext_ff',
    'ext_edge',
    'ext_opera',
    'ext_safari',
    'ext_android_cb',
    'ext_ublock',
];

/**
 * Rule that checks if hints and platforms are known.
 */
export const UnknownHintsAndPlatforms: LinterRule = {
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
                for (const hint of ast.children) {
                    // Check if the hint name is known (case-sensitive)
                    if (!KNOWN_HINTS.includes(hint.name.value)) {
                        context.report({
                            message: `Unknown hint name "${hint.name.value}"`,
                            position: {
                                startLine: line,
                                startColumn: 0,
                                endLine: line,
                                endColumn: raw.length,
                            },
                        });
                    } else if (hint.name.value === PLATFORM || hint.name.value === NOT_PLATFORM) {
                        if (!hint.params || hint.params.children.length === 0) {
                            context.report({
                                message: `Hint "${hint.name.value}" must have at least one platform specified`,
                                position: {
                                    startLine: line,
                                    startColumn: 0,
                                    endLine: line,
                                    endColumn: raw.length,
                                },
                            });
                        } else {
                            for (const param of hint.params.children) {
                                // Check if the platform is known (case sensitive)
                                if (!KNOWN_PLATFORMS.includes(param.value)) {
                                    context.report({
                                        message: `Unknown platform "${param.value}" in hint "${hint.name.value}"`,
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
                    } else if (hint.name.value === NOT_OPTIMIZED) {
                        // If the hint has any parameters, it's invalid, including "NOT_OPTIMIZED()"
                        if (hint.params) {
                            context.report({
                                message: `Hint "${hint.name.value}" must not have any parameters`,
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
