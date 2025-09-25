import {
    beforeAll,
    describe,
    expect,
    it,
    test,
} from 'vitest';

import { Linter } from '../../../src/linter';
import { DuplicatedHintPlatforms } from '../../../src/linter/rules/duplicated-hint-platforms';

let linter: Linter;

describe('duplicated-hint-platforms', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('duplicated-hint-platforms', DuplicatedHintPlatforms);
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
    });

    it('should detect problematic cases', () => {
        expect(linter.lint('!+ PLATFORM(windows, windows)')).toMatchObject({
            problems: [
                {
                    rule: 'duplicated-hint-platforms',
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "windows" is occurring more than once within the same "PLATFORM" hint',
                    position: {
                        startColumn: 21,
                        endColumn: 28,
                    },
                },
            ],
        });

        expect(linter.lint('!+ NOT_PLATFORM(windows, windows)')).toMatchObject({
            problems: [
                {
                    rule: 'duplicated-hint-platforms',
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "windows" is occurring more than once within the same "NOT_PLATFORM" hint',
                    position: {
                        startColumn: 25,
                        endColumn: 32,
                    },
                },
            ],
        });

        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                '!+ PLATFORM(windows, mac, android, ios, windows, windows, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_safari, ext_ublock)',
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'duplicated-hint-platforms',
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "windows" is occurring more than once within the same "PLATFORM" hint',
                    position: {
                        startColumn: 40,
                        endColumn: 47,
                    },
                },
                {
                    rule: 'duplicated-hint-platforms',
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "windows" is occurring more than once within the same "PLATFORM" hint',
                    position: {
                        startColumn: 49,
                        endColumn: 56,
                    },
                },
                {
                    rule: 'duplicated-hint-platforms',
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "ext_safari" is occurring more than once within the same "PLATFORM" hint',
                    position: {
                        startColumn: 129,
                        endColumn: 139,
                    },
                },
            ],
        });

        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                '!+ NOT_PLATFORM(windows, mac, android, ios, windows, windows, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_safari, ext_ublock)',
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'duplicated-hint-platforms',
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "windows" is occurring more than once within the same "NOT_PLATFORM" hint',
                    position: {
                        startColumn: 44,
                        endColumn: 51,
                    },
                },
                {
                    rule: 'duplicated-hint-platforms',
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "windows" is occurring more than once within the same "NOT_PLATFORM" hint',
                    position: {
                        startColumn: 53,
                        endColumn: 60,
                    },
                },
                {
                    rule: 'duplicated-hint-platforms',
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "ext_safari" is occurring more than once within the same "NOT_PLATFORM" hint',
                    position: {
                        startColumn: 133,
                        endColumn: 143,
                    },
                },
            ],
        });
    });
});
