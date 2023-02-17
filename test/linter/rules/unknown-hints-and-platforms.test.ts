import { Linter } from "../../../src/linter";
import { UnknownHintsAndPlatforms } from "../../../src/linter/rules/unknown-hints-and-platforms";
import { NEWLINE } from "../../../src/utils/constants";

describe("unknown-preprocessor-directives", () => {
    test("Detects unknown preprocessor directives", () => {
        const linter = new Linter(false);

        linter.addRule("unknown-hints-and-platforms", UnknownHintsAndPlatforms);

        // Problem-free cases
        expect(
            linter.lint(
                [
                    // Rules:
                    `!+ PLATFORM(windows)`,
                    `!+ PLATFORM(mac)`,
                    `!+ PLATFORM(android)`,
                    `!+ PLATFORM(ios)`,
                    `!+ PLATFORM(ext_chromium)`,
                    `!+ PLATFORM(ext_ff)`,
                    `!+ PLATFORM(ext_edge)`,
                    `!+ PLATFORM(ext_opera)`,
                    `!+ PLATFORM(ext_safari)`,
                    `!+ PLATFORM(ext_android_cb)`,
                    `!+ PLATFORM(ext_ublock)`,
                    // eslint-disable-next-line max-len
                    `!+ PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)`,

                    `!+ NOT_PLATFORM(windows)`,
                    `!+ NOT_PLATFORM(mac)`,
                    `!+ NOT_PLATFORM(android)`,
                    `!+ NOT_PLATFORM(ios)`,
                    `!+ NOT_PLATFORM(ext_chromium)`,
                    `!+ NOT_PLATFORM(ext_ff)`,
                    `!+ NOT_PLATFORM(ext_edge)`,
                    `!+ NOT_PLATFORM(ext_opera)`,
                    `!+ NOT_PLATFORM(ext_safari)`,
                    `!+ NOT_PLATFORM(ext_android_cb)`,
                    `!+ NOT_PLATFORM(ext_ublock)`,
                    // eslint-disable-next-line max-len
                    `!+ NOT_PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)`,

                    `!+ NOT_OPTIMIZED`,
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
                    // Invalid NOT_OPTIMIZED
                    `!+ NOT_OPTIMIZED(`,
                    `!+ NOT_OPTIMIZED()`,
                    `!+ NOT_OPTIMIZED(aa)`,
                    `!+ NOT_OPTIMIZED(aa, bb)`,
                    `!+ not_optimized`,

                    // Invalid PLATFORM
                    `!+ PLATFORM(`,
                    `!+ PLATFORM()`,
                    `!+ PLATFORM(aa)`,
                    `!+ PLATFORM(aa, bb)`,
                    `!+ platform(windows)`,

                    // Invalid NOT_PLATFORM
                    `!+ NOT_PLATFORM(`,
                    `!+ NOT_PLATFORM()`,
                    `!+ NOT_PLATFORM(aa)`,
                    `!+ NOT_PLATFORM(aa, bb)`,
                    `!+ not_platform(windows)`,

                    // Unknown hints
                    `!+ HINT`,
                    `!+ HINT(aa)`,
                    `!+ HINT(aa, bb)`,
                    `!+ HINT(`,
                    `!+ NOT_HINT`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    severity: 3,
                    message: 'AGLint parsing error: Unclosed opening bracket at 16 in comment "!+ NOT_OPTIMIZED("',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 17,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Hint "NOT_OPTIMIZED" must not have any parameters',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 18,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Hint "NOT_OPTIMIZED" must not have any parameters',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 20,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Hint "NOT_OPTIMIZED" must not have any parameters',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 24,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Unknown hint name "not_optimized"',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 16,
                    },
                },
                {
                    severity: 3,
                    message: 'AGLint parsing error: Unclosed opening bracket at 11 in comment "!+ PLATFORM("',
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 12,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Hint "PLATFORM" must have at least one platform specified',
                    position: {
                        startLine: 7,
                        startColumn: 0,
                        endLine: 7,
                        endColumn: 13,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Unknown platform "aa" in hint "PLATFORM"',
                    position: {
                        startLine: 8,
                        startColumn: 0,
                        endLine: 8,
                        endColumn: 15,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Unknown platform "aa" in hint "PLATFORM"',
                    position: {
                        startLine: 9,
                        startColumn: 0,
                        endLine: 9,
                        endColumn: 19,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Unknown platform "bb" in hint "PLATFORM"',
                    position: {
                        startLine: 9,
                        startColumn: 0,
                        endLine: 9,
                        endColumn: 19,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Unknown hint name "platform"',
                    position: {
                        startLine: 10,
                        startColumn: 0,
                        endLine: 10,
                        endColumn: 20,
                    },
                },
                {
                    severity: 3,
                    message: 'AGLint parsing error: Unclosed opening bracket at 15 in comment "!+ NOT_PLATFORM("',
                    position: {
                        startLine: 11,
                        startColumn: 0,
                        endLine: 11,
                        endColumn: 16,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Hint "NOT_PLATFORM" must have at least one platform specified',
                    position: {
                        startLine: 12,
                        startColumn: 0,
                        endLine: 12,
                        endColumn: 17,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Unknown platform "aa" in hint "NOT_PLATFORM"',
                    position: {
                        startLine: 13,
                        startColumn: 0,
                        endLine: 13,
                        endColumn: 19,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Unknown platform "aa" in hint "NOT_PLATFORM"',
                    position: {
                        startLine: 14,
                        startColumn: 0,
                        endLine: 14,
                        endColumn: 23,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Unknown platform "bb" in hint "NOT_PLATFORM"',
                    position: {
                        startLine: 14,
                        startColumn: 0,
                        endLine: 14,
                        endColumn: 23,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Unknown hint name "not_platform"',
                    position: {
                        startLine: 15,
                        startColumn: 0,
                        endLine: 15,
                        endColumn: 24,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Unknown hint name "HINT"',
                    position: {
                        startLine: 16,
                        startColumn: 0,
                        endLine: 16,
                        endColumn: 7,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Unknown hint name "HINT"',
                    position: {
                        startLine: 17,
                        startColumn: 0,
                        endLine: 17,
                        endColumn: 11,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Unknown hint name "HINT"',
                    position: {
                        startLine: 18,
                        startColumn: 0,
                        endLine: 18,
                        endColumn: 15,
                    },
                },
                {
                    severity: 3,
                    message: 'AGLint parsing error: Unclosed opening bracket at 7 in comment "!+ HINT("',
                    position: {
                        startLine: 19,
                        startColumn: 0,
                        endLine: 19,
                        endColumn: 8,
                    },
                },
                {
                    rule: "unknown-hints-and-platforms",
                    severity: 2,
                    message: 'Unknown hint name "NOT_HINT"',
                    position: {
                        startLine: 20,
                        startColumn: 0,
                        endLine: 20,
                        endColumn: 11,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 18,
            fatalErrorCount: 4,
        });
    });
});
