import { describe, expect, test } from 'vitest';

import { NEWLINE } from '../../src/common/constants';
import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint } from './helpers/lint';

describe('no-excluded-rules', () => {
    test('should match exact excluded rule texts', async () => {
        const rulesConfig: LinterRulesConfig = {
            'no-excluded-rules': [
                LinterRuleSeverity.Error,
                {
                    excludedRuleTexts: [
                        'example.com/exact/match/',
                    ],
                },
            ],
        };

        // Zero bad rules
        expect(
            (await lint(
                [
                    'example.com/good/query/',
                    'example.com/another-not-bad/query/',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([]);

        // One bad rule (exact match)
        expect(
            (await lint(
                [
                    'example.com/good/query/',
                    'example.com/exact/match/',
                    'example.com/another-not-bad/query/',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([
            {
                ruleId: 'no-excluded-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'excludedRuleText',
                data: {
                    ruleText: 'example.com/exact/match/',
                },
                fix: {
                    range: [24, 49],
                    text: '',
                },
                message: 'Rule matches an excluded rule text: example.com/exact/match/',
                position: {
                    start: {
                        line: 2,
                        column: 0,
                    },
                    end: {
                        line: 2,
                        column: 24,
                    },
                },
                category: 'problem',
            },
        ]);

        // Multiple bad same rules
        expect(
            (await lint(
                [
                    'example.com/exact/match/',
                    'example.com/good/query/',
                    'example.com/exact/match/',
                    'example.com/another-not-bad/query/',
                    'example.com/exact/match/',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([
            {
                ruleId: 'no-excluded-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'excludedRuleText',
                data: {
                    ruleText: 'example.com/exact/match/',
                },
                fix: {
                    range: [0, 25],
                    text: '',
                },
                message: 'Rule matches an excluded rule text: example.com/exact/match/',
                position: {
                    start: {
                        line: 1,
                        column: 0,
                    },
                    end: {
                        line: 1,
                        column: 24,
                    },
                },
                category: 'problem',
            },
            {
                ruleId: 'no-excluded-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'excludedRuleText',
                data: {
                    ruleText: 'example.com/exact/match/',
                },
                fix: {
                    range: [49, 74],
                    text: '',
                },
                message: 'Rule matches an excluded rule text: example.com/exact/match/',
                position: {
                    start: {
                        line: 3,
                        column: 0,
                    },
                    end: {
                        line: 3,
                        column: 24,
                    },
                },
                category: 'problem',
            },
            {
                ruleId: 'no-excluded-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'excludedRuleText',
                data: {
                    ruleText: 'example.com/exact/match/',
                },
                fix: {
                    range: [109, 133],
                    text: '',
                },
                message: 'Rule matches an excluded rule text: example.com/exact/match/',
                position: {
                    start: {
                        line: 5,
                        column: 0,
                    },
                    end: {
                        line: 5,
                        column: 24,
                    },
                },
                category: 'problem',
            },
        ]);

        // Should not match partial strings
        expect(
            (await lint(
                [
                    'example.com/exact/match/more',
                    '||example.com/exact/match/',
                    'example.com/exact/match',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([]);
    });

    test('should match multiple different excluded rule texts', async () => {
        const rulesConfig: LinterRulesConfig = {
            'no-excluded-rules': [
                LinterRuleSeverity.Error,
                {
                    excludedRuleTexts: [
                        'example.com##.ad',
                        '||ads.example.com^',
                        '@@||example.com/whitelist^',
                    ],
                },
            ],
        };

        // Zero bad rules
        expect(
            (await lint(
                [
                    'example.com##.banner',
                    '||tracking.example.com^',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([]);

        // Three different bad rules
        expect(
            (await lint(
                [
                    'example.com##.ad',
                    'example.com##.banner',
                    '||ads.example.com^',
                    '@@||example.com/whitelist^',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([
            {
                ruleId: 'no-excluded-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'excludedRuleText',
                data: {
                    ruleText: 'example.com##.ad',
                },
                fix: {
                    range: [0, 17],
                    text: '',
                },
                message: 'Rule matches an excluded rule text: example.com##.ad',
                position: {
                    start: {
                        line: 1,
                        column: 0,
                    },
                    end: {
                        line: 1,
                        column: 16,
                    },
                },
                category: 'problem',
            },
            {
                ruleId: 'no-excluded-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'excludedRuleText',
                data: {
                    ruleText: '||ads.example.com^',
                },
                fix: {
                    range: [38, 57],
                    text: '',
                },
                message: 'Rule matches an excluded rule text: ||ads.example.com^',
                position: {
                    start: {
                        line: 3,
                        column: 0,
                    },
                    end: {
                        line: 3,
                        column: 18,
                    },
                },
                category: 'problem',
            },
            {
                ruleId: 'no-excluded-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'excludedRuleText',
                data: {
                    ruleText: '@@||example.com/whitelist^',
                },
                fix: {
                    range: [57, 83],
                    text: '',
                },
                message: 'Rule matches an excluded rule text: @@||example.com/whitelist^',
                position: {
                    start: {
                        line: 4,
                        column: 0,
                    },
                    end: {
                        line: 4,
                        column: 26,
                    },
                },
                category: 'problem',
            },
        ]);
    });

    test('should match one specified excluded rule', async () => {
        const rulesConfig: LinterRulesConfig = {
            'no-excluded-rules': [
                LinterRuleSeverity.Error,
                {
                    excludedRegExpPatterns: [
                        String.raw`example\.com\/bad\/query\/`,
                    ],
                },
            ],
        };

        // Zero bad rules
        expect(
            (await lint(
                [
                    'example.com/good/query/',
                    'example.com/another-not-bad/query/',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([]);

        // One bad rule
        expect(
            (await lint(
                [
                    'example.com/good/query/',
                    'example.com/bad/query/',
                    'example.com/another-not-bad/query/',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([
            {
                ruleId: 'no-excluded-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'excludedPattern',
                data: {
                    pattern: String.raw`example\.com\/bad\/query\/`,
                },
                fix: {
                    range: [24, 47],
                    text: '',
                },
                message: 'Rule matches an excluded pattern: example\\.com\\/bad\\/query\\/',
                position: {
                    start: {
                        line: 2,
                        column: 0,
                    },
                    end: {
                        line: 2,
                        column: 22,
                    },
                },
                category: 'problem',
            },
        ]);

        // Multiple bad same rules
        expect(
            (await lint(
                [
                    'example.com/bad/query/',
                    'example.com/good/query/',
                    'example.com/bad/query/',
                    'example.com/another-not-bad/query/',
                    'example.com/bad/query/',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([
            {
                ruleId: 'no-excluded-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'excludedPattern',
                data: {
                    pattern: String.raw`example\.com\/bad\/query\/`,
                },
                fix: {
                    range: [0, 23],
                    text: '',
                },
                message: 'Rule matches an excluded pattern: example\\.com\\/bad\\/query\\/',
                position: {
                    start: {
                        line: 1,
                        column: 0,
                    },
                    end: {
                        line: 1,
                        column: 22,
                    },
                },
                category: 'problem',
            },
            {
                ruleId: 'no-excluded-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'excludedPattern',
                data: {
                    pattern: String.raw`example\.com\/bad\/query\/`,
                },
                fix: {
                    range: [47, 70],
                    text: '',
                },
                message: 'Rule matches an excluded pattern: example\\.com\\/bad\\/query\\/',
                position: {
                    start: {
                        line: 3,
                        column: 0,
                    },
                    end: {
                        line: 3,
                        column: 22,
                    },
                },
                category: 'problem',
            },
            {
                ruleId: 'no-excluded-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'excludedPattern',
                data: {
                    pattern: String.raw`example\.com\/bad\/query\/`,
                },
                fix: {
                    range: [105, 127],
                    text: '',
                },
                message: 'Rule matches an excluded pattern: example\\.com\\/bad\\/query\\/',
                position: {
                    start: {
                        line: 5,
                        column: 0,
                    },
                    end: {
                        line: 5,
                        column: 22,
                    },
                },
                category: 'problem',
            },
        ]);
    });

    test('should match different specified excluded rules', async () => {
        const rulesConfig: LinterRulesConfig = {
            'no-excluded-rules': [
                LinterRuleSeverity.Error,
                {
                    excludedRegExpPatterns: [
                        String.raw`example\.(com|org)\/bad\/query\/`,
                    ],
                },
            ],
        };

        // Zero bad rules
        expect(
            (await lint(
                [
                    'example.com/good/query/',
                    'example.com/another-not-bad/query/',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([]);

        // Two bad rules
        expect(
            (await lint(
                [
                    'example.com/good/query/',
                    'example.com/bad/query/',
                    'example.com/another-not-bad/query/',
                    'example.org/bad/query/',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([
            {
                ruleId: 'no-excluded-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'excludedPattern',
                message: 'Rule matches an excluded pattern: example\\.(com|org)\\/bad\\/query\\/',
                data: {
                    pattern: String.raw`example\.(com|org)\/bad\/query\/`,
                },
                fix: {
                    range: [24, 47],
                    text: '',
                },
                position: {
                    start: {
                        line: 2,
                        column: 0,
                    },
                    end: {
                        line: 2,
                        column: 22,
                    },
                },
                category: 'problem',
            },
            {
                ruleId: 'no-excluded-rules',
                severity: LinterRuleSeverity.Error,
                messageId: 'excludedPattern',
                message: 'Rule matches an excluded pattern: example\\.(com|org)\\/bad\\/query\\/',
                fix: {
                    range: [82, 104],
                    text: '',
                },
                data: {
                    pattern: String.raw`example\.(com|org)\/bad\/query\/`,
                },
                position: {
                    start: {
                        line: 4,
                        column: 0,
                    },
                    end: {
                        line: 4,
                        column: 22,
                    },
                },
                category: 'problem',
            },
        ]);
    });
});
