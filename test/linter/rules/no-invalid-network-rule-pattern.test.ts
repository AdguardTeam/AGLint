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
        ])("'$actual'", ({ actual, expected }) => {
            expect(linter.lint(actual)).toMatchObject({ problems: expected });
        });
    });
});
