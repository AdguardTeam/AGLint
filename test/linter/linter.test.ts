import { AdblockSyntax } from '@adguard/agtree/utils';
import { type ReadonlyRecord } from '@adguard/ecss-tree';
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

const testRules: ReadonlyRecord<string, LinterRule> = {
    'test-network-rule': testRuleNetworkRule,
    'test-cosmetic-rule': testRuleCosmeticRule,
    'test-comment-warning': testRuleCommentWarning,
};

const createRuleLoader = (additionalRules?: Record<string, LinterRule>): LinterRuleLoader => {
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

        test('should not disable fatal errors by default', async () => {
            const result = await lint(
                [
                    '! aglint-disable',
                    '##[invalid syntax',
                    'example.com##.ad',
                ].join('\n'),
                { rules: { 'test-cosmetic-rule': LinterRuleSeverity.Error }, allowInlineConfig: true },
            );
            expect(result.fatalErrorCount).toBeGreaterThan(0);
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
});
