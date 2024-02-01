import { Linter } from '../../../src/linter';
import { NoInvalidNetworkRulePattern } from '../../../src/linter/rules/no-invalid-network-rule-pattern';

let linter: Linter;

describe('no-invalid-network-rule-pattern', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('no-invalid-network-rule-pattern', NoInvalidNetworkRulePattern);
    });

    describe('should ignore non-problematic cases', () => {
        test.each([
            // Non-network rules
            'example.com##.ad',
            '! comment',
            // Network rules with valid patterns
            'example.com',
            '/ads.js^$script',
            '||example.com',
            '|example.com',
            'example.com|',
            '||example.com^$script,third-party',
            '@@||example.com^$script', // exception rule
            '/[a-z]+-ads/$script', // valid regex
        ])("'%s'", (rule) => {
            expect(linter.lint(rule)).toMatchObject({ problems: [] });
        });
    });

    describe('should detect problematic cases', () => {
        test.each([
            {
                actual: '|||example.com',
                expected: [
                    {
                        rule: 'no-invalid-network-rule-pattern',
                        severity: 2,
                        message: 'Unexpected pipe character',
                        position: {
                            startColumn: 2,
                            endColumn: 14,
                        },
                    },
                ],
            },
            {
                actual: 'example.com||',
                expected: [
                    {
                        rule: 'no-invalid-network-rule-pattern',
                        severity: 2,
                        message: 'Unexpected pipe character',
                        position: {
                            startColumn: 11,
                            endColumn: 13,
                        },
                    },
                ],
            },
            {
                actual: 'example.com|||',
                expected: [
                    {
                        rule: 'no-invalid-network-rule-pattern',
                        severity: 2,
                        message: 'Unexpected pipe character',
                        position: {
                            endColumn: 14,
                            endLine: 1,
                            startColumn: 11,
                            startLine: 1,
                        },
                    },
                    {
                        rule: 'no-invalid-network-rule-pattern',
                        severity: 2,
                        message: 'Unexpected pipe character',
                        position: {
                            endColumn: 14,
                            endLine: 1,
                            startColumn: 12,
                            startLine: 1,
                        },
                    },
                ],
            },
            {
                actual: 'exam|ple.com',
                expected: [
                    {
                        rule: 'no-invalid-network-rule-pattern',
                        severity: 2,
                        message: 'Unexpected pipe character',
                        position: {
                            endColumn: 12,
                            startColumn: 4,
                        },
                    },
                ],
            },
            {
                actual: 'ev|l.com$domain=example.org',
                expected: [
                    {
                        rule: 'no-invalid-network-rule-pattern',
                        severity: 2,
                        message: 'Unexpected pipe character',
                        position: {
                            endColumn: 27,
                            startColumn: 2,
                        },
                    },
                ],
            },
            {
                actual: 'exam ple.com^$script,important',
                expected: [
                    {
                        rule: 'no-invalid-network-rule-pattern',
                        severity: 2,
                        message: 'Unexpected whitespace character',
                        position: {
                            endColumn: 30,
                            startColumn: 4,
                        },
                    },
                ],
            },
            {
                actual: '/aws[3,/$redirect=noopjs',
                expected: [
                    {
                        rule: 'no-invalid-network-rule-pattern',
                        severity: 2,
                        message: 'Invalid regular expression: Unexpected end of input.',
                        position: {
                            endColumn: 8,
                            startColumn: 0,
                        },
                    },
                ],
            },
        ])("'$actual'", ({ actual, expected }) => {
            expect(linter.lint(actual)).toMatchObject({ problems: expected });
        });
    });
});
