import { Linter } from "../../../src/linter";
import { DuplicatedHintPlatforms } from "../../../src/linter/rules/duplicated-hint-platforms";
import { NEWLINE } from "../../../src/utils/constants";

describe("duplicated-hint-platforms", () => {
    test("Detects duplicated hint platforms", () => {
        const linter = new Linter(false);

        linter.addRule("duplicated-hint-platforms", DuplicatedHintPlatforms);

        // Problem-free cases
        expect(
            linter.lint(
                [
                    `!+ PLATFORM(windows)`,
                    // eslint-disable-next-line max-len
                    `!+ PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)`,

                    `!+ NOT_PLATFORM(windows)`,
                    // eslint-disable-next-line max-len
                    `!+ NOT_PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Problematic cases
        expect(
            linter.lint(
                [
                    `!+ PLATFORM(windows, windows)`,
                    // eslint-disable-next-line max-len
                    `!+ PLATFORM(windows, mac, android, ios, windows, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_safari, ext_ublock)`,

                    `!+ NOT_PLATFORM(windows, windows)`,
                    // eslint-disable-next-line max-len
                    `!+ NOT_PLATFORM(windows, mac, android, ios, windows, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_safari, ext_ublock)`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "duplicated-hint-platforms",
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "windows" is occurring more than once within the same "PLATFORM" hint',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 29,
                    },
                },
                {
                    rule: "duplicated-hint-platforms",
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "windows" is occurring more than once within the same "PLATFORM" hint',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 143,
                    },
                },
                {
                    rule: "duplicated-hint-platforms",
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "ext_safari" is occurring more than once within the same "PLATFORM" hint',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 143,
                    },
                },
                {
                    rule: "duplicated-hint-platforms",
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "windows" is occurring more than once within the same "NOT_PLATFORM" hint',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 33,
                    },
                },
                {
                    rule: "duplicated-hint-platforms",
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "windows" is occurring more than once within the same "NOT_PLATFORM" hint',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 147,
                    },
                },
                {
                    rule: "duplicated-hint-platforms",
                    severity: 1,
                    message:
                        // eslint-disable-next-line max-len
                        'The platform "ext_safari" is occurring more than once within the same "NOT_PLATFORM" hint',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 147,
                    },
                },
            ],
            warningCount: 6,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });
});
