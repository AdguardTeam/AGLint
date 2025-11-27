import { AdblockSyntax } from '@adguard/agtree/utils';
import { type ReadonlyRecord } from '@adguard/ecss-tree';
import * as v from 'valibot';
import { describe, expect, test } from 'vitest';

import { type LinterConfig } from '../../src/linter/config';
import { defaultSubParsers } from '../../src/linter/default-subparsers';
import { type LinterResult, lint as lintFn } from '../../src/linter/linter';
import { defineRule, LinterRuleSeverity, LinterRuleType } from '../../src/linter/rule';
import { type LinterRule } from '../../src/linter/rule';
import { type LinterRuleLoader } from '../../src/linter/rule-registry/rule-loader';

// Test rule that reports on all network rules
const testRuleNetworkRule = defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: { name: 'test-network-rule', description: 'Test rule for network rules', recommended: false },
        messages: { networkRuleDetected: 'Network rule detected' },
    },
    create: (context) => ({
        '[category=Network]': (node) => {
            context.report({ messageId: 'networkRuleDetected', node });
        },
    }),
});

// Test rule that reports on all cosmetic rules
const testRuleCosmeticRule = defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: { name: 'test-cosmetic-rule', description: 'Test rule for cosmetic rules', recommended: false },
        messages: { cosmeticRuleDetected: 'Cosmetic rule detected' },
    },
    create: (context) => ({
        '[category=Cosmetic]': (node) => {
            context.report({ messageId: 'cosmeticRuleDetected', node });
        },
    }),
});

// Test rule that reports warnings on comments
const testRuleCommentWarning = defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: { name: 'test-comment-warning', description: 'Test rule for comments', recommended: false },
        messages: { commentDetected: 'Comment detected' },
    },
    create: (context) => ({
        '[category=Comment]:not(ConfigCommentRule)': (node) => {
            context.report({ messageId: 'commentDetected', node });
        },
    }),
});

// Test rule with configurable options to test inline config modifications
const testRuleConfigurable = defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'test-configurable-rule',
            description: 'Test rule with configurable options',
            recommended: false,
        },
        messages: {
            networkRuleDetected:
                'Network rule detected with minLength={{minLength}} and requireDomain={{requireDomain}}',
        },
        configSchema: v.tuple([
            v.strictObject({
                minLength: v.pipe(
                    v.optional(v.number(), 5),
                    v.minValue(1),
                    v.description('Minimum length of the network rule pattern'),
                ),
                requireDomain: v.pipe(
                    v.optional(v.boolean(), false),
                    v.description('Whether to require a domain in the rule'),
                ),
            }),
        ]),
        defaultConfig: [
            {
                minLength: 5,
                requireDomain: false,
            },
        ],
    },
    create: (context) => ({
        '[category=Network]': (node: any) => {
            // Read config during visitor execution, not at creation time
            // This allows inline config comments to take effect
            const { minLength, requireDomain } = context.config[0];

            const nodeText = context.sourceCode.getSlicedPart(node.start, node.end);

            // Check minLength
            if (nodeText.length < minLength) {
                return;
            }

            // Check requireDomain
            if (requireDomain && !nodeText.includes('.')) {
                return;
            }

            context.report({
                messageId: 'networkRuleDetected',
                data: { minLength, requireDomain },
                node,
            });
        },
    }),
});

const testRules: ReadonlyRecord<string, LinterRule<any, any>> = {
    'test-network-rule': testRuleNetworkRule,
    'test-cosmetic-rule': testRuleCosmeticRule,
    'test-comment-warning': testRuleCommentWarning,
    'test-configurable-rule': testRuleConfigurable,
};

const createRuleLoader = (additionalRules?: Record<string, LinterRule<any, any>>): LinterRuleLoader => {
    const allRules = { ...testRules, ...additionalRules };
    return async (ruleName: string) => {
        const rule = allRules[ruleName];
        if (!rule) {
            throw new Error(`Rule not found: ${ruleName}`);
        }
        return rule;
    };
};

