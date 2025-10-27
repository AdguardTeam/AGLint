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
    'no-unknown-preprocessor-directives': LinterRuleSeverity.Error,
};

describe('no-unknown-preprocessor-directives', () => {
    test('should ignore non-problematic cases', async () => {
        await expect(lint('!#include https://example.org/path/includedfile.txt', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!#if (conditions)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!#if (conditions_2)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!#else', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!#endif', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!#safari_cb_affinity', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!#safari_cb_affinity()', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!#safari_cb_affinity(params)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(
            lint('!#safari_cb_affinity(general,privacy)', rulesConfig),
        ).resolves.toMatchObject({ problems: [] });
    });

    it('should detect problematic cases', async () => {
        expect((await lint('!#incl2ude https://example.org/path/includedfile.txt', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-preprocessor-directives',
                severity: LinterRuleSeverity.Error,
                data: {
                    directive: 'incl2ude',
                },
                message: 'Unknown preprocessor directive "incl2ude"',
                messageId: 'unknownPreprocessorDirective',
                position: {
                    start: {
                        column: 0,
                        line: 1,
                    },
                    end: {
                        column: 52,
                        line: 1,
                    },
                },
            },
        ]);

        expect((await lint('!#IF (conditions)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-preprocessor-directives',
                severity: LinterRuleSeverity.Error,
                data: {
                    directive: 'IF',
                },
                message: 'Unknown preprocessor directive "IF"',
                messageId: 'unknownPreprocessorDirective',
                position: {
                    start: {
                        column: 0,
                        line: 1,
                    },
                    end: {
                        column: 17,
                        line: 1,
                    },
                },
            },
        ]);

        expect((await lint('!#if2 (conditions_2)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-preprocessor-directives',
                severity: LinterRuleSeverity.Error,
                data: {
                    directive: 'if2',
                },
                message: 'Unknown preprocessor directive "if2"',
                messageId: 'unknownPreprocessorDirective',
                position: {
                    start: {
                        column: 0,
                        line: 1,
                    },
                    end: {
                        column: 20,
                        line: 1,
                    },
                },
            },
        ]);

        expect((await lint('!#end-if', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-preprocessor-directives',
                severity: LinterRuleSeverity.Error,
                data: {
                    directive: 'end-if',
                },
                message: 'Unknown preprocessor directive "end-if"',
                messageId: 'unknownPreprocessorDirective',
                position: {
                    start: {
                        column: 0,
                        line: 1,
                    },
                    end: {
                        column: 8,
                        line: 1,
                    },
                },
            },
        ]);

        expect((await lint('!#something', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-preprocessor-directives',
                severity: LinterRuleSeverity.Error,
                data: {
                    directive: 'something',
                },
                message: 'Unknown preprocessor directive "something"',
                messageId: 'unknownPreprocessorDirective',
                position: {
                    start: {
                        column: 0,
                        line: 1,
                    },
                    end: {
                        column: 11,
                        line: 1,
                    },
                },
            },
        ]);
    });
});
