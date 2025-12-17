import {
    describe,
    expect,
    it,
    test,
} from 'vitest';

import { NEWLINE } from '../../src/common/constants';
import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint } from './helpers/lint';

const rulesConfig: LinterRulesConfig = {
    'if-directive-balance': LinterRuleSeverity.Error,
};

describe('if-directive-balance', () => {
    test('should ignore non-problematic cases', async () => {
        // if is closed properly
        await expect(
            lint(
                [
                    'rule',
                    '!#if (condition1)',
                    'rule',
                    '!#endif',
                    'rule',
                ].join(NEWLINE),
                rulesConfig,
            ),
        ).resolves.toMatchObject({
            problems: [],
        });

        // both if-s are closed properly
        await expect(
            lint(
                [
                    'rule',
                    '!#if (condition1)',
                    '!#if (condition2)',
                    'rule',
                    '!#endif',
                    'rule',
                    '!#endif',
                    'rule',
                ].join(NEWLINE),
                rulesConfig,
            ),
        ).resolves.toMatchObject({
            problems: [],
        });

        // 'if' block with 'else' branch
        await expect(
            lint(
                [
                    'rule0',
                    '!#if (condition1)',
                    'rule1',
                    '!#else',
                    'rule2',
                    '!#endif',
                    'rule3',
                ].join(NEWLINE),
                rulesConfig,
            ),
        ).resolves.toMatchObject({
            problems: [],
        });

        // 'include' directive inside 'if' block
        await expect(
            lint(
                [
                    'rule',
                    '!#if (condition1)',
                    '!#include https://raw.example.com/file1.txt',
                    '!#endif',
                ].join(NEWLINE),
                rulesConfig,
            ),
        ).resolves.toMatchObject({
            problems: [],
        });
    });

    test('should detect unclosed if-s', async () => {
        expect((await lint(
            [
                'rule',
                '!#if (condition1)',
                '!#if (condition2)',
                'rule',
                '!#endif',
                'rule',
                'rule',
            ].join(NEWLINE),
            rulesConfig,
        )).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'if-directive-balance',
                severity: LinterRuleSeverity.Error,
                data: {
                    directive: 'if',
                },
                message: expect.any(String),
                messageId: 'unclosedIf',
                position: {
                    start: {
                        column: 0,
                        line: 2,
                    },
                    end: {
                        column: 17,
                        line: 2,
                    },
                },
            },
        ]);

        // unclosed 'if' block with 'else' branch
        expect((await lint(
            [
                'rule0',
                '!#if (condition1)',
                'rule1',
                '!#endif',
                '!#if (condition2)',
                'rule2',
                '!#else',
                'rule3',
            ].join(NEWLINE),
            rulesConfig,
        )).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'if-directive-balance',
                severity: LinterRuleSeverity.Error,
                data: {
                    directive: 'if',
                },
                message: expect.any(String),
                messageId: 'unclosedIf',
                position: {
                    start: {
                        column: 0,
                        line: 5,
                    },
                    end: {
                        column: 17,
                        line: 5,
                    },
                },
            },
        ]);
    });

    test('should detect unopened else directive', async () => {
        expect((await lint(
            [
                'rule1',
                '!#else',
                'rule2',
            ].join(NEWLINE),
            rulesConfig,
        )).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'if-directive-balance',
                severity: LinterRuleSeverity.Error,
                data: {
                    directive: 'else',
                    ifDirective: 'if',
                },
                message: expect.any(String),
                messageId: 'missingIf',
                position: {
                    start: {
                        column: 0,
                        line: 2,
                    },
                    end: {
                        column: 6,
                        line: 2,
                    },
                },
            },
        ]);

        expect((await lint(
            [
                '!#if (condition1)',
                'rule1',
                '!#endif',
                '!#else',
                'rule2',
                '!#endif',
            ].join(NEWLINE),
            rulesConfig,
        )).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'if-directive-balance',
                severity: LinterRuleSeverity.Error,
                data: {
                    directive: 'else',
                    ifDirective: 'if',
                },
                message: expect.any(String),
                messageId: 'missingIf',
                position: {
                    start: {
                        column: 0,
                        line: 4,
                    },
                    end: {
                        column: 6,
                        line: 4,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'if-directive-balance',
                severity: LinterRuleSeverity.Error,
                data: {
                    directive: 'endif',
                    ifDirective: 'if',
                },
                message: expect.any(String),
                messageId: 'missingIf',
                position: {
                    start: {
                        column: 0,
                        line: 6,
                    },
                    end: {
                        column: 7,
                        line: 6,
                    },
                },
            },
        ]);
    });

    test('should detect unopened endif-s', async () => {
        expect((await lint(
            [
                'rule',
                '!#if (condition1)',
                'rule',
                '!#endif',
                '!#endif',
                'rule',
                'rule',
            ].join(NEWLINE),
            rulesConfig,
        )).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'if-directive-balance',
                severity: LinterRuleSeverity.Error,
                data: {
                    directive: 'endif',
                    ifDirective: 'if',
                },
                message: expect.any(String),
                messageId: 'missingIf',
                position: {
                    start: {
                        column: 0,
                        line: 5,
                    },
                    end: {
                        column: 7,
                        line: 5,
                    },
                },
            },
        ]);
    });

    it('no value for else and endif directives', async () => {
        expect((await lint(
            [
                'rule0',
                '!#if (condition1)',
                'rule1',
                '!#else (condition2)',
                'rule2',
                '!#endif (condition1)',
            ].join(NEWLINE),
            rulesConfig,
        )).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'if-directive-balance',
                severity: LinterRuleSeverity.Error,
                data: {
                    directive: 'else',
                },
                message: expect.any(String),
                messageId: 'invalidDirective',
                position: {
                    start: {
                        column: 0,
                        line: 4,
                    },
                    end: {
                        column: 19,
                        line: 4,
                    },
                },
                fix: {
                    range: [
                        36,
                        49,
                    ],
                    text: '',
                },
            },
            {
                category: 'problem',
                ruleId: 'if-directive-balance',
                severity: LinterRuleSeverity.Error,
                data: {
                    directive: 'endif',
                },
                message: expect.any(String),
                messageId: 'invalidDirective',
                position: {
                    start: {
                        column: 0,
                        line: 6,
                    },
                    end: {
                        column: 20,
                        line: 6,
                    },
                },
                fix: {
                    range: [
                        63,
                        76,
                    ],
                    text: '',
                },
            },
        ]);
    });
});
