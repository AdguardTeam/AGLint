import { describe, expect, test } from 'vitest';

import { NEWLINE } from '../../src/common/constants';
import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint, lintWithFixes } from './helpers/lint';

describe('no-css-comments', () => {
    test('should ignore non-problematic cases', async () => {
        const rulesConfig: LinterRulesConfig = {
            'no-css-comments': LinterRuleSeverity.Error,
        };

        expect(
            (await lint(
                [
                    'example.com##.ad1',
                    'example.com##.ad2, .ad3',
                    'example.com#$#.ad4 { display: none; }',
                    'example.com##.ad5:style(display: none;)',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toStrictEqual([]);
    });

    test('should detect problematic cases', async () => {
        const rulesConfig: LinterRulesConfig = {
            'no-css-comments': LinterRuleSeverity.Error,
        };

        expect(
            (await lint(
                [
                    'example.com##.ad1',
                    'example.com##.ad2 /* comment */',
                    'example.com##.ad4',
                    'example.com##.ad5, .ad6,/* comment */.ad7',
                    'example.com##.ad8',
                ].join(NEWLINE),
                rulesConfig,
            )).problems,
        ).toMatchObject([
            {
                ruleId: 'no-css-comments',
                severity: 2,
                position: {
                    start: {
                        line: 2,
                        column: 18,
                    },
                    end: {
                        line: 2,
                        column: 31,
                    },
                },
                messageId: 'noComments',
                fix: {
                    range: [
                        36,
                        49,
                    ],
                    text: '',
                },
                category: 'layout',
            },
            {
                ruleId: 'no-css-comments',
                severity: 2,
                position: {
                    start: {
                        line: 4,
                        column: 24,
                    },
                    end: {
                        line: 4,
                        column: 37,
                    },
                },
                messageId: 'noComments',
                fix: {
                    range: [
                        92,
                        105,
                    ],
                    text: '',
                },
                category: 'layout',
            },
        ]);
    });

    test('should fix problematic cases', async () => {
        const rulesConfig: LinterRulesConfig = {
            'no-css-comments': LinterRuleSeverity.Error,
        };

        // No multiple selectors
        expect(
            (await lintWithFixes(
                [
                    'example.com##.ad1 /* comment */',
                    'example.com##.ad2, /* comment */ .ad3',
                    'example.com#$#.ad4 { /* comment */ display: none; /* comment */ }',
                    'example.com##.ad5:style(display: none; /* comment */)',
                ].join(NEWLINE),
                rulesConfig,
            )).fixedSource,
        ).toBe(
            [
                // note: this rule do not remove unneeded spaces, it should be fixed by other rules
                'example.com##.ad1 ',
                'example.com##.ad2,  .ad3',
                'example.com#$#.ad4 {  display: none;  }',
                'example.com##.ad5:style(display: none; )',
            ].join(NEWLINE),
        );
    });
});
