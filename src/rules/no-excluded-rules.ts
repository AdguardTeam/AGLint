import { type AnyRule, RegExpUtils } from '@adguard/agtree';
import * as v from 'valibot';

import { defineRule, type FixerFunction, LinterRuleType } from '../linter/rule';
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
        configSchema: v.tuple([
            v.strictObject({
                excludedRuleTexts: v.pipe(
                    v.array(v.string()),
                    v.description('List of rule texts to exclude'),
                ),
                excludedRegExpPatterns: v.pipe(
                    v.array(
                        v.pipe(
                            v.string(),
                            v.minLength(1, 'RegExp pattern cannot be empty'),
                            v.transform((pattern) => {
                                return new RegExp(
                                    RegExpUtils.isRegexPattern(pattern)
                                        ? pattern.slice(1, -1)
                                        : pattern,
                                );
                            }),
                        ),
                    ),
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
        const getFixerFunction = (node: AnyRule): FixerFunction => {
            return (fixer) => {
                const lineNumber = context.sourceCode.getLineNumberForOffset(node.start!);

                if (!lineNumber) {
                    return null;
                }

                const lineRange = context.sourceCode.getLineRange(lineNumber, true);

                if (!lineRange) {
                    return null;
                }

                return fixer.remove(lineRange);
            };
        };

        const handler = (node: AnyRule) => {
            const ruleText = node.raws!.text!;

            const { excludedRuleTexts } = context.config[0];

            if (excludedRuleTexts.includes(ruleText)) {
                context.report({
                    messageId: 'excludedRuleText',
                    data: {
                        ruleText,
                    },
                    fix: getFixerFunction(node),
                    node,
                });
            }

            const { excludedRegExpPatterns } = context.config[0];

            for (const regExp of excludedRegExpPatterns) {
                if (!regExp.test(ruleText)) {
                    continue;
                }

                context.report({
                    messageId: 'excludedPattern',
                    data: {
                        pattern: regExp.toString(),
                    },
                    fix: getFixerFunction(node),
                    node,
                });
                break;
            }
        };

        return createVisitorsForAnyValidRule(handler);
    },
});