const lint = async (
    content: string,
    config: LinterConfig,
    ruleLoader?: LinterRuleLoader,
): Promise<LinterResult> => {
    return lintFn({
        fileProps: { content },
        config: {
            syntax: [AdblockSyntax.Adg],
            ...config,
        },
        loadRule: ruleLoader ?? createRuleLoader(),
        subParsers: defaultSubParsers,
    });
};

describe('Linter E2E Tests', () => {
    describe('basic linting functionality', () => {
        test('should lint empty content', async () => {
            const result = await lint('', { rules: {}, allowInlineConfig: true });
            expect(result.problems).toHaveLength(0);
            expect(result.errorCount).toBe(0);
            expect(result.warningCount).toBe(0);
            expect(result.fatalErrorCount).toBe(0);
        });

        test('should detect problems with enabled rules', async () => {
            const result = await lint('example.com##.ad', {
                rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error },
                allowInlineConfig: true,
            });
            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]).toMatchObject({
                ruleId: 'test-cosmetic-rule',
                severity: LinterRuleSeverity.Error,
                message: 'Cosmetic rule detected',
            });
            expect(result.errorCount).toBe(1);
        });

        test('should not report problems for disabled rules', async () => {
            const result = await lint('example.com##.ad', {
                rules: { 'test-cosmetic-rule': LinterRuleSeverity.Off },
                allowInlineConfig: true,
            });
            expect(result.problems).toHaveLength(0);
        });

        test('should handle multiple rules', async () => {
            const result = await lint(
                [
                    '||example.com^',
                    'example.com##.ad',
                    '! comment',
                ].join('\n'),
                {
                    rules: {
                        'test-network-rule': LinterRuleSeverity.Error,
                        'test-cosmetic-rule': LinterRuleSeverity.Error,
                        'test-comment-warning': LinterRuleSeverity.Warning,
                    },
                    allowInlineConfig: true,
                },
            );
            expect(result.problems).toHaveLength(3);
            expect(result.errorCount).toBe(2);
            expect(result.warningCount).toBe(1);
        });

        test('should differentiate between warnings and errors', async () => {
            const result = await lint(
                [
                    '! comment 1',
                    '! comment 2',
                    'example.com##.ad',
                ].join('\n'),
                {
                    rules: {
                        'test-comment-warning': LinterRuleSeverity.Warning,
                        'test-cosmetic-rule': LinterRuleSeverity.Error,
                    },
                    allowInlineConfig: true,
                },
            );
            expect(result.problems).toHaveLength(3);
            expect(result.warningCount).toBe(2);
            expect(result.errorCount).toBe(1);
        });
    });

    describe('inline configuration (! aglint)', () => {
        test('should apply inline rule configuration', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint "test-cosmetic-rule": "error"',
                    'example.com##.banner',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Warning }, allowInlineConfig: true },
            );

            expect(result.problems).toHaveLength(2);

            expect(result.problems[0]!.position.start.line).toBe(1);
            expect(result.problems[0]!.severity).toBe(LinterRuleSeverity.Warning);

            expect(result.problems[1]!.position.start.line).toBe(3);
            expect(result.problems[1]!.severity).toBe(LinterRuleSeverity.Error);
        });

        test('should turn off rule via inline config', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint "test-cosmetic-rule": "off"',
                    'example.com##.banner',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]?.position.start.line).toBe(1);
        });

        test('should change severity via inline config', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint "test-cosmetic-rule": "warn"',
                    'example.com##.banner',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.problems).toHaveLength(2);
            expect(result.problems[0]?.severity).toBe(LinterRuleSeverity.Error);
            expect(result.problems[1]?.severity).toBe(LinterRuleSeverity.Warning);
            expect(result.errorCount).toBe(1);
            expect(result.warningCount).toBe(1);
        });

        test('should configure multiple rules via inline config', async () => {
            const result = await lint(
                [
                    '||example.com^',
                    'example.com##.ad',
                    '! aglint "test-network-rule": "off", "test-cosmetic-rule": "off"',
                    '||example.net^',
                    'example.net##.banner',
                ].join('\n'),
                {
                    rules: {
                        'test-network-rule': LinterRuleSeverity.Error,
                        'test-cosmetic-rule': LinterRuleSeverity.Error,
                    },
                    allowInlineConfig: true,
                },
            );
            expect(result.problems).toHaveLength(2);
            expect(result.problems[0]?.position.start.line).toBe(1);
            expect(result.problems[1]?.position.start.line).toBe(2);
        });

        test('should ignore inline config when allowInlineConfig is false', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint "test-cosmetic-rule": "off"',
                    'example.com##.banner',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: false },
            );
            expect(result.problems).toHaveLength(2);
        });

        test('should modify rule options via inline config', async () => {
            const result = await lint(
                [
                    '||a.com^',
                    '! aglint "test-configurable-rule": ["error", { "minLength": 10 }]',
                    '||b.com^',
                    '||verylongdomain.com^',
                ].join('\n'),
                {
                    rules: { 'test-configurable-rule': ['error', { minLength: 5 }] },
                    allowInlineConfig: true,
                },
            );

            // First rule matches default minLength: 5 (7 chars: ||a.com^)
            expect(result.problems).toHaveLength(2);
            expect(result.problems[0]?.position.start.line).toBe(1);
            expect(result.problems[0]?.message).toContain('minLength=5');

            // After inline config, only rules with minLength >= 10 are reported
            // ||verylongdomain.com^ is 20 chars
            expect(result.problems[1]?.position.start.line).toBe(4);
            expect(result.problems[1]?.message).toContain('minLength=10');
        });

        test('should merge rule options via inline config', async () => {
            const result = await lint(
                [
                    '||example.com^',
                    '! aglint "test-configurable-rule": ["error", { "requireDomain": true }]',
                    '||test.org^',
                    '||block^',
                ].join('\n'),
                {
                    rules: { 'test-configurable-rule': ['error', { minLength: 5, requireDomain: false }] },
                    allowInlineConfig: true,
                },
            );

            // First rule: minLength=5, requireDomain=false (should match)
            expect(result.problems).toHaveLength(2);
            expect(result.problems[0]?.position.start.line).toBe(1);
            expect(result.problems[0]?.message).toContain('requireDomain=false');

            // After inline config: minLength=5 (inherited), requireDomain=true
            // ||test.org^ has domain, so it matches
            expect(result.problems[1]?.position.start.line).toBe(3);
            expect(result.problems[1]?.message).toContain('requireDomain=true');

            // ||block^ has no domain (no dot), so it's filtered out
        });

        test('should handle multiple inline config changes with options', async () => {
            const result = await lint(
                [
                    '||a.com^',
                    '! aglint "test-configurable-rule": ["error", { "minLength": 15 }]',
                    '||b.com^',
                    '||verylongdomain.com^',
                    '! aglint "test-configurable-rule": ["warn", { "minLength": 5, "requireDomain": true }]',
                    '||c.com^',
                    '||block^',
                ].join('\n'),
                {
                    rules: { 'test-configurable-rule': ['error', { minLength: 5, requireDomain: false }] },
                    allowInlineConfig: true,
                },
            );

            expect(result.problems).toHaveLength(3);

            // First rule: minLength=5, requireDomain=false
            expect(result.problems[0]?.position.start.line).toBe(1);
            expect(result.problems[0]?.severity).toBe(LinterRuleSeverity.Error);
            expect(result.problems[0]?.message).toContain('minLength=5');

            // After first inline config: minLength=15
            // Only ||verylongdomain.com^ (20 chars) matches
            expect(result.problems[1]?.position.start.line).toBe(4);
            expect(result.problems[1]?.severity).toBe(LinterRuleSeverity.Error);
            expect(result.problems[1]?.message).toContain('minLength=15');

            // After second inline config: severity=warn, minLength=5, requireDomain=true
            // ||c.com^ has domain and is long enough
            expect(result.problems[2]?.position.start.line).toBe(6);
            expect(result.problems[2]?.severity).toBe(LinterRuleSeverity.Warning);
            expect(result.problems[2]?.message).toContain('minLength=5');
            expect(result.problems[2]?.message).toContain('requireDomain=true');

            // ||block^ has no domain, so it's filtered out
        });

        test('should preserve config immutability with inline changes', async () => {
            const result = await lint(
                [
                    '||example.com^',
                    '! aglint "test-configurable-rule": ["error", { "minLength": 20 }]',
                    '||test.org^',
                ].join('\n'),
                {
                    rules: { 'test-configurable-rule': ['error', { minLength: 5 }] },
                    allowInlineConfig: true,
                },
            );

            // Both rules should be processed - first with minLength=5, second with minLength=20
            // ||example.com^ is 14 chars, so it matches minLength=5
            // ||test.org^ is 11 chars, doesn't match minLength=20
            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]?.position.start.line).toBe(1);
            expect(result.problems[0]?.message).toContain('minLength=5');
        });

        test('should not process inline config when allowInlineConfig is undefined', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint "test-cosmetic-rule": "off"',
                    'example.com##.banner',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error } },
            );
            expect(result.problems).toHaveLength(2);
        });
    });

    describe('disable-next-line directive', () => {
        test('should disable all rules for next line', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable-next-line',
                    'example.com##.banner',
                    'example.com##.popup',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.problems).toHaveLength(2);
            expect(result.problems[0]?.position.start.line).toBe(1);
            expect(result.problems[1]?.position.start.line).toBe(4);
        });

        test('should disable specific rule for next line', async () => {
            const result = await lint(
                [
                    '||example.com^',
                    'example.com##.ad',
                    '! aglint-disable-next-line test-network-rule',
                    '||example.net^',
                    'example.net##.banner',
                ].join('\n'),
                {
                    rules: {
                        'test-network-rule': LinterRuleSeverity.Error,
                        'test-cosmetic-rule': LinterRuleSeverity.Error,
                    },
                    allowInlineConfig: true,
                },
            );
            expect(result.problems).toHaveLength(3);
            const lines = result.problems.map((p) => p.position.start.line);
            expect(lines).toEqual([1, 2, 5]);
        });

        test('should disable multiple specific rules for next line', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable-next-line test-network-rule, test-cosmetic-rule',
                    '||example.net^',
                    '! aglint-disable-next-line test-network-rule, test-cosmetic-rule',
                    'example.net##.banner',
                ].join('\n'),
                {
                    rules: {
                        'test-network-rule': LinterRuleSeverity.Error,
                        'test-cosmetic-rule': LinterRuleSeverity.Error,
                    },
                    allowInlineConfig: true,
                },
            );
            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]!.position.start.line).toBe(1);
        });
    });

    describe('disable/enable directives', () => {
        test('should disable all rules from directive until end', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable',
                    'example.com##.banner',
                    'example.com##.popup',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]!.position.start.line).toBe(1);
        });

        test('should disable and re-enable all rules', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable',
                    'example.com##.banner',
                    '! aglint-enable',
                    'example.com##.footer',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.problems).toHaveLength(2);
            expect(result.problems[0]?.position.start.line).toBe(1);
            expect(result.problems[1]?.position.start.line).toBe(5);
        });

        test('should disable specific rules in region', async () => {
            const result = await lint(
                [
                    '||example.com^',
                    'example.com##.ad',
                    '! aglint-disable test-network-rule',
                    '||example.net^',
                    'example.net##.banner',
                    '! aglint-enable test-network-rule',
                    'example.org',
                    'example.org##.footer',
                ].join('\n'),
                {
                    rules: {
                        'test-network-rule': LinterRuleSeverity.Error,
                        'test-cosmetic-rule': LinterRuleSeverity.Error,
                    },
                    allowInlineConfig: true,
                },
            );
            const networkProblems = result.problems.filter((p) => p.ruleId === 'test-network-rule');
            expect(networkProblems).toHaveLength(2);
            expect(networkProblems[0]!.position.start.line).toBe(1);
            expect(networkProblems[1]!.position.start.line).toBe(7);
        });

        test('should handle multiple disable/enable pairs', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable',
                    'example.com##.banner',
                    '! aglint-enable',
                    'example.com##.popup',
                    '! aglint-disable',
                    'example.com##.footer',
                    '! aglint-enable',
                    'example.com##.sidebar',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.problems).toHaveLength(3);
            const lines = result.problems.map((p) => p.position!.start.line);
            expect(lines).toEqual([1, 5, 9]);
        });

        test('should disable multiple specific rules', async () => {
            const result = await lint(
                [
                    '||example.com^',
                    'example.com##.ad',
                    '! comment',
                    '! aglint-disable test-network-rule, test-cosmetic-rule, test-comment-warning',
                    '||example.net^',
                    'example.net##.banner',
                    '! another',
                    '! aglint-enable test-network-rule, test-cosmetic-rule, test-comment-warning',
                    'example.org',
                    'example.org##.footer',
                    '! final',
                ].join('\n'),
                {
                    rules: {
                        'test-network-rule': LinterRuleSeverity.Error,
                        'test-cosmetic-rule': LinterRuleSeverity.Error,
                        'test-comment-warning': LinterRuleSeverity.Warning,
                    },
                    allowInlineConfig: true,
                },
            );
            expect(result.problems).toHaveLength(6);
            const lines = result.problems.map((p) => p.position!.start.line).sort((a, b) => (a ?? 0) - (b ?? 0));
            expect(lines).toEqual([1, 2, 3, 9, 10, 11]);
        });
    });

    describe('disable directives with inline config interaction', () => {
        test('should disable rules changed by inline config', async () => {
            const result = await lint(
                [
                    '! aglint "test-cosmetic-rule": "error"',
                    'example.com##.ad',
                    '! aglint-disable',
                    'example.com##.banner',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Warning }, allowInlineConfig: true },
            );
            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]!.position.start.line).toBe(2);
            expect(result.problems[0]!.severity).toBe(LinterRuleSeverity.Error);
        });

        test('should handle inline config after disable directive', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable',
                    'example.com##.banner',
                    '! aglint "test-cosmetic-rule": "off"',
                    'example.com##.popup',
                    '! aglint-enable',
                    'example.com##.footer',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]!.position.start.line).toBe(1);
        });
    });

    describe('fatal errors', () => {
        test('should handle syntactically invalid rules', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '##[invalid syntax',
                    'example.net##.banner',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.problems.length).toBeGreaterThan(0);
            expect(result.fatalErrorCount).toBeGreaterThan(0);
        });

        test('should disable fatal errors by default', async () => {
            const result = await lint(
                [
                    '! aglint-disable',
                    '##[invalid syntax',
                    'example.com##.ad',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.fatalErrorCount).toBe(0);
        });
    });

    describe('edge cases and special scenarios', () => {
        test('should handle empty lines', async () => {
            const result = await lint(
                'example.com##.ad\n\n\nexample.com##.banner',
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.problems).toHaveLength(2);
        });

        test('should handle consecutive disable-next-line directives', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable-next-line',
                    '! aglint-disable-next-line',
                    'example.com##.banner',
                    'example.com##.popup',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.problems).toHaveLength(2);
            expect(result.problems[0]?.position.start.line).toBe(1);
            expect(result.problems[1]?.position.start.line).toBe(5);
        });

        test('should handle rules with no problems', async () => {
            const result = await lint(
                [
                    '! just a comment',
                    '! another comment',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.problems).toHaveLength(0);
        });

        test('should handle disable without enable', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable',
                    'example.com##.banner',
                    'example.com##.popup',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.problems).toHaveLength(1);
            expect(result.problems[0]!.position.start.line).toBe(1);
        });

        test('should handle enable without disable', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-enable',
                    'example.com##.banner',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.problems).toHaveLength(2);
        });

        test('should handle mixed content with various directives', async () => {
            const result = await lint(
                [
                    '! Header comment',
                    '||example.com^',
                    'example.com##.ad',
                    '! aglint "test-network-rule": "warn"',
                    '! aglint-disable-next-line test-cosmetic-rule',
                    'example.net##.banner',
                    '||example.net^',
                    '! aglint-disable',
                    'example.org',
                    'example.org##.popup',
                    '! aglint-enable',
                    '! Final',
                    'example.com##.footer',
                ].join('\n'),
                {
                    rules: {
                        'test-network-rule': LinterRuleSeverity.Error,
                        'test-cosmetic-rule': LinterRuleSeverity.Error,
                        'test-comment-warning': LinterRuleSeverity.Warning,
                    },
                    allowInlineConfig: true,
                },
            );
            expect(result.problems.length).toBeGreaterThan(0);
            expect(result.errorCount).toBeGreaterThan(0);
            expect(result.warningCount).toBeGreaterThan(0);
        });
    });

    describe('problem counting', () => {
        test('should correctly count errors, warnings, and fatal errors', async () => {
            const result = await lint(
                [
                    '! comment 1',
                    '! comment 2',
                    'example.com##.ad',
                    'example.com##.banner',
                ].join('\n'),
                {
                    rules: {
                        'test-comment-warning': LinterRuleSeverity.Warning,
                        'test-cosmetic-rule': LinterRuleSeverity.Error,
                    },
                    allowInlineConfig: true,
                },
            );
            expect(result.problems).toHaveLength(4);
            expect(result.warningCount).toBe(2);
            expect(result.errorCount).toBe(2);
            expect(result.fatalErrorCount).toBe(0);
        });

        test('should verify sum of counts matches total problems', async () => {
            const result = await lint(
                [
                    '! comment',
                    'example.com',
                    'example.com##.ad',
                    '##[invalid',
                ].join('\n'),
                {
                    rules: {
                        'test-comment-warning': LinterRuleSeverity.Warning,
                        'test-network-rule': LinterRuleSeverity.Error,
                        'test-cosmetic-rule': LinterRuleSeverity.Error,
                    },
                    allowInlineConfig: true,
                },
            );
            const total = result.errorCount + result.warningCount + result.fatalErrorCount;
            expect(result.problems).toHaveLength(total);
        });
    });

    describe('file properties', () => {
        test('should accept filePath and cwd', async () => {
            const result = await lintFn({
                fileProps: {
                    content: 'example.com##.ad',
                    filePath: '/test/file.txt',
                    cwd: '/test',
                },
                config: {
                    rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error },
                    allowInlineConfig: true,
                },
                loadRule: createRuleLoader(),
                subParsers: defaultSubParsers,
            });
            expect(result.problems).toHaveLength(1);
        });
    });

    describe('unused disable directives', () => {
        test('should not report unused directives by default', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable',
                    'example.com##.banner',
                ].join('\n'),
                {
                    rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error },
                    allowInlineConfig: true,
                },
            );

            // Only reports the actual rule violations, not unused directives
            expect(result.problems.every((p) => p.ruleId !== 'unused-disable-directive')).toBe(true);
        });

        test('should report unused disable-all directive as warning', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable',
                    'example.com##.banner',
                ].join('\n'),
                {
                    rules: {},
                    allowInlineConfig: true,
                    reportUnusedDisableDirectives: true,
                },
            );

            const unusedProblems = result.problems.filter((p) => p.ruleId === 'unused-disable-directive');
            expect(unusedProblems).toHaveLength(1);
            expect(unusedProblems[0]?.message).toBe('Unused disable directive');
            expect(unusedProblems[0]?.severity).toBe(LinterRuleSeverity.Warning);
        });

        test('should report unused disable-all directive as error when configured', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable',
                    'example.com##.banner',
                ].join('\n'),
                {
                    rules: {},
                    allowInlineConfig: true,
                    reportUnusedDisableDirectives: true,
                    unusedDisableDirectivesSeverity: 'error',
                },
            );

            const unusedProblems = result.problems.filter((p) => p.ruleId === 'unused-disable-directive');
            expect(unusedProblems).toHaveLength(1);
            expect(unusedProblems[0]?.severity).toBe(LinterRuleSeverity.Error);
        });

        test('should report unused specific rule directive', async () => {
            const result = await lint(
                [
                    '||example.com^',
                    '! aglint-disable test-cosmetic-rule',
                    '||example.net^',
                ].join('\n'),
                {
                    rules: { 'test-network-rule': LinterRuleSeverity.Error },
                    allowInlineConfig: true,
                    reportUnusedDisableDirectives: true,
                },
            );

            const unusedProblems = result.problems.filter((p) => p.ruleId === 'unused-disable-directive');
            expect(unusedProblems).toHaveLength(1);
            expect(unusedProblems[0]?.message).toBe('Unused disable directive for rule: test-cosmetic-rule');
        });

        test('should report unused disable-next-line directive', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable-next-line',
                    'example.com##.banner',
                ].join('\n'),
                {
                    rules: {},
                    allowInlineConfig: true,
                    reportUnusedDisableDirectives: true,
                },
            );

            const unusedProblems = result.problems.filter((p) => p.ruleId === 'unused-disable-directive');
            expect(unusedProblems).toHaveLength(1);
            expect(unusedProblems[0]?.message).toBe('Unused disable directive');
        });

        test('should not report used disable directive', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable',
                    'example.com##.banner',
                    'example.com##.popup',
                ].join('\n'),
                {
                    rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error },
                    allowInlineConfig: true,
                    reportUnusedDisableDirectives: true,
                },
            );

            const unusedProblems = result.problems.filter((p) => p.ruleId === 'unused-disable-directive');
            expect(unusedProblems).toHaveLength(0);

            // Should have filtered out the actual rule problems
            const ruleProblems = result.problems.filter((p) => p.ruleId !== 'unused-disable-directive');
            expect(ruleProblems).toHaveLength(1); // Only the first one before disable
        });

        test('should report unused specific rule while used rules are fine', async () => {
            const result = await lint(
                [
                    '||example.com^',
                    '! aglint-disable test-network-rule, test-cosmetic-rule',
                    '||example.net^',
                    '||example.org^',
                ].join('\n'),
                {
                    rules: { 'test-network-rule': LinterRuleSeverity.Error },
                    allowInlineConfig: true,
                    reportUnusedDisableDirectives: true,
                },
            );

            const unusedProblems = result.problems.filter((p) => p.ruleId === 'unused-disable-directive');
            expect(unusedProblems).toHaveLength(1);
            expect(unusedProblems[0]?.message).toBe('Unused disable directive for rule: test-cosmetic-rule');

            // Should have filtered out the network rule problems
            const ruleProblems = result.problems.filter((p) => p.ruleId !== 'unused-disable-directive');
            expect(ruleProblems).toHaveLength(1); // Only the first network rule
        });

        test('should not report enable directives as unused', async () => {
            const result = await lint(
                [
                    '! aglint-enable',
                    'example.com##.ad',
                ].join('\n'),
                {
                    rules: {},
                    allowInlineConfig: true,
                    reportUnusedDisableDirectives: true,
                },
            );

            const unusedProblems = result.problems.filter((p) => p.ruleId === 'unused-disable-directive');
            expect(unusedProblems).toHaveLength(0);
        });

        test('should combine unused directive problems with rule problems', async () => {
            const result = await lint(
                [
                    'example.com##.ad',
                    '! aglint-disable test-network-rule',
                    'example.com##.banner',
                ].join('\n'),
                {
                    rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error },
                    allowInlineConfig: true,
                    reportUnusedDisableDirectives: true,
                },
            );

            // Should have both cosmetic rule problems and the unused directive problem
            expect(result.problems).toHaveLength(3);

            const ruleProblems = result.problems.filter((p) => p.ruleId === 'test-cosmetic-rule');
            expect(ruleProblems).toHaveLength(2); // Both cosmetic rules should be reported

            const unusedProblems = result.problems.filter((p) => p.ruleId === 'unused-disable-directive');
            expect(unusedProblems).toHaveLength(1); // The network rule disable is unused

            expect(result.warningCount).toBe(1); // The unused directive warning
            expect(result.errorCount).toBe(2); // The two cosmetic rule errors
        });
    });

    describe('includeMetadata option', () => {
        test('should not include metadata by default', async () => {
            const result = await lint('example.com##.ad', {
                rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error },
                allowInlineConfig: true,
            });
            expect(result.problems).toHaveLength(1);
            expect(result.metadata).toBeUndefined();
        });

        test('should include metadata when option is true', async () => {
            const result = await lintFn({
                fileProps: { content: 'example.com##.ad' },
                config: {
                    syntax: [AdblockSyntax.Adg],
                    rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error },
                    allowInlineConfig: true,
                },
                loadRule: createRuleLoader(),
                subParsers: defaultSubParsers,
                includeMetadata: true,
            });
            expect(result.problems).toHaveLength(1);
            expect(result.metadata).toBeDefined();
            expect(result.metadata).toHaveProperty('test-cosmetic-rule');
            expect(result.metadata!['test-cosmetic-rule']).toHaveProperty('type');
            expect(result.metadata!['test-cosmetic-rule']!.type).toBe(LinterRuleType.Problem);
            expect(result.metadata!['test-cosmetic-rule']).toHaveProperty('docs');
            expect(result.metadata!['test-cosmetic-rule']!.docs.name).toBe('test-cosmetic-rule');
        });

        test('should include metadata for all rules with problems', async () => {
            const result = await lintFn({
                fileProps: {
                    content: [
                        '||example.com^',
                        'example.com##.ad',
                        '! comment',
                    ].join('\n'),
                },
                config: {
                    syntax: [AdblockSyntax.Adg],
                    rules: {
                        'test-network-rule': LinterRuleSeverity.Error,
                        'test-cosmetic-rule': LinterRuleSeverity.Error,
                        'test-comment-warning': LinterRuleSeverity.Warning,
                    },
                    allowInlineConfig: true,
                },
                loadRule: createRuleLoader(),
                subParsers: defaultSubParsers,
                includeMetadata: true,
            });
            expect(result.problems).toHaveLength(3);
            expect(result.metadata).toBeDefined();
            expect(Object.keys(result.metadata!)).toHaveLength(3);
            expect(result.metadata).toHaveProperty('test-network-rule');
            expect(result.metadata).toHaveProperty('test-cosmetic-rule');
            expect(result.metadata).toHaveProperty('test-comment-warning');
        });

        test('should not include metadata for rules with no problems', async () => {
            const result = await lintFn({
                fileProps: { content: 'example.com##.ad' },
                config: {
                    syntax: [AdblockSyntax.Adg],
                    rules: {
                        'test-cosmetic-rule': LinterRuleSeverity.Error,
                        'test-network-rule': LinterRuleSeverity.Error, // Enabled but no violations
                    },
                    allowInlineConfig: true,
                },
                loadRule: createRuleLoader(),
                subParsers: defaultSubParsers,
                includeMetadata: true,
            });
            expect(result.problems).toHaveLength(1);
            expect(result.metadata).toBeDefined();
            expect(Object.keys(result.metadata!)).toHaveLength(1);
            expect(result.metadata).toHaveProperty('test-cosmetic-rule');
            expect(result.metadata).not.toHaveProperty('test-network-rule');
        });

        test('should handle empty metadata when no problems found', async () => {
            const result = await lintFn({
                fileProps: { content: '! just a comment' },
                config: {
                    syntax: [AdblockSyntax.Adg],
                    rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error },
                    allowInlineConfig: true,
                },
                loadRule: createRuleLoader(),
                subParsers: defaultSubParsers,
                includeMetadata: true,
            });
            expect(result.problems).toHaveLength(0);
            expect(result.metadata).toBeDefined();
            expect(Object.keys(result.metadata!)).toHaveLength(0);
        });

        test('should skip metadata for problems without ruleId', async () => {
            const result = await lintFn({
                fileProps: { content: '##[invalid syntax' },
                config: {
                    syntax: [AdblockSyntax.Adg],
                    rules: {},
                    allowInlineConfig: true,
                },
                loadRule: createRuleLoader(),
                subParsers: defaultSubParsers,
                includeMetadata: true,
            });
            // Fatal errors don't have ruleId
            expect(result.problems.length).toBeGreaterThan(0);
            expect(result.metadata).toBeDefined();
            // Should be empty since fatal errors have no ruleId
            expect(Object.keys(result.metadata!)).toHaveLength(0);
        });
    });
});
