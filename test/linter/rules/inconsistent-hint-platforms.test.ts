import { Linter } from '../../../src/linter';
import { InconsistentHintPlatforms } from '../../../src/linter/rules/inconsistent-hint-platforms';

let linter: Linter;

describe('inconsistent-hint-platforms', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('inconsistent-hint-platforms', InconsistentHintPlatforms);
    });

    test('should ignore non-problematic cases', () => {
        expect(linter.lint('!+ PLATFORM(windows)')).toMatchObject({ problems: [] });

        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                '!+ PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)',
            ),
        ).toMatchObject({ problems: [] });

        expect(linter.lint('!+ NOT_PLATFORM(windows)')).toMatchObject({ problems: [] });

        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                '!+ NOT_PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)',
            ),
        ).toMatchObject({ problems: [] });

        expect(linter.lint('!+ NOT_OPTIMIZED PLATFORM(windows)')).toMatchObject({ problems: [] });

        expect(linter.lint('!+ PLATFORM(windows) NOT_PLATFORM(mac)')).toMatchObject({ problems: [] });

        expect(linter.lint('!+ PLATFORM(mac) NOT_PLATFORM(windows)')).toMatchObject({ problems: [] });

        expect(linter.lint('!+ PLATFORM(mac) NOT_PLATFORM(windows) NOT_PLATFORM(android)')).toMatchObject({
            problems: [],
        });
    });

    it('should detect problematic cases', () => {
        expect(linter.lint('!+ PLATFORM(windows) NOT_PLATFORM(windows)')).toMatchObject({
            problems: [
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "windows" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startColumn: 12,
                        endColumn: 19,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "windows" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startColumn: 34,
                        endColumn: 41,
                    },
                },
            ],
        });

        expect(
            linter.lint('!+ PLATFORM(mac) NOT_PLATFORM(mac) NOT_PLATFORM(windows) NOT_OPTIMIZED PLATFORM(windows)'),
        ).toMatchObject({
            problems: [
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "mac" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startColumn: 12,
                        endColumn: 15,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "mac" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startColumn: 30,
                        endColumn: 33,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "windows" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startColumn: 48,
                        endColumn: 55,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "windows" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startColumn: 80,
                        endColumn: 87,
                    },
                },
            ],
        });

        expect(
            linter.lint(
                '!+ PLATFORM(mac) NOT_PLATFORM(windows) NOT_PLATFORM(android) NOT_PLATFORM(android) PLATFORM(android)',
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "android" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startColumn: 52,
                        endColumn: 59,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "android" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startColumn: 74,
                        endColumn: 81,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "android" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startColumn: 92,
                        endColumn: 99,
                    },
                },
            ],
        });

        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                '!+ NOT_PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock) PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)',
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "windows" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 16,
                        endLine: 1,
                        endColumn: 23,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "mac" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 25,
                        endLine: 1,
                        endColumn: 28,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "android" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 30,
                        endLine: 1,
                        endColumn: 37,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ios" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 39,
                        endLine: 1,
                        endColumn: 42,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_chromium" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 44,
                        endLine: 1,
                        endColumn: 56,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_ff" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 58,
                        endLine: 1,
                        endColumn: 64,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_edge" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 66,
                        endLine: 1,
                        endColumn: 74,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_opera" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 76,
                        endLine: 1,
                        endColumn: 85,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_safari" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 87,
                        endLine: 1,
                        endColumn: 97,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_android_cb" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 99,
                        endLine: 1,
                        endColumn: 113,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_ublock" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 115,
                        endLine: 1,
                        endColumn: 125,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "windows" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 136,
                        endLine: 1,
                        endColumn: 143,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "mac" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 145,
                        endLine: 1,
                        endColumn: 148,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "android" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 150,
                        endLine: 1,
                        endColumn: 157,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ios" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 159,
                        endLine: 1,
                        endColumn: 162,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_chromium" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 164,
                        endLine: 1,
                        endColumn: 176,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_ff" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 178,
                        endLine: 1,
                        endColumn: 184,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_edge" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 186,
                        endLine: 1,
                        endColumn: 194,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_opera" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 196,
                        endLine: 1,
                        endColumn: 205,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_safari" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 207,
                        endLine: 1,
                        endColumn: 217,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_android_cb" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 219,
                        endLine: 1,
                        endColumn: 233,
                    },
                },
                {
                    rule: 'inconsistent-hint-platforms',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: 'Platform "ext_ublock" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 235,
                        endLine: 1,
                        endColumn: 245,
                    },
                },
            ],
        });
    });
});
