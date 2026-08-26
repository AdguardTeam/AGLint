import {
    describe,
    expect,
    it,
    test,
} from 'vitest';

import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint } from './helpers/lint';

const rulesConfig: LinterRulesConfig = {
    'no-invalid-scriptlets': LinterRuleSeverity.Error,
};

describe('no-invalid-scriptlets', () => {
    describe('valid scriptlets', () => {
        test('should not report valid AdGuard scriptlets', async () => {
            await expect(
                lint('example.com#%#//scriptlet("set-constant", "foo", "1")', rulesConfig),
            ).resolves.toHaveProperty('problems', []);

            await expect(
                lint('example.com#%#//scriptlet("log-addEventListener")', rulesConfig),
            ).resolves.toHaveProperty('problems', []);

            await expect(
                lint('example.com#%#//scriptlet("abort-on-property-read", "foo")', rulesConfig),
            ).resolves.toHaveProperty('problems', []);
        });

        test('should not report valid uBlock Origin scriptlets', async () => {
            await expect(
                lint('example.com##+js(set.js, foo, 1)', rulesConfig),
            ).resolves.toHaveProperty('problems', []);

            await expect(
                lint('example.com##+js(no-fetch-if.js, foo)', rulesConfig),
            ).resolves.toHaveProperty('problems', []);
        });

        test('should not report valid Adblock Plus scriptlets', async () => {
            await expect(
                lint('example.com#$#override-property-read foo 1', rulesConfig),
            ).resolves.toHaveProperty('problems', []);

            await expect(
                lint('example.com#$#abort-on-property-read foo', rulesConfig),
            ).resolves.toHaveProperty('problems', []);
        });
    });

    describe('unknown scriptlets', () => {
        it('should detect unknown AdGuard scriptlets', async () => {
            const result = await lint(
                'example.com#%#//scriptlet("unknown-scriptlet", "foo", "bar")',
                rulesConfig,
            );

            expect(result.problems).toStrictEqual([
                {
                    category: 'problem',
                    ruleId: 'no-invalid-scriptlets',
                    severity: LinterRuleSeverity.Error,
                    messageId: 'unknownScriptlet',
                    message: expect.any(String),
                    data: {
                        scriptlet: 'unknown-scriptlet',
                        platform: expect.any(String),
                    },
                    position: {
                        start: {
                            column: 14,
                            line: 1,
                        },
                        end: {
                            column: 60,
                            line: 1,
                        },
                    },
                    suggestions: [],
                },
            ]);
        });

        it('should detect unknown uBlock Origin scriptlets', async () => {
            const result = await lint(
                'example.com##+js(unknown-scriptlet.js, foo, bar)',
                rulesConfig,
            );

            expect(result.problems).toStrictEqual([
                {
                    category: 'problem',
                    ruleId: 'no-invalid-scriptlets',
                    severity: LinterRuleSeverity.Error,
                    messageId: 'unknownScriptlet',
                    message: expect.any(String),
                    data: {
                        scriptlet: 'unknown-scriptlet.js',
                        platform: expect.any(String),
                    },
                    position: {
                        start: {
                            column: 13,
                            line: 1,
                        },
                        end: {
                            column: 48,
                            line: 1,
                        },
                    },
                    suggestions: [],
                },
            ]);
        });

        it('should detect unknown Adblock Plus scriptlets', async () => {
            const result = await lint(
                'example.com#$#unknown-scriptlet foo bar',
                rulesConfig,
            );

            expect(result.problems).toStrictEqual([
                {
                    category: 'problem',
                    ruleId: 'no-invalid-scriptlets',
                    severity: LinterRuleSeverity.Error,
                    messageId: 'unknownScriptlet',
                    message: expect.any(String),
                    data: {
                        scriptlet: 'unknown-scriptlet',
                        platform: expect.any(String),
                    },
                    position: {
                        start: {
                            column: 14,
                            line: 1,
                        },
                        end: {
                            column: 39,
                            line: 1,
                        },
                    },
                    suggestions: [],
                },
            ]);
        });

        it('should suggest similar scriptlet names for AdGuard typos', async () => {
            const result = await lint(
                'example.com#%#//scriptlet("set-contstant", "foo", "1")',
                rulesConfig,
            );

            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]).toMatchObject({
                category: 'problem',
                ruleId: 'no-invalid-scriptlets',
                severity: LinterRuleSeverity.Error,
                messageId: 'unknownScriptlet',
                message: expect.any(String),
                data: {
                    scriptlet: 'set-contstant',
                    platform: expect.any(String),
                },
            });

            expect(result.problems[0]?.suggestions).toBeDefined();
            expect(result.problems[0]?.suggestions?.length).toBeGreaterThan(0);

            const firstSuggestion = result.problems[0]?.suggestions?.[0];
            expect(firstSuggestion).toMatchObject({
                messageId: 'changeScriptlet',
                message: expect.any(String),
                data: expect.any(Object),
                fix: {
                    range: expect.any(Array),
                    text: expect.any(String),
                },
            });

            expect(firstSuggestion?.data?.suggestedScriptlet).toBe('set-constant');
        });

        it('should suggest similar scriptlet names for uBlock Origin typos', async () => {
            const result = await lint(
                'example.com##+js(set-contstant.js, foo, 1)',
                rulesConfig,
            );

            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]?.suggestions).toBeDefined();
            expect(result.problems[0]?.suggestions?.length).toBeGreaterThan(0);

            const firstSuggestion = result.problems[0]?.suggestions?.[0];
            expect(firstSuggestion?.data?.suggestedScriptlet).toBe('set-constant.js');
        });

        it('should suggest similar scriptlet names for Adblock Plus typos', async () => {
            const result = await lint(
                'example.com#$#abort-on-property-rad foo',
                rulesConfig,
            );

            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]?.suggestions).toBeDefined();
            expect(result.problems[0]?.suggestions?.length).toBeGreaterThan(0);

            const firstSuggestion = result.problems[0]?.suggestions?.[0];
            expect(firstSuggestion?.data?.suggestedScriptlet).toBe('abort-on-property-read');
        });

        it('should not suggest scriptlets when fuzzy threshold is too high', async () => {
            const strictConfig: LinterRulesConfig = {
                'no-invalid-scriptlets': [LinterRuleSeverity.Error, {
                    fuzzyThreshold: 0.95,
                }],
            };

            const result = await lint(
                'example.com#%#//scriptlet("completely-unknown-scriptlet", "foo", "1")',
                strictConfig,
            );

            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]?.suggestions).toHaveLength(0);
        });
    });

    describe('parameter validation', () => {
        it('should detect missing required parameters', async () => {
            const result = await lint(
                'example.com#%#//scriptlet("set-constant")',
                rulesConfig,
            );

            expect(result.problems.length).toBeGreaterThan(0);
            expect(result.problems[0]).toMatchObject({
                category: 'problem',
                ruleId: 'no-invalid-scriptlets',
                severity: LinterRuleSeverity.Error,
                messageId: 'scriptletShouldHaveParameter',
                message: expect.any(String),
            });
        });

        it('should detect too many parameters', async () => {
            const result = await lint(
                'example.com#%#//scriptlet("abort-on-property-read", "foo", "bar")',
                rulesConfig,
            );

            expect(result.problems).toStrictEqual([
                {
                    category: 'problem',
                    ruleId: 'no-invalid-scriptlets',
                    severity: LinterRuleSeverity.Error,
                    messageId: 'tooManyParameters',
                    message: expect.any(String),
                    data: {
                        scriptlet: 'abort-on-property-read',
                        max: expect.any(Number),
                        actual: expect.any(Number),
                    },
                    position: {
                        start: {
                            column: 14,
                            line: 1,
                        },
                        end: {
                            column: 65,
                            line: 1,
                        },
                    },
                },
            ]);
        });

        it('should detect parameters for scriptlets that do not accept any', async () => {
            const result = await lint(
                'example.com#%#//scriptlet("log-addEventListener", "foo", "bar")',
                rulesConfig,
            );

            expect(result.problems).toStrictEqual([
                {
                    category: 'problem',
                    ruleId: 'no-invalid-scriptlets',
                    severity: LinterRuleSeverity.Error,
                    messageId: 'scriptletShouldNotHaveParameters',
                    message: expect.any(String),
                    data: {
                        scriptlet: 'log-addEventListener',
                        actual: expect.any(Number),
                    },
                    position: {
                        start: {
                            column: 14,
                            line: 1,
                        },
                        end: {
                            column: 63,
                            line: 1,
                        },
                    },
                },
            ]);
        });
    });

    describe('complex scenarios', () => {
        test('should handle multiple domains with valid scriptlets', async () => {
            await expect(
                lint('example.com,example.org#%#//scriptlet("set-constant", "foo", "bar")', rulesConfig),
            ).resolves.toHaveProperty('problems', []);
        });

        test('should handle domain exceptions with valid scriptlets', async () => {
            await expect(
                lint('example.com,~example.org#%#//scriptlet("set-constant", "foo", "bar")', rulesConfig),
            ).resolves.toHaveProperty('problems', []);
        });

        test('should validate scriptlets with quoted parameters', async () => {
            await expect(
                lint('example.com#%#//scriptlet("set-constant", "foo.bar", "true")', rulesConfig),
            ).resolves.toHaveProperty('problems', []);
        });

        test('should validate scriptlets with empty parameters', async () => {
            await expect(
                lint('example.com#%#//scriptlet("set-constant", "foo", "")', rulesConfig),
            ).resolves.toHaveProperty('problems', []);
        });
    });

    describe('syntax-specific validation', () => {
        test('should validate AdGuard syntax scriptlets correctly', async () => {
            await expect(
                lint('example.com#%#//scriptlet("prevent-setTimeout", "test")', rulesConfig),
            ).resolves.toHaveProperty('problems', []);
        });

        test('should validate uBlock Origin syntax scriptlets correctly', async () => {
            await expect(
                lint('example.com##+js(setTimeout-defuser.js, test)', rulesConfig),
            ).resolves.toHaveProperty('problems', []);
        });

        test('should validate Adblock Plus syntax scriptlets correctly', async () => {
            await expect(
                lint('example.com#$#abort-current-inline-script addEventListener test', rulesConfig),
            ).resolves.toHaveProperty('problems', []);
        });
    });

    describe('edge cases', () => {
        test('should handle scriptlet names with special characters', async () => {
            await expect(
                lint('example.com#%#//scriptlet("set-cookie", "test", "value")', rulesConfig),
            ).resolves.toHaveProperty('problems', []);
        });

        test('should handle scriptlets in global rules', async () => {
            await expect(
                lint('#%#//scriptlet("log-addEventListener")', rulesConfig),
            ).resolves.toHaveProperty('problems', []);
        });

        test('should handle scriptlets with wildcard domains', async () => {
            await expect(
                lint('*.example.com#%#//scriptlet("set-constant", "foo", "bar")', rulesConfig),
            ).resolves.toHaveProperty('problems', []);
        });
    });
});
