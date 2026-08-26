import { describe, expect, test } from 'vitest';

import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint } from './helpers/lint';

const rulesConfig: LinterRulesConfig = {
    'no-short-rules': [LinterRuleSeverity.Error, { minLength: 4 }],
};

describe('no-short-rules', () => {
    describe('should ignore non-problematic cases', () => {
        test.each([
            'example.com##.ad',
            '||example.com^$script,third-party',
            // this is short, but it's a comment rule
            '!',
        ])("'%s'", async (rule) => {
            expect((await lint(rule, rulesConfig)).problems).toStrictEqual([]);
        });
    });

    describe('should detect problematic cases', () => {
        test.each([
            {
                actual: 'a',
                expected: [
                    {
                        category: 'problem',
                        ruleId: 'no-short-rules',
                        severity: LinterRuleSeverity.Error,
                        messageId: 'tooShortRule',
                        data: {
                            length: 1,
                            minLength: 4,
                        },
                        message: expect.any(String),
                        position: {
                            start: {
                                column: 0,
                                line: 1,
                            },
                            end: {
                                column: 1,
                                line: 1,
                            },
                        },
                    },
                ],
            },
            {
                actual: 'aaa',
                expected: [
                    {
                        category: 'problem',
                        ruleId: 'no-short-rules',
                        severity: LinterRuleSeverity.Error,
                        messageId: 'tooShortRule',
                        data: {
                            length: 3,
                            minLength: 4,
                        },
                        message: expect.any(String),
                        position: {
                            start: {
                                column: 0,
                                line: 1,
                            },
                            end: {
                                column: 3,
                                line: 1,
                            },
                        },
                    },
                ],
            },
            {
                // with spaces it's reaches the limit, but we should trim it
                actual: '  a  ',
                expected: [
                    {
                        category: 'problem',
                        ruleId: 'no-short-rules',
                        severity: LinterRuleSeverity.Error,
                        messageId: 'tooShortRule',
                        data: {
                            length: 1,
                            minLength: 4,
                        },
                        message: expect.any(String),
                        position: {
                            start: {
                                column: 0,
                                line: 1,
                            },
                            end: {
                                column: 5,
                                line: 1,
                            },
                        },
                    },
                ],
            },
        ])("'$actual'", async ({ actual, expected }) => {
            expect((await lint(actual, rulesConfig)).problems).toStrictEqual(expected);
        });
    });

    describe('should work with custom min length', () => {
        const customRulesConfig: LinterRulesConfig = {
            'no-short-rules': [LinterRuleSeverity.Error, { minLength: 6 }],
        };

        test.each([
            {
                actual: 'aaaaa',
                expected: [
                    {
                        category: 'problem',
                        ruleId: 'no-short-rules',
                        severity: LinterRuleSeverity.Error,
                        messageId: 'tooShortRule',
                        data: {
                            length: 5,
                            minLength: 6,
                        },
                        message: expect.any(String),
                        position: {
                            start: {
                                column: 0,
                                line: 1,
                            },
                            end: {
                                column: 5,
                                line: 1,
                            },
                        },
                    },
                ],
            },
            {
                actual: '##.ad',
                expected: [
                    {
                        category: 'problem',
                        ruleId: 'no-short-rules',
                        severity: LinterRuleSeverity.Error,
                        messageId: 'tooShortRule',
                        data: {
                            length: 5,
                            minLength: 6,
                        },
                        message: expect.any(String),
                        position: {
                            start: {
                                column: 0,
                                line: 1,
                            },
                            end: {
                                column: 5,
                                line: 1,
                            },
                        },
                    },
                ],
            },
        ])("'$actual'", async ({ actual, expected }) => {
            expect((await lint(actual, customRulesConfig)).problems).toStrictEqual(expected);
        });
    });
});
