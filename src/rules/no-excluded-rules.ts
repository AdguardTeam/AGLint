import { type AnyRule, RegExpUtils } from '@adguard/agtree';
import * as v from 'valibot';

import { defineRule, LinterRuleType } from '../linter/rule';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-excluded-rules',
            description: 'Checks if any rule matches an excluded pattern',
            recommended: false,
        },
        messages: {
            excludedPattern: 'Rule matches an excluded pattern: {{pattern}}',
        },
        // TODO: Improve schema with transformation: https://github.com/AdguardTeam/AGLint/issues/217)
        configSchema: v.tuple([
            v.strictObject({
                regExpPatterns: v.pipe(
                    v.fallback(v.array(v.string()), []),
                ),
            }),
        ]),
        hasFix: true,
    },
    create: (context) => {
        const cache: WeakMap<string[], RegExp[]> = new WeakMap();

        const getRegExpList = (): RegExp[] => {
            const patterns = context.config[0].regExpPatterns;

            if (cache.has(patterns)) {
                return cache.get(patterns)!;
            }

            const regexps: RegExp[] = patterns.map(
                (pattern) => {
                    let processedRawPattern = pattern;
                    if (RegExpUtils.isRegexPattern(pattern)) {
                        processedRawPattern = pattern.slice(1, -1);
                    }
                    return new RegExp(processedRawPattern);
                },
            );

            cache.set(patterns, regexps);

            return regexps;
        };

        const handler = (node: AnyRule) => {
            const excludePatterns = getRegExpList();

            for (const pattern of excludePatterns) {
                if (pattern.test(node.raws!.text!)) {
                    context.report({
                        messageId: 'excludedPattern',
                        data: {
                            pattern: pattern.source,
                        },
                        fix(fixer) {
                            const lineNumber = context.sourceCode.getLineNumberForOffset(node.start!);
                            if (!lineNumber) {
                                return null;
                            }
                            const lineRange = context.sourceCode.getLineRange(lineNumber, true);
                            if (!lineRange) {
                                return null;
                            }
                            return fixer.remove(lineRange);
                        },
                        node,
                    });
                    break;
                }
            }
        };

        return {
            'FilterList > [type="Network"]': handler,
            'FilterList > [type="Cosmetic"]': handler,
        };
    },
});
