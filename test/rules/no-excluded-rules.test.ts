import { describe, expect, test } from 'vitest';

import { NEWLINE } from '../../src/common/constants';
import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint } from './helpers/lint';

describe('no-excluded-rules', () => {
    test('should match one specified excluded rule', async () => {
        const rulesConfig: LinterRulesConfig = {
            'no-excluded-rules': [
                LinterRuleSeverity.Error,
                {
                    regExpPatterns: [
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
                    regExpPatterns: [
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
