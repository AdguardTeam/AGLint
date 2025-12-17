import { describe, expect, test } from 'vitest';

import { NEWLINE } from '../../src/common/constants';
import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint, lintWithFixes } from './helpers/lint';

describe('max-css-selectors', () => {
    test('should ignore non-problematic cases', async () => {
        const rulesConfig: LinterRulesConfig = {
            'max-css-selectors': [
                LinterRuleSeverity.Error,
                {
                    maxSelectors: 1,
                },
            ],
        };

        expect(
            (await lint(
                [
                    'example.com##.ad1',
                    'example.com##.ad2',
                    'example.com##.ad3',
                    'example.com##.ad4',
                    'example.com##.ad5',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([]);
    });

    test('should detect problematic cases', async () => {
        const rulesConfig: LinterRulesConfig = {
            'max-css-selectors': [
                LinterRuleSeverity.Error,
                {
                    maxSelectors: 1,
                },
            ],
        };

        expect(
            (await lint(
                [
                    'example.com##.ad1',
                    'example.com##.ad2,.ad3', // multiple selectors
                    'example.com##.ad4',
                    'example.com##.ad5, .ad6,.ad7', //  multiple selectors
                    'example.com##.ad8',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([
            {
                ruleId: 'max-css-selectors',
                severity: LinterRuleSeverity.Error,
                messageId: 'multipleSelectors',
                data: {
                    count: 2,
                    maxSelectors: 1,
                },
                message: expect.any(String),
                position: {
                    start: {
                        line: 2,
                        column: 13,
                    },
                    end: {
                        column: 22,
                        line: 2,
                    },
                },
                category: 'layout',
                fix: {
                    range: [18, 41],
                    text: 'example.com##.ad2\nexample.com##.ad3\n',
                },
            },
            {
                ruleId: 'max-css-selectors',
                severity: LinterRuleSeverity.Error,
                messageId: 'multipleSelectors',
                data: {
                    count: 3,
                    maxSelectors: 1,
                },
                message: expect.any(String),
                position: {
                    start: {
                        line: 4,
                        column: 13,
                    },
                    end: {
                        column: 28,
                        line: 4,
                    },
                },
                category: 'layout',
                fix: {
                    range: [59, 88],
                    text: 'example.com##.ad5\nexample.com##.ad6\nexample.com##.ad7\n',
                },
            },
        ]);
    });

    test('should fix problematic cases', async () => {
        const rulesConfig: LinterRulesConfig = {
            'max-css-selectors': [
                LinterRuleSeverity.Error,
                {
                    maxSelectors: 1,
                },
            ],
        };

        // No multiple selectors
        expect(
            (await lintWithFixes(
                [
                    'example.com##.ad1',
                    'example.com##.ad2',
                    'example.com##.ad3',
                    'example.com##.ad4',
                    'example.com##.ad5',
                ].join(NEWLINE),
                rulesConfig,
            )).fixedSource,
        ).toBe(
            [
                'example.com##.ad1',
                'example.com##.ad2',
                'example.com##.ad3',
                'example.com##.ad4',
                'example.com##.ad5',
            ].join(NEWLINE),
        );

        // Multiple selectors
        expect(
            (await lintWithFixes(
                [
                    'example.com##.ad1',
                    'example.com##.ad2,.ad3', // multiple selectors
                    'example.com##.ad4',
                    'example.com##.ad5, .ad6,.ad7', //  multiple selectors
                    'example.com##.ad8',
                ].join(NEWLINE),
                rulesConfig,
            )).fixedSource,
        ).toBe(
            [
                'example.com##.ad1',
                'example.com##.ad2',
                'example.com##.ad3',
                'example.com##.ad4',
                'example.com##.ad5',
                'example.com##.ad6',
                'example.com##.ad7',
                'example.com##.ad8',
            ].join(NEWLINE),
        );
    });

    test('should allow configurable max selectors', async () => {
        const rulesConfig: LinterRulesConfig = {
            'max-css-selectors': [
                LinterRuleSeverity.Error,
                {
                    maxSelectors: 2,
                },
            ],
        };

        // Should allow 2 selectors
        expect(
            (await lint(
                [
                    'example.com##.ad1',
                    'example.com##.ad2,.ad3', // 2 selectors - should be OK
                    'example.com##.ad4',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([]);

        // Should report 3 selectors
        expect(
            (await lint(
                [
                    'example.com##.ad1',
                    'example.com##.ad2,.ad3,.ad4', // 3 selectors - should report
                    'example.com##.ad5',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toHaveLength(1);
    });
});
