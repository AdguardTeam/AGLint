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
    }],
};

describe('scriptlet-quotes', () => {
    test('should ignore non-problematic cases', async () => {
        expect((await lint(
            'example.com,~example.net#%#//scriptlet("scriptlet0", "arg0", "arg1")',
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

    test('treats curly quotes as plain values for ABP syntax', async () => {
        expect((await lint(
            // eslint-disable-next-line @typescript-eslint/quotes
            "example.com,~example.net#$#‘scriptlet0’ ‘arg0 arg1’",
            rulesConfig,
        )).problems).toStrictEqual([]);
    });

    test('reports ADG curly quotes as a fatal parse error', async () => {
        const result = await lint(
            'example.com,~example.net#%#//scriptlet(“scriptlet0”)',
            rulesConfig,
        );

        expect(result.fatalErrorCount).toBe(1);
        expect(result.problems[0]!.message).toContain('expected quote');
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

    test('preserves quoted content when fixing quotes', async () => {
        const input = "example.org#%#//scriptlet('trusted-set-constant', 'ads_stop', '\"true\"')";
        const result = await lintWithFixes(input, rulesConfig);

        expect(result.fixedSource).toBe(
            'example.org#%#//scriptlet("trusted-set-constant", "ads_stop", "\\"true\\"")',
        );
    });

    test('does not apply a backtick fix for ADG scriptlets', async () => {
        const input = "example.com#%#//scriptlet('set-constant', 'foo', 'bar')";
        const result = await lintWithFixes(input, {
            'scriptlet-quotes': [LinterRuleSeverity.Error, {
                adg: QuoteType.Backtick,
                ubo: QuoteType.None,
                abp: QuoteType.None,
            }],
        });

        expect(result.fixedSource).toBe(input);
        expect(result.problems.length).toBeGreaterThan(0);
    });

    test('does not drop quotes that keep argument boundaries', async () => {
        const input = "example.com##+js(set-constant, 'a,b', c)";
        const result = await lintWithFixes(input, rulesConfig);

        expect(result.fixedSource).toBe(input);
        expect(result.problems.length).toBeGreaterThan(0);
    });
});
