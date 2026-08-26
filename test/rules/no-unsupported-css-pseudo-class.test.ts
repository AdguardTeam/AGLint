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
    'no-unsupported-css-pseudo-class': [LinterRuleSeverity.Error, {
        fuzzyThreshold: 0.6,
    }],
};

describe('no-unsupported-css-pseudo-class', () => {
    test('should work in severity-only mode', async () => {
        expect((await lint('##div:not(.foo)', {
            'no-unsupported-css-pseudo-class': LinterRuleSeverity.Error,
        })).problems).toEqual([]);
    });

    test('should ignore non-problematic cases', async () => {
        expect((await lint('##div:not(.foo)', rulesConfig)).problems).toEqual([]);
        expect((await lint('##input:checked', rulesConfig)).problems).toEqual([]);
    });

    it('should suggest a fix', async () => {
        expect((await lint('##div:rot', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unsupported-css-pseudo-class',
                severity: LinterRuleSeverity.Error,
                data: {
                    pseudoClass: 'rot',
                },
                message: expect.any(String),
                messageId: 'unsupportedPseudoClass',
                position: {
                    start: {
                        column: 5,
                        line: 1,
                    },
                    end: {
                        column: 9,
                        line: 1,
                    },
                },
                suggestions: ['not', 'root', 'first-child', 'first-of-type', 'read-write'].map(
                    (suggestedPseudoClass) => ({
                        data: {
                            suggestedPseudoClass,
                        },
                        fix: {
                            range: [6, 9],
                            text: suggestedPseudoClass,
                        },
                        message: expect.any(String),
                        messageId: 'changePseudoClass',
                    }),
                ),
            },
        ]);
    });

    it('should allow custom pseudo-class configuration', async () => {
        const customConfig: LinterRulesConfig = {
            'no-unsupported-css-pseudo-class': [LinterRuleSeverity.Error, {
                fuzzyThreshold: 0.6,
                additionalSupportedCssPseudoClasses: ['foo'],
            }],
        };

        expect((await lint('##div:foo', customConfig)).problems).toEqual([]);

        expect((await lint('##div:bar', customConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unsupported-css-pseudo-class',
                severity: LinterRuleSeverity.Error,
                data: {
                    pseudoClass: 'bar',
                },
                message: expect.any(String),
                messageId: 'unsupportedPseudoClass',
                position: expect.any(Object),
                suggestions: expect.any(Array),
            },
        ]);
    });

    it('should allow custom extended CSS pseudo-class configuration', async () => {
        const customConfig: LinterRulesConfig = {
            'no-unsupported-css-pseudo-class': [LinterRuleSeverity.Error, {
                fuzzyThreshold: 0.6,
                additionalSupportedExtCssPseudoClasses: ['custom-ext'],
            }],
        };

        expect((await lint('#?#div:custom-ext(selector)', customConfig)).problems).toEqual([]);

        expect((await lint('#?#div:unknown-ext', customConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unsupported-css-pseudo-class',
                severity: LinterRuleSeverity.Error,
                data: {
                    pseudoClass: 'unknown-ext',
                },
                message: expect.any(String),
                messageId: 'unsupportedPseudoClass',
                position: expect.any(Object),
                suggestions: expect.any(Array),
            },
        ]);
    });

    describe('platform-specific pseudo-classes', () => {
        describe('AdGuard extended CSS', () => {
            const adgPlatforms = ['adg_any'];

            it('should support :contains pseudo-class', async () => {
                expect(
                    (await lint('#?#div:contains(text)', rulesConfig, undefined, adgPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :has-text pseudo-class', async () => {
                expect(
                    (await lint('#?#div:has-text(text)', rulesConfig, undefined, adgPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :matches-css pseudo-class', async () => {
                expect(
                    (await lint('#?#div:matches-css(prop: value)', rulesConfig, undefined, adgPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :matches-attr pseudo-class', async () => {
                expect(
                    (await lint('#?#div:matches-attr(attr)', rulesConfig, undefined, adgPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :xpath pseudo-class', async () => {
                expect(
                    (await lint('#?#div:xpath(//path)', rulesConfig, undefined, adgPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :upward pseudo-class', async () => {
                expect(
                    (await lint('#?#div:upward(2)', rulesConfig, undefined, adgPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :nth-ancestor pseudo-class', async () => {
                expect(
                    (await lint('#?#div:nth-ancestor(3)', rulesConfig, undefined, adgPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :if pseudo-class', async () => {
                expect(
                    (await lint('#?#div:if(selector)', rulesConfig, undefined, adgPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :if-not pseudo-class', async () => {
                expect(
                    (await lint('#?#div:if-not(selector)', rulesConfig, undefined, adgPlatforms)).problems,
                ).toStrictEqual([]);
            });
        });

        describe('ABP-specific pseudo-classes', () => {
            const abpPlatforms = ['abp_any'];

            it('should support :-abp-contains pseudo-class', async () => {
                expect(
                    (await lint('#?#div:-abp-contains(text)', rulesConfig, undefined, abpPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :-abp-has pseudo-class', async () => {
                expect(
                    (await lint('#?#div:-abp-has(selector)', rulesConfig, undefined, abpPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :-abp-properties pseudo-class', async () => {
                expect(
                    (await lint('#?#div:-abp-properties(prop)', rulesConfig, undefined, abpPlatforms)).problems,
                ).toStrictEqual([]);
            });
        });

        describe('uBlock Origin procedural pseudo-classes', () => {
            const uboPlatforms = ['ubo_any'];

            it('should support :matches-media pseudo-class', async () => {
                const result = await lint(
                    '#?#div:matches-media((max-width: 768px))',
                    rulesConfig,
                    undefined,
                    uboPlatforms,
                );
                expect(result.problems).toStrictEqual([]);
            });

            it('should support :matches-path pseudo-class', async () => {
                expect(
                    (await lint('#?#div:matches-path(/path)', rulesConfig, undefined, uboPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :min-text-length pseudo-class', async () => {
                expect(
                    (await lint('#?#div:min-text-length(10)', rulesConfig, undefined, uboPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :others pseudo-class', async () => {
                expect(
                    (await lint('#?#div:others', rulesConfig, undefined, uboPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :watch-attr pseudo-class', async () => {
                expect(
                    (await lint('#?#div:watch-attr(attr)', rulesConfig, undefined, uboPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :remove action operator', async () => {
                expect(
                    (await lint('#?#div:remove()', rulesConfig, undefined, uboPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :remove-attr action operator', async () => {
                expect(
                    (await lint('#?#div:remove-attr(attr)', rulesConfig, undefined, uboPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :remove-class action operator', async () => {
                expect(
                    (await lint('#?#div:remove-class(class)', rulesConfig, undefined, uboPlatforms)).problems,
                ).toStrictEqual([]);
            });

            it('should support :style action operator', async () => {
                expect(
                    (await lint('#?#div:style(prop: value)', rulesConfig, undefined, uboPlatforms)).problems,
                ).toStrictEqual([]);
            });
        });
    });

    describe('edge cases', () => {
        it('should handle multiple pseudo-classes in one selector', async () => {
            expect((await lint('##div:not(.foo):has(.bar)', rulesConfig)).problems).toEqual([]);

            expect((await lint('##div:invalid1:invalid2', rulesConfig)).problems).toHaveLength(2);
        });

        it('should handle very close misspellings', async () => {
            const adgPlatforms = ['adg_any'];
            const result = await lint('#?#div:contians(text)', rulesConfig, undefined, adgPlatforms);
            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]?.suggestions?.[0]?.data?.suggestedPseudoClass).toBe('contains');
        });

        it('should report unsupported pseudo-class without suggestions when fuzzy threshold is high', async () => {
            const strictConfig: LinterRulesConfig = {
                'no-unsupported-css-pseudo-class': [LinterRuleSeverity.Error, {
                    fuzzyThreshold: 0.9,
                }],
            };

            const result = await lint('##div:completely-unknown-pseudo', strictConfig);
            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]?.suggestions).toHaveLength(0);
        });

        it('should handle native CSS pseudo-classes that are also supported by extended CSS', async () => {
            // :has() is supported both natively and as extended CSS
            expect((await lint('##div:has(.selector)', rulesConfig)).problems).toEqual([]);
            expect((await lint('#?#div:has(.selector)', rulesConfig)).problems).toEqual([]);

            // :not() and :is() are also dual-purpose
            expect((await lint('##div:not(.selector)', rulesConfig)).problems).toEqual([]);
            expect((await lint('##div:is(.selector)', rulesConfig)).problems).toEqual([]);
        });
    });
});
