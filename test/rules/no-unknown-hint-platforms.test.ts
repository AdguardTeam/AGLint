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
    'no-unknown-hints': LinterRuleSeverity.Error,
    'no-unknown-hint-platforms': LinterRuleSeverity.Error,
    'no-invalid-hint-params': LinterRuleSeverity.Error,
};

describe('no-unknown-hint-platforms', () => {
    test('should ignore non-problematic cases', async () => {
        // NOT_OPTIMIZED
        await expect(lint('!+ NOT_OPTIMIZED', rulesConfig)).resolves.toMatchObject({ problems: [] });

        // NOT_VALIDATE
        await expect(lint('!+ NOT_VALIDATE', rulesConfig)).resolves.toMatchObject({ problems: [] });

        // PLATFORM single
        await expect(lint('!+ PLATFORM(windows)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ PLATFORM(mac)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ PLATFORM(cli)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ PLATFORM(android)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ PLATFORM(ios)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ PLATFORM(ext_chromium_mv3)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ PLATFORM(ext_chromium)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ PLATFORM(ext_ff)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ PLATFORM(ext_edge)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ PLATFORM(ext_opera)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ PLATFORM(ext_safari)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ PLATFORM(ext_android_cb)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ PLATFORM(ext_ublock)', rulesConfig)).resolves.toMatchObject({ problems: [] });

        // PLATFORM mixed
        await expect(
            lint(
                // eslint-disable-next-line max-len
                '!+ PLATFORM(windows, mac, cli, android, ios, ext_chromium_mv3, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)',
                rulesConfig,
            ),
        ).resolves.toMatchObject({ problems: [] });

        // NOT_PLATFORM single
        await expect(lint('!+ NOT_PLATFORM(windows)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ NOT_PLATFORM(mac)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ NOT_PLATFORM(cli)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ NOT_PLATFORM(android)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ NOT_PLATFORM(ios)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ NOT_PLATFORM(ext_chromium_mv3)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ NOT_PLATFORM(ext_chromium)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ NOT_PLATFORM(ext_ff)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ NOT_PLATFORM(ext_edge)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ NOT_PLATFORM(ext_opera)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ NOT_PLATFORM(ext_safari)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ NOT_PLATFORM(ext_android_cb)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(lint('!+ NOT_PLATFORM(ext_ublock)', rulesConfig)).resolves.toMatchObject({ problems: [] });

        // NOT_PLATFORM mixed
        await expect(
            lint(
                // eslint-disable-next-line max-len
                '!+ NOT_PLATFORM(windows, mac, cli, android, ios, ext_chromium_mv3, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)',
                rulesConfig,
            ),
        ).resolves.toMatchObject({ problems: [] });
    });

    it('should detect problematic cases', async () => {
        // syntax error
        // expect((await lint('!+ NOT_OPTIMIZED(', rulesConfig)).problems).toStrictEqual([
        //     {
        //         category: 'problem',
        //         ruleId: 'parser',
        //         severity: 3,
        // eslint-disable-next-line max-len
        //         message: 'Cannot parse adblock rule due to the following error: Missing closing parenthesis for hint "NOT_OPTIMIZED"', // eslint-disable-line max-len
        //         position: {
        //             start: {
        //                 column: 3,
        //                 line: 1,
        //             },
        //             end: {
        //                 column: 17,
        //                 line: 1,
        //             },
        //         },
        //     },
        // ]);

        // NOT_OPTIMIZED should not have parameters
        expect((await lint('!+ NOT_OPTIMIZED()', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-hint-params',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'NOT_OPTIMIZED',
                },
                message: expect.any(String),
                messageId: 'hintMustNotHaveAnyParameters',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 18,
                        line: 1,
                    },
                },
            },
        ]);

        // NOT_OPTIMIZED should not have parameters
        expect((await lint('!+ NOT_OPTIMIZED(aa)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-hint-params',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'NOT_OPTIMIZED',
                },
                message: expect.any(String),
                messageId: 'hintMustNotHaveAnyParameters',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 20,
                        line: 1,
                    },
                },
            },
        ]);

        // NOT_OPTIMIZED should not have parameters
        expect((await lint('!+ NOT_OPTIMIZED(aa, bb)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-hint-params',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'NOT_OPTIMIZED',
                },
                message: expect.any(String),
                messageId: 'hintMustNotHaveAnyParameters',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 24,
                        line: 1,
                    },
                },
            },
        ]);

        // Hint name is case-sensitive
        expect((await lint('!+ not_optimized', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'not_optimized',
                },
                message: expect.any(String),
                messageId: 'unknownHintName',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 16,
                        line: 1,
                    },
                },
            },
        ]);

        // syntax error
        // expect((await lint('!+ NOT_VALIDATE(', rulesConfig)).problems).toStrictEqual([
        //     {
        //         category: 'problem',
        //         ruleId: 'parser',
        //         severity: 3,
        // eslint-disable-next-line max-len
        //         message: 'Cannot parse adblock rule due to the following error: Missing closing parenthesis for hint "NOT_VALIDATE"', // eslint-disable-line max-len
        //         position: {
        //             start: {
        //                 column: 3,
        //                 line: 1,
        //             },
        //             end: {
        //                 column: 16,
        //                 line: 1,
        //             },
        //         },
        //     },
        // ]);

        // NOT_VALIDATE should not have parameters
        expect((await lint('!+ NOT_VALIDATE()', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-hint-params',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'NOT_VALIDATE',
                },
                message: expect.any(String),
                messageId: 'hintMustNotHaveAnyParameters',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 17,
                        line: 1,
                    },
                },
            },
        ]);

        // NOT_VALIDATE should not have parameters
        expect((await lint('!+ NOT_VALIDATE(aa)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-hint-params',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'NOT_VALIDATE',
                },
                message: expect.any(String),
                messageId: 'hintMustNotHaveAnyParameters',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 19,
                        line: 1,
                    },
                },
            },
        ]);

        // NOT_VALIDATE should not have parameters
        expect((await lint('!+ NOT_VALIDATE(aa, bb)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-hint-params',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'NOT_VALIDATE',
                },
                message: expect.any(String),
                messageId: 'hintMustNotHaveAnyParameters',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 23,
                        line: 1,
                    },
                },
            },
        ]);

        // Hint name is case-sensitive
        expect((await lint('!+ not_validate', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'not_validate',
                },
                message: expect.any(String),
                messageId: 'unknownHintName',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 15,
                        line: 1,
                    },
                },
            },
        ]);

        // Syntax error
        // expect((await lint('!+ PLATFORM(', rulesConfig)).problems).toStrictEqual([
        //     {
        //         category: 'problem',
        //         ruleId: 'parser',
        //         severity: 3,
        // eslint-disable-next-line max-len
        //         message: 'Cannot parse adblock rule due to the following error: Missing closing parenthesis for hint "PLATFORM"', // eslint-disable-line max-len
        //         position: {
        //             start: {
        //                 column: 3,
        //                 line: 1,
        //             },
        //             end: {
        //                 column: 12,
        //                 line: 1,
        //             },
        //         },
        //     },
        // ]);

        // PLATFORM should have valid parameters
        expect((await lint('!+ PLATFORM()', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-hint-params',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'PLATFORM',
                },
                message: expect.any(String),
                messageId: 'hintMustHaveAtLeastOnePlatform',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 13,
                        line: 1,
                    },
                },
            },
        ]);

        // PLATFORM should have valid parameters
        expect((await lint('!+ PLATFORM(aa)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'aa',
                },
                message: expect.any(String),
                messageId: 'unknownPlatform',
                position: {
                    start: {
                        column: 12,
                        line: 1,
                    },
                    end: {
                        column: 14,
                        line: 1,
                    },
                },
            },
        ]);

        // PLATFORM should have valid parameters
        expect((await lint('!+ PLATFORM(aa, bb)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'aa',
                },
                message: expect.any(String),
                messageId: 'unknownPlatform',
                position: {
                    start: {
                        column: 12,
                        line: 1,
                    },
                    end: {
                        column: 14,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-unknown-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'bb',
                },
                message: expect.any(String),
                messageId: 'unknownPlatform',
                position: {
                    start: {
                        column: 16,
                        line: 1,
                    },
                    end: {
                        column: 18,
                        line: 1,
                    },
                },
            },
        ]);

        // Platform name is case-sensitive, even if it has a valid parameter
        expect((await lint('!+ platform(windows)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'platform',
                },
                message: expect.any(String),
                messageId: 'unknownHintName',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 20,
                        line: 1,
                    },
                },
            },
        ]);

        // Syntax error
        // expect((await lint('!+ NOT_PLATFORM(', rulesConfig)).problems).toStrictEqual([
        //     {
        //         category: 'problem',
        //         ruleId: 'parser',
        //         severity: 3,
        // eslint-disable-next-line max-len
        //         message: 'Cannot parse adblock rule due to the following error: Missing closing parenthesis for hint "NOT_PLATFORM"', // eslint-disable-line max-len
        //         position: {
        //             start: {
        //                 column: 3,
        //                 line: 1,
        //             },
        //             end: {
        //                 column: 16,
        //                 line: 1,
        //             },
        //         },
        //     },
        // ]);

        // NOT_PLATFORM should have valid parameters
        expect((await lint('!+ NOT_PLATFORM()', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-hint-params',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'NOT_PLATFORM',
                },
                message: expect.any(String),
                messageId: 'hintMustHaveAtLeastOnePlatform',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 17,
                        line: 1,
                    },
                },
            },
        ]);

        // NOT_PLATFORM should have valid parameters
        expect((await lint('!+ NOT_PLATFORM(aa)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'aa',
                },
                message: expect.any(String),
                messageId: 'unknownPlatform',
                position: {
                    start: {
                        column: 16,
                        line: 1,
                    },
                    end: {
                        column: 18,
                        line: 1,
                    },
                },
            },
        ]);

        // NOT_PLATFORM should have valid parameters
        expect((await lint('!+ NOT_PLATFORM(aa, bb)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'aa',
                },
                message: expect.any(String),
                messageId: 'unknownPlatform',
                position: {
                    start: {
                        column: 16,
                        line: 1,
                    },
                    end: {
                        column: 18,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-unknown-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'bb',
                },
                message: expect.any(String),
                messageId: 'unknownPlatform',
                position: {
                    start: {
                        column: 20,
                        line: 1,
                    },
                    end: {
                        column: 22,
                        line: 1,
                    },
                },
            },
        ]);

        // Platform name is case-sensitive, even if it has a valid parameter
        expect((await lint('!+ not_platform(windows)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'not_platform',
                },
                message: expect.any(String),
                messageId: 'unknownHintName',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 24,
                        line: 1,
                    },
                },
            },
        ]);

        // Syntax error
        // expect((await lint('!+ HINT(', rulesConfig)).problems).toStrictEqual([
        //     {
        //         category: 'problem',
        //         ruleId: 'parser',
        //         severity: 3,
        // eslint-disable-next-line max-len
        //         message: 'Cannot parse adblock rule due to the following error: Missing closing parenthesis for hint "HINT"', // eslint-disable-line max-len
        //         position: {
        //             start: {
        //                 column: 3,
        //                 line: 1,
        //             },
        //             end: {
        //                 column: 8,
        //                 line: 1,
        //             },
        //         },
        //     },
        // ]);

        // Unknown hint name
        expect((await lint('!+ HINT', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'HINT',
                },
                message: expect.any(String),
                messageId: 'unknownHintName',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 7,
                        line: 1,
                    },
                },
            },
        ]);

        // Unknown hint name
        expect((await lint('!+ HINT(aa)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'HINT',
                },
                message: expect.any(String),
                messageId: 'unknownHintName',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 11,
                        line: 1,
                    },
                },
            },
        ]);

        // Unknown hint name
        expect((await lint('!+ HINT(aa, bb)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'HINT',
                },
                message: expect.any(String),
                messageId: 'unknownHintName',
                position: {
                    start: {
                        column: 3,
                        line: 1,
                    },
                    end: {
                        column: 15,
                        line: 1,
                    },
                },
            },
        ]);

        // Unknown hint name
        expect((await lint('!+ NOT_HINT', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-unknown-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hintName: 'NOT_HINT',
                },
                message: expect.any(String),
                messageId: 'unknownHintName',
                position: {
                    start: {
                        column: 3,
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
