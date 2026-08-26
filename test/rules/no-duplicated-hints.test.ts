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
    'no-duplicated-hints': LinterRuleSeverity.Error,
};

describe('no-duplicated-hints', () => {
    test('should ignore non-problematic cases', async () => {
        // PLATFORM with single parameter
        await expect(lint('!+ PLATFORM(windows)', rulesConfig)).resolves.toHaveProperty('problems', []);

        // PLATFORM with multiple parameters
        await expect(
            lint(
                // eslint-disable-next-line max-len
                '!+ PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)',
                rulesConfig,
            ),
        ).resolves.toHaveProperty('problems', []);

        // NOT_PLATFORM with single parameter
        await expect(lint('!+ NOT_PLATFORM(windows)', rulesConfig)).resolves.toHaveProperty('problems', []);

        // NOT_PLATFORM with multiple parameters
        await expect(
            lint(
                // eslint-disable-next-line max-len
                '!+ NOT_PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)',
                rulesConfig,
            ),
        ).resolves.toHaveProperty('problems', []);

        // Multiple hints within the same rule, but no duplicates
        await expect(
            lint('!+ NOT_OPTIMIZED PLATFORM(windows)', rulesConfig),
        ).resolves.toHaveProperty('problems', []);
        await expect(
            lint('!+ PLATFORM(windows) NOT_PLATFORM(mac)', rulesConfig),
        ).resolves.toHaveProperty('problems', []);
        await expect(
            lint('!+ PLATFORM(mac) NOT_PLATFORM(windows)', rulesConfig),
        ).resolves.toHaveProperty('problems', []);
    });

    it('should detect problematic cases', async () => {
        expect((await lint(
            '!+ PLATFORM(windows) PLATFORM(mac) NOT_PLATFORM(android) NOT_OPTIMIZED',
            rulesConfig,
        )).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-duplicated-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hint: 'PLATFORM',
                },
                messageId: 'duplicatedHints',
                message: expect.any(String),
                position: {
                    start: {
                        column: 21,
                        line: 1,
                    },
                    end: {
                        column: 34,
                        line: 1,
                    },
                },
            },
        ]);

        expect((await lint('!+ NOT_OPTIMIZED NOT_OPTIMIZED PLATFORM(windows)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-duplicated-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hint: 'NOT_OPTIMIZED',
                },
                messageId: 'duplicatedHints',
                message: expect.any(String),
                position: {
                    start: {
                        column: 17,
                        line: 1,
                    },
                    end: {
                        column: 30,
                        line: 1,
                    },
                },
            },
        ]);

        expect(
            (await lint(
                '!+ PLATFORM(windows) NOT_PLATFORM(ext_ff) NOT_PLATFORM(mac) NOT_PLATFORM(android)',
                rulesConfig,
            )).problems,
        ).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-duplicated-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hint: 'NOT_PLATFORM',
                },
                messageId: 'duplicatedHints',
                message: expect.any(String),
                position: {
                    start: {
                        column: 42,
                        line: 1,
                    },
                    end: {
                        column: 59,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hint: 'NOT_PLATFORM',
                },
                messageId: 'duplicatedHints',
                message: expect.any(String),
                position: {
                    start: {
                        column: 60,
                        line: 1,
                    },
                    end: {
                        column: 81,
                        line: 1,
                    },
                },
            },
        ]);

        expect(
            (await lint(
                '!+ PLATFORM(windows) NOT_PLATFORM(ext_ff) NOT_PLATFORM(mac) NOT_PLATFORM(android) PLATFORM(ext_edge)',
                rulesConfig,
            )).problems,
        ).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-duplicated-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hint: 'NOT_PLATFORM',
                },
                messageId: 'duplicatedHints',
                message: expect.any(String),
                position: {
                    start: {
                        column: 42,
                        line: 1,
                    },
                    end: {
                        column: 59,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hint: 'NOT_PLATFORM',
                },
                messageId: 'duplicatedHints',
                message: expect.any(String),
                position: {
                    start: {
                        column: 60,
                        line: 1,
                    },
                    end: {
                        column: 81,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hint: 'PLATFORM',
                },
                messageId: 'duplicatedHints',
                message: expect.any(String),
                position: {
                    start: {
                        column: 82,
                        line: 1,
                    },
                    end: {
                        column: 100,
                        line: 1,
                    },
                },
            },
        ]);

        expect(
            (await lint('!+ HINT HINT(aaa) HINT() HINT(aaa, bbb, ccc)', rulesConfig)).problems,
        ).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-duplicated-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hint: 'HINT',
                },
                messageId: 'duplicatedHints',
                message: expect.any(String),
                position: {
                    start: {
                        column: 8,
                        line: 1,
                    },
                    end: {
                        column: 17,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hint: 'HINT',
                },
                messageId: 'duplicatedHints',
                message: expect.any(String),
                position: {
                    start: {
                        column: 18,
                        line: 1,
                    },
                    end: {
                        column: 24,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-hints',
                severity: LinterRuleSeverity.Error,
                data: {
                    hint: 'HINT',
                },
                messageId: 'duplicatedHints',
                message: expect.any(String),
                position: {
                    start: {
                        column: 25,
                        line: 1,
                    },
                    end: {
                        column: 44,
                        line: 1,
                    },
                },
            },
        ]);
    });
});
