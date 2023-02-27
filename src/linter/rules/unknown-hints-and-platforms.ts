// Linter stuff
import { GenericRuleContext } from '..';
import { LinterRule } from '../rule';
import { SEVERITY } from '../severity';

// Parser stuff
import { AnyRule } from '../../parser';
import { RuleCategory } from '../../parser/categories';
import { CommentRuleType } from '../../parser/comment/types';
import { EMPTY } from '../../utils/constants';

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
        onRule: (context: GenericRuleContext): void => {
            // TODO: Remove type assertion
            // Get actually iterated adblock rule
            const ast = <AnyRule>context.getActualAdblockRuleAst();
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            if (ast.category === RuleCategory.Comment && ast.type === CommentRuleType.Hint) {
                for (const hint of ast.hints) {
                    // Check if the hint name is known (case-sensitive)
                    if (!KNOWN_HINTS.includes(hint.name)) {
                        context.report({
                            message: `Unknown hint name "${hint.name}"`,
                            position: {
                                startLine: line,
                                startColumn: 0,
                                endLine: line,
                                endColumn: raw.length,
                            },
                        });
                    } else if (hint.name === PLATFORM || hint.name === NOT_PLATFORM) {
                        // No parameters means "PLATFORM", but if the first parameter is empty, it means "PLATFORM()"
                        // Both are invalid, because they don't specify any platform
                        if (hint.params.length === 0 || (hint.params.length === 1 && hint.params[0] === EMPTY)) {
                            context.report({
                                message: `Hint "${hint.name}" must have at least one platform specified`,
                                position: {
                                    startLine: line,
                                    startColumn: 0,
                                    endLine: line,
                                    endColumn: raw.length,
                                },
                            });
                        } else {
                            for (const param of hint.params) {
                                // Check if the platform is known (case sensitive)
                                if (!KNOWN_PLATFORMS.includes(param)) {
                                    context.report({
                                        message: `Unknown platform "${param}" in hint "${hint.name}"`,
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
                    } else if (hint.name === NOT_OPTIMIZED) {
                        // If the hint has any parameters, it's invalid, including "NOT_OPTIMIZED()"
                        if (hint.params.length !== 0) {
                            context.report({
                                message: `Hint "${hint.name}" must not have any parameters`,
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
