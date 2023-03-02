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
                        startColumn: 0,
                        endColumn: 29,
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
                        startColumn: 0,
                        endColumn: 33,
                    },
                },
            ],
        });

        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                '!+ PLATFORM(windows, mac, android, ios, windows, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_safari, ext_ublock)',
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
                        startColumn: 0,
                        endColumn: 143,
                    },
                },
                {
                    rule: 'duplicated-hint-platforms',
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "ext_safari" is occurring more than once within the same "PLATFORM" hint',
                    position: {
                        startColumn: 0,
                        endColumn: 143,
                    },
                },
            ],
        });

        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                '!+ NOT_PLATFORM(windows, mac, android, ios, windows, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_safari, ext_ublock)',
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
                        startColumn: 0,
                        endColumn: 147,
                    },
                },
                {
                    rule: 'duplicated-hint-platforms',
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "ext_safari" is occurring more than once within the same "NOT_PLATFORM" hint',
                    position: {
                        startColumn: 0,
                        endColumn: 147,
                    },
                },
            ],
        });
    });
});
