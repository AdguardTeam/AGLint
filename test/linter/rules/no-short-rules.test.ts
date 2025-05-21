import {
    describe,
    test,
    expect,
    beforeAll,
} from 'vitest';

import { Linter } from '../../../src/linter';
import { NoShortRules } from '../../../src/linter/rules/no-short-rules';

let linter: Linter;

describe('no-short-rules', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('no-short-rules', NoShortRules);
    });

    describe('should ignore non-problematic cases', () => {
        test.each([
            'example.com##.ad',
            '||example.com^$script,third-party',
            // this is short, but it's a comment rule
            '!',
        ])("'%s'", (rule) => {
            expect(linter.lint(rule)).toMatchObject({ problems: [] });
        });
    });

    describe('should detect problematic cases', () => {
        test.each([
            {
                actual: 'a',
                expected: [
                    {
                        rule: 'no-short-rules',
                        severity: 2,
                        message: "Too short rule: 'a'",
                        position: {
                            startColumn: 0,
                            endColumn: 1,
                        },
                    },
                ],
            },
            {
                actual: 'aaa',
                expected: [
                    {
                        rule: 'no-short-rules',
                        severity: 2,
                        message: "Too short rule: 'aaa'",
                        position: {
                            startColumn: 0,
                            endColumn: 3,
                        },
                    },
                ],
            },
            {
                // with spaces it's reaches the limit, but we should trim it
                actual: '  a  ',
                expected: [
                    {
                        rule: 'no-short-rules',
                        severity: 2,
                        message: "Too short rule: '  a  '",
                        position: {
                            // note: AGTree includes spaces in the column count
                            startColumn: 0,
                            endColumn: 5,
                        },
                    },
                ],
            },
        ])("'$actual'", ({ actual, expected }) => {
            expect(linter.lint(actual)).toMatchObject({ problems: expected });
        });
    });

    describe('should work with custom min length', () => {
        test.each([
            {
                actual: 'aaaaa',
                expected: [
                    {
                        rule: 'no-short-rules',
                        severity: 2,
                        message: "Too short rule: 'aaaaa'",
                        position: {
                            startColumn: 0,
                            endColumn: 5,
                        },
                    },
                ],
            },
            {
                actual: '##.ad',
                expected: [
                    {
                        rule: 'no-short-rules',
                        severity: 2,
                        message: "Too short rule: '##.ad'",
                        position: {
                            startColumn: 0,
                            endColumn: 5,
                        },
                    },
                ],
            },
        ])("'$actual'", ({ actual, expected }) => {
            // Override rule config
            linter.setRuleConfig('no-short-rules', [2, { minLength: 6 }]);
            expect(linter.lint(actual)).toMatchObject({ problems: expected });
        });
    });
});
