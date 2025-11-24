import { type AnyRule, RegExpUtils } from '@adguard/agtree';
import * as v from 'valibot';

import { defineRule, LinterRuleType } from '../linter/rule';
import { createVisitorsForAnyValidRule } from '../linter/visitor-creator';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-excluded-rules',
            description: 'Checks if any rule matches an excluded pattern',
            recommended: false,
            url: getBuiltInRuleDocumentationUrl('no-excluded-rules'),
        },
        messages: {
            excludedRuleText: 'Rule matches an excluded rule text: {{ruleText}}',
            excludedPattern: 'Rule matches an excluded pattern: {{pattern}}',
        },
        // TODO: Improve schema with transformation: https://github.com/AdguardTeam/AGLint/issues/217)
        configSchema: v.tuple([
            v.strictObject({
                excludedRuleTexts: v.pipe(
                    v.array(v.string()),
                    v.description('List of rule texts to exclude'),
                ),
                excludedRegExpPatterns: v.pipe(
                    v.array(v.string()),
                    v.description('List of RegExp patterns to exclude'),
                ),
            }),
        ]),
        defaultConfig: [
            {
                excludedRuleTexts: [],
                excludedRegExpPatterns: [],
            },
        ],
        correctExamples: [
            {
                name: 'No excluded rules',
                code: [
                    '||example.com^',
                ].join('\n'),
            },
        ],
        incorrectExamples: [
            {
                name: '`||example.com^` rule is excluded',
                code: [
                    '||example.com^',
                    '||example.org^',
                ].join('\n'),
                config: [
                    {
                        excludedRuleTexts: [
                            '||example.com^',
                        ],
                        excludedRegExpPatterns: [],
                    },
                ],
            },
            {
                name: 'Rules containing `.org` are excluded',
                code: [
                    '||example.com^',
                    '||example.org^',
                ].join('\n'),
                config: [
                    {
                        excludedRuleTexts: [],
                        excludedRegExpPatterns: ['\\.org'],
                    },
                ],
            },
        ],
        hasFix: true,
        version: '2.0.10',
    },
    create: (context) => {
        const cache: WeakMap<string[], RegExp[]> = new WeakMap();

        const getRegExpList = (): RegExp[] => {
            const patterns = context.config[0].excludedRegExpPatterns;

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
            const excludeRuleTexts = context.config[0].excludedRuleTexts;

            if (excludeRuleTexts.includes(node.raws!.text!)) {
                context.report({
                    messageId: 'excludedRuleText',
                    data: {
                        ruleText: node.raws!.text!,
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
            }

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

        return createVisitorsForAnyValidRule(handler);
    },
});
