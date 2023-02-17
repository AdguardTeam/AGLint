import { Linter } from "../../../src/linter";
import { InconsistentHintPlatforms } from "../../../src/linter/rules/inconsistent-hint-platforms";

let linter: Linter;

describe("inconsistent-hint-platforms", () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule("inconsistent-hint-platforms", InconsistentHintPlatforms);
    });

    test("should ignore non-problematic cases", () => {
        expect(linter.lint(`!+ PLATFORM(windows)`)).toMatchObject({ problems: [] });

        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                `!+ PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)`
            )
        ).toMatchObject({ problems: [] });

        expect(linter.lint(`!+ NOT_PLATFORM(windows)`)).toMatchObject({ problems: [] });

        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                `!+ NOT_PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)`
            )
        ).toMatchObject({ problems: [] });

        expect(linter.lint(`!+ NOT_OPTIMIZED PLATFORM(windows)`)).toMatchObject({ problems: [] });

        expect(linter.lint(`!+ PLATFORM(windows) NOT_PLATFORM(mac)`)).toMatchObject({ problems: [] });

        expect(linter.lint(`!+ PLATFORM(mac) NOT_PLATFORM(windows)`)).toMatchObject({ problems: [] });

        expect(linter.lint(`!+ PLATFORM(mac) NOT_PLATFORM(windows) NOT_PLATFORM(android)`)).toMatchObject({
            problems: [],
        });
    });

    it("should detect problematic cases", () => {
        expect(linter.lint(`!+ PLATFORM(windows) NOT_PLATFORM(windows)`)).toMatchObject({
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
            ],
        });

        expect(
            linter.lint(`!+ PLATFORM(mac) NOT_PLATFORM(mac) NOT_PLATFORM(windows) NOT_OPTIMIZED PLATFORM(windows)`)
        ).toMatchObject({
            problems: [
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "mac" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
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
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 88,
                    },
                },
            ],
        });

        expect(
            linter.lint(
                `!+ PLATFORM(mac) NOT_PLATFORM(windows) NOT_PLATFORM(android) NOT_PLATFORM(android) PLATFORM(android)`
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "inconsistent-hint-platforms",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Platform "android" is targeted by a PLATFORM() hint and excluded by a NOT_PLATFORM() hint at the same time',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 100,
                    },
                },
            ],
        });

        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                `!+ NOT_PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock) PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)`
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
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
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
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
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
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
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
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
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
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
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
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
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
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
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
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
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
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
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
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 246,
                    },
                },
            ],
        });
    });
});
