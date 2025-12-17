import {
    describe,
    expect,
    it,
    test,
} from 'vitest';

import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint, lintWithFixes } from './helpers/lint';

const rulesConfig: LinterRulesConfig = {
    'no-duplicated-hint-platforms': LinterRuleSeverity.Error,
};

describe('no-duplicated-hint-platforms', () => {
    test('should ignore non-problematic cases', async () => {
        await expect(lint('!+ PLATFORM(windows)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(
            lint(
                // eslint-disable-next-line max-len
                '!+ PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)',
                rulesConfig,
            ),
        ).resolves.toMatchObject({ problems: [] });

        await expect(lint('!+ NOT_PLATFORM(windows)', rulesConfig)).resolves.toMatchObject({ problems: [] });
        await expect(
            lint(
                // eslint-disable-next-line max-len
                '!+ NOT_PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)',
                rulesConfig,
            ),
        ).resolves.toMatchObject({ problems: [] });
    });

    it('should detect problematic cases', async () => {
        expect((await lint('!+ PLATFORM(windows, windows)', rulesConfig)).problems).toMatchObject([
            {
                category: 'problem',
                ruleId: 'no-duplicated-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'windows',
                },
                messageId: 'duplicatedHintPlatforms',
                message: expect.any(String),
                position: {
                    start: {
                        column: 21,
                        line: 1,
                    },
                    end: {
                        column: 28,
                        line: 1,
                    },
                },
                fix: {
                    range: [
                        19,
                        28,
                    ],
                    text: '',
                },
            },
        ]);

        expect((await lint('!+ NOT_PLATFORM(windows, windows)', rulesConfig)).problems).toMatchObject([
            {
                category: 'problem',
                ruleId: 'no-duplicated-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'windows',
                },
                messageId: 'duplicatedHintPlatforms',
                message: expect.any(String),
                position: {
                    start: {
                        column: 25,
                        line: 1,
                    },
                    end: {
                        column: 32,
                        line: 1,
                    },
                },
                fix: {
                    range: [
                        23,
                        32,
                    ],
                    text: '',
                },
            },
        ]);

        expect(
            (await lint(
                // eslint-disable-next-line max-len
                '!+ PLATFORM(windows, mac, android, ios, windows, windows, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_safari, ext_ublock)',
                rulesConfig,
            )).problems,
        ).toMatchObject([
            {
                category: 'problem',
                ruleId: 'no-duplicated-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'windows',
                },
                messageId: 'duplicatedHintPlatforms',
                message: expect.any(String),
                position: {
                    start: {
                        column: 40,
                        line: 1,
                    },
                    end: {
                        column: 47,
                        line: 1,
                    },
                },
                fix: {
                    range: [
                        38,
                        47,
                    ],
                    text: '',
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'windows',
                },
                messageId: 'duplicatedHintPlatforms',
                message: expect.any(String),
                position: {
                    start: {
                        column: 49,
                        line: 1,
                    },
                    end: {
                        column: 56,
                        line: 1,
                    },
                },
                fix: {
                    range: [
                        47,
                        56,
                    ],
                    text: '',
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'ext_safari',
                },
                messageId: 'duplicatedHintPlatforms',
                message: expect.any(String),
                position: {
                    start: {
                        column: 129,
                        line: 1,
                    },
                    end: {
                        column: 139,
                        line: 1,
                    },
                },
                fix: {
                    range: [
                        127,
                        139,
                    ],
                    text: '',
                },
            },
        ]);

        expect(
            (await lint(
                // eslint-disable-next-line max-len
                '!+ NOT_PLATFORM(windows, mac, android, ios, windows, windows, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_safari, ext_ublock)',
                rulesConfig,
            )).problems,
        ).toMatchObject([
            {
                category: 'problem',
                ruleId: 'no-duplicated-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'windows',
                },
                messageId: 'duplicatedHintPlatforms',
                message: expect.any(String),
                position: {
                    start: {
                        column: 44,
                        line: 1,
                    },
                    end: {
                        column: 51,
                        line: 1,
                    },
                },
                fix: {
                    range: [
                        42,
                        51,
                    ],
                    text: '',
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'windows',
                },
                messageId: 'duplicatedHintPlatforms',
                message: expect.any(String),
                position: {
                    start: {
                        column: 53,
                        line: 1,
                    },
                    end: {
                        column: 60,
                        line: 1,
                    },
                },
                fix: {
                    range: [
                        51,
                        60,
                    ],
                    text: '',
                },
            },
            {
                category: 'problem',
                ruleId: 'no-duplicated-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'ext_safari',
                },
                messageId: 'duplicatedHintPlatforms',
                message: expect.any(String),
                position: {
                    start: {
                        column: 133,
                        line: 1,
                    },
                    end: {
                        column: 143,
                        line: 1,
                    },
                },
                fix: {
                    range: [
                        131,
                        143,
                    ],
                    text: '',
                },
            },
        ]);
    });

    it('should fix problematic cases properly', async () => {
        expect(
            (await lintWithFixes(
                // eslint-disable-next-line max-len
                '!+ NOT_PLATFORM(windows, mac, android, ios, windows, windows, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_safari, ext_ublock)',
                rulesConfig,
            )),
        // eslint-disable-next-line max-len
        ).toHaveProperty('fixedSource', '!+ NOT_PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)');
    });
});
