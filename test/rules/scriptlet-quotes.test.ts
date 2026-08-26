import { QuoteType } from '@adguard/agtree';
import { describe, expect, test } from 'vitest';

import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint, lintWithFixes } from './helpers/lint';

const rulesConfig: LinterRulesConfig = {
    'scriptlet-quotes': [LinterRuleSeverity.Error, {
        adg: QuoteType.Double,
        ubo: QuoteType.None,
        abp: QuoteType.None,
        disallowCurlyQuotes: true,
    }],
};

describe('scriptlet-quotes', () => {
    test('should ignore non-problematic cases', async () => {
        expect((await lint(
            'example.com,~example.net#%#//scriptlet("scriptlet0", "arg0", "arg1")',
            rulesConfig,
        )).problems).toStrictEqual([]);
        expect((await lint(
            'example.com,~example.net##+js(‘scriptlet0‘, ‘arg0‘, ‘arg1‘)',
            rulesConfig,
        )).problems).toStrictEqual([]);
        expect((await lint(
            'example.com,~example.net##+js(scriptlet0, arg0, arg1)',
            rulesConfig,
        )).problems).toStrictEqual([]);
        expect((await lint(
            'example.com,~example.net#$#scriptlet0 arg0 arg1',
            rulesConfig,
        )).problems).toStrictEqual([]);
    });

    test('should detect problematic cases', async () => {
        expect((await lint(
            "example.com,~example.net#%#//scriptlet('scriptlet0', 'arg0', 'arg1')",
            rulesConfig,
        )).problems).toStrictEqual([
            {
                category: 'problem',
                data: {
                    actualQuote: 'single',
                    quote: 'double',
                },
                fix: {
                    range: [
                        39,
                        51,
                    ],
                    text: '"scriptlet0"',
                },
                message: expect.any(String),
                messageId: 'unexpectedQuote',
                position: {
                    end: {
                        column: 51,
                        line: 1,
                    },
                    start: {
                        column: 39,
                        line: 1,
                    },
                },
                ruleId: 'scriptlet-quotes',
                severity: 2,
            },
            {
                category: 'problem',
                data: {
                    actualQuote: 'single',
                    quote: 'double',
                },
                fix: {
                    range: [
                        53,
                        59,
                    ],
                    text: '"arg0"',
                },
                message: expect.any(String),
                messageId: 'unexpectedQuote',
                position: {
                    end: {
                        column: 59,
                        line: 1,
                    },
                    start: {
                        column: 53,
                        line: 1,
                    },
                },
                ruleId: 'scriptlet-quotes',
                severity: 2,
            },
            {
                category: 'problem',
                data: {
                    actualQuote: 'single',
                    quote: 'double',
                },
                fix: {
                    range: [
                        61,
                        67,
                    ],
                    text: '"arg1"',
                },
                message: expect.any(String),
                messageId: 'unexpectedQuote',
                position: {
                    end: {
                        column: 67,
                        line: 1,
                    },
                    start: {
                        column: 61,
                        line: 1,
                    },
                },
                ruleId: 'scriptlet-quotes',
                severity: 2,
            },
        ]);
    });

    test('should detect problematic cases', async () => {
        expect((await lint(
            // eslint-disable-next-line @typescript-eslint/quotes
            "example.com,~example.net#$#‘scriptlet0’ ‘arg0 arg1’",
            rulesConfig,
        )).problems).toStrictEqual([{
            category: 'problem',
            data: undefined,
            fix: {
                range: [
                    27,
                    39,
                ],
                text: 'scriptlet0',
            },
            message: expect.any(String),
            messageId: 'curlyQuotesDisallowed',
            position: {
                end: {
                    column: 39,
                    line: 1,
                },
                start: {
                    column: 27,
                    line: 1,
                },
            },
            ruleId: 'scriptlet-quotes',
            severity: 2,
        }]);
    });

    test('should fix single quotes to double quotes in ADG scriptlets', async () => {
        const result = await lintWithFixes(
            "example.com,~example.net#%#//scriptlet('scriptlet0', 'arg0', 'arg1')",
            rulesConfig,
        );

        expect(result.fixedSource).toBe(
            'example.com,~example.net#%#//scriptlet("scriptlet0", "arg0", "arg1")',
        );
    });

    test('should fix curly quotes in ABP scriptlets', async () => {
        const result = await lintWithFixes(
            // eslint-disable-next-line @typescript-eslint/quotes
            "example.com,~example.net#$#'scriptlet0' 'arg0 arg1'",
            rulesConfig,
        );

        expect(result.fixedSource).toBe(
            'example.com,~example.net#$#scriptlet0 arg0 arg1',
        );
    });

    test('should fix multiple quote issues in complex scriptlet', async () => {
        const result = await lintWithFixes(
            "example.com#%#//scriptlet('remove-class', 'ads', 'div')",
            rulesConfig,
        );

        expect(result.fixedSource).toBe(
            'example.com#%#//scriptlet("remove-class", "ads", "div")',
        );
    });

    test('should not modify content when no fixes are needed', async () => {
        const input = 'example.com,~example.net#%#//scriptlet("scriptlet0", "arg0", "arg1")';
        const result = await lintWithFixes(input, rulesConfig);

        expect(result.fixedSource).toBe(input);
    });
    test('should not modify content when no fixes are needed', async () => {
        const input = 'example.com,~example.net##+js(‘scriptlet0’, ‘arg0’, ‘arg1’)';
        const result = await lintWithFixes(input, rulesConfig);

        expect(result.fixedSource).toBe(
            'example.com,~example.net##+js(scriptlet0, arg0, arg1)',
        );
    });
});
