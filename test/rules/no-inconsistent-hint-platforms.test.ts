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
    'no-inconsistent-hint-platforms': LinterRuleSeverity.Error,
};

describe('no-inconsistent-hint-platforms', () => {
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

        await expect(
            lint(
                '!+ NOT_OPTIMIZED PLATFORM(windows)',
                rulesConfig,
            ),
        ).resolves.toMatchObject({ problems: [] });

        await expect(
            lint(
                '!+ PLATFORM(windows) NOT_PLATFORM(mac)',
                rulesConfig,
            ),
        ).resolves.toMatchObject({ problems: [] });

        await expect(
            lint(
                '!+ PLATFORM(mac) NOT_PLATFORM(windows)',
                rulesConfig,
            ),
        ).resolves.toMatchObject({ problems: [] });

        await expect(
            lint(
                '!+ PLATFORM(mac) NOT_PLATFORM(windows) NOT_PLATFORM(android)',
                rulesConfig,
            ),
        ).resolves.toMatchObject({
            problems: [],
        });
    });

    it('should detect problematic cases', async () => {
        expect((await lint('!+ PLATFORM(windows) NOT_PLATFORM(windows)', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'windows',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "windows" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 12,
                        line: 1,
                    },
                    end: {
                        column: 19,
                        line: 1,
                    },
                },
            },
        ]);

        expect(
            (await lint(
                '!+ PLATFORM(mac) NOT_PLATFORM(mac) NOT_PLATFORM(windows) NOT_OPTIMIZED PLATFORM(windows)',
                rulesConfig,
            )).problems,
        ).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'mac',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "mac" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 12,
                        line: 1,
                    },
                    end: {
                        column: 15,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'windows',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "windows" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 80,
                        line: 1,
                    },
                    end: {
                        column: 87,
                        line: 1,
                    },
                },
            },
        ]);

        expect(
            (await lint(
                '!+ PLATFORM(mac) NOT_PLATFORM(windows) NOT_PLATFORM(android) NOT_PLATFORM(android) PLATFORM(android)',
                rulesConfig,
            )).problems,
        ).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'android',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "android" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 92,
                        line: 1,
                    },
                    end: {
                        column: 99,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'android',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "android" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 92,
                        line: 1,
                    },
                    end: {
                        column: 99,
                        line: 1,
                    },
                },
            },
        ]);

        expect(
            (await lint(
                // eslint-disable-next-line max-len
                '!+ NOT_PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock) PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)',
                rulesConfig,
            )).problems,
        ).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'windows',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "windows" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 136,
                        line: 1,
                    },
                    end: {
                        column: 143,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'mac',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "mac" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 145,
                        line: 1,
                    },
                    end: {
                        column: 148,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'android',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "android" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 150,
                        line: 1,
                    },
                    end: {
                        column: 157,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'ios',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "ios" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 159,
                        line: 1,
                    },
                    end: {
                        column: 162,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'ext_chromium',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "ext_chromium" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 164,
                        line: 1,
                    },
                    end: {
                        column: 176,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'ext_ff',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "ext_ff" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 178,
                        line: 1,
                    },
                    end: {
                        column: 184,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'ext_edge',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "ext_edge" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 186,
                        line: 1,
                    },
                    end: {
                        column: 194,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'ext_opera',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "ext_opera" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 196,
                        line: 1,
                    },
                    end: {
                        column: 205,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'ext_safari',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "ext_safari" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 207,
                        line: 1,
                    },
                    end: {
                        column: 217,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'ext_android_cb',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "ext_android_cb" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 219,
                        line: 1,
                    },
                    end: {
                        column: 233,
                        line: 1,
                    },
                },
            },
            {
                category: 'problem',
                ruleId: 'no-inconsistent-hint-platforms',
                severity: LinterRuleSeverity.Error,
                data: {
                    platform: 'ext_ublock',
                },
                // eslint-disable-next-line max-len
                message: 'Platform "ext_ublock" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                messageId: 'inconsistentHintPlatforms',
                position: {
                    start: {
                        column: 235,
                        line: 1,
                    },
                    end: {
                        column: 245,
                        line: 1,
                    },
                },
            },
        ]);
    });
});
