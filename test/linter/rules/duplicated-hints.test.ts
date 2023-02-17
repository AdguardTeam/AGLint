import { Linter } from "../../../src/linter";
import { DuplicatedHints } from "../../../src/linter/rules/duplicated-hints";
import { NEWLINE } from "../../../src/utils/constants";

describe("duplicated-hints", () => {
    test("Detects duplicated hints", () => {
        const linter = new Linter(false);

        linter.addRule("duplicated-hints", DuplicatedHints);

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
                    `!+ PLATFORM(windows) PLATFORM(mac) NOT_PLATFORM(android) NOT_OPTIMIZED`,
                    `!+ NOT_OPTIMIZED NOT_OPTIMIZED PLATFORM(windows)`,
                    `!+ PLATFORM(windows) NOT_PLATFORM(ext_ff) NOT_PLATFORM(mac) NOT_PLATFORM(android)`,
                    // eslint-disable-next-line max-len
                    `!+ PLATFORM(windows) NOT_PLATFORM(ext_ff) NOT_PLATFORM(mac) NOT_PLATFORM(android) PLATFORM(ext_edge)`,
                    `!+ HINT HINT(aaa) HINT() HINT(aaa, bbb, ccc)`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "duplicated-hints",
                    severity: 1,
                    message: 'The hint "PLATFORM" is occurring more than once within the same comment rule',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 70,
                    },
                },
                {
                    rule: "duplicated-hints",
                    severity: 1,
                    message: 'The hint "NOT_OPTIMIZED" is occurring more than once within the same comment rule',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 48,
                    },
                },
                {
                    rule: "duplicated-hints",
                    severity: 1,
                    message: 'The hint "NOT_PLATFORM" is occurring more than once within the same comment rule',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 81,
                    },
                },
                {
                    rule: "duplicated-hints",
                    severity: 1,
                    message: 'The hint "PLATFORM" is occurring more than once within the same comment rule',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 100,
                    },
                },
                {
                    rule: "duplicated-hints",
                    severity: 1,
                    message: 'The hint "NOT_PLATFORM" is occurring more than once within the same comment rule',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 100,
                    },
                },
                {
                    rule: "duplicated-hints",
                    severity: 1,
                    message: 'The hint "HINT" is occurring more than once within the same comment rule',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 44,
                    },
                },
            ],
            warningCount: 6,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });
});
