import { Linter } from "../../../src/linter";
import { InconsistentHintPlatforms } from "../../../src/linter/rules/inconsistent-hint-platforms";
import { NEWLINE } from "../../../src/utils/constants";

describe("inconsistent-hint-platforms", () => {
    test("Detects inconsistent hint platforms", () => {
        const linter = new Linter(false);

        linter.addRule("inconsistent-hint-platforms", InconsistentHintPlatforms);

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

                    `!+ NOT_OPTIMIZED PLATFORM(windows)`,

                    `!+ PLATFORM(windows) NOT_PLATFORM(mac)`,
                    `!+ PLATFORM(mac) NOT_PLATFORM(windows)`,

                    `!+ PLATFORM(mac) NOT_PLATFORM(windows) NOT_PLATFORM(android)`,
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
                    `!+ PLATFORM(windows) NOT_PLATFORM(windows)`,
                    `!+ PLATFORM(mac) NOT_PLATFORM(mac) NOT_PLATFORM(windows) NOT_OPTIMIZED PLATFORM(windows)`,

                    // eslint-disable-next-line max-len
                    `!+ PLATFORM(mac) NOT_PLATFORM(windows) NOT_PLATFORM(android) NOT_PLATFORM(android) PLATFORM(android)`,

                    // eslint-disable-next-line max-len
                    `!+ NOT_PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock) PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "windows" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 42,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "mac" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 88,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "windows" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 88,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "android" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 100,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "windows" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 246,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "mac" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 246,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "android" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 246,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "ios" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 246,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "ext_chromium" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 246,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "ext_ff" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 246,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "ext_edge" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 246,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "ext_opera" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 246,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "ext_safari" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 246,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "ext_android_cb" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 246,
                    },
                },
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "ext_ublock" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 246,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 15,
            fatalErrorCount: 0,
        });
    });
});
