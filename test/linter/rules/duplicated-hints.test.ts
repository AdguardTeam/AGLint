import { Linter } from "../../../src/linter";
import { DuplicatedHints } from "../../../src/linter/rules/duplicated-hints";

let linter: Linter;

describe("duplicated-hints", () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule("duplicated-hints", DuplicatedHints);
    });

    test("should ignore non-problematic cases", () => {
        // PLATFORM with single parameter
        expect(linter.lint(`!+ PLATFORM(windows)`)).toMatchObject({ problems: [] });

        // PLATFORM with multiple parameters
        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                `!+ PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)`
            )
        ).toMatchObject({ problems: [] });

        // NOT_PLATFORM with single parameter
        expect(linter.lint(`!+ NOT_PLATFORM(windows)`)).toMatchObject({ problems: [] });

        // NOT_PLATFORM with multiple parameters
        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                `!+ NOT_PLATFORM(windows, mac, android, ios, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)`
            )
        ).toMatchObject({ problems: [] });

        // Multiple hints within the same rule, but no duplicates
        expect(linter.lint(`!+ NOT_OPTIMIZED PLATFORM(windows)`)).toMatchObject({ problems: [] });
        expect(linter.lint(`!+ PLATFORM(windows) NOT_PLATFORM(mac)`)).toMatchObject({ problems: [] });
        expect(linter.lint(`!+ PLATFORM(mac) NOT_PLATFORM(windows)`)).toMatchObject({ problems: [] });
    });

    it("should detect problematic cases", () => {
        expect(linter.lint(`!+ PLATFORM(windows) PLATFORM(mac) NOT_PLATFORM(android) NOT_OPTIMIZED`)).toMatchObject({
            problems: [
                {
                    rule: "duplicated-hints",
                    severity: 1,
                    message: 'The hint "PLATFORM" is occurring more than once within the same comment rule',
                    position: {
                        startColumn: 0,
                        endColumn: 70,
                    },
                },
            ],
        });

        expect(linter.lint(`!+ NOT_OPTIMIZED NOT_OPTIMIZED PLATFORM(windows)`)).toMatchObject({
            problems: [
                {
                    rule: "duplicated-hints",
                    severity: 1,
                    message: 'The hint "NOT_OPTIMIZED" is occurring more than once within the same comment rule',
                    position: {
                        startColumn: 0,
                        endColumn: 48,
                    },
                },
            ],
        });

        expect(
            linter.lint(`!+ PLATFORM(windows) NOT_PLATFORM(ext_ff) NOT_PLATFORM(mac) NOT_PLATFORM(android)`)
        ).toMatchObject({
            problems: [
                {
                    rule: "duplicated-hints",
                    severity: 1,
                    message: 'The hint "NOT_PLATFORM" is occurring more than once within the same comment rule',
                    position: {
                        startColumn: 0,
                        endColumn: 81,
                    },
                },
            ],
        });

        expect(
            linter.lint(
                `!+ PLATFORM(windows) NOT_PLATFORM(ext_ff) NOT_PLATFORM(mac) NOT_PLATFORM(android) PLATFORM(ext_edge)`
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "duplicated-hints",
                    severity: 1,
                    message: 'The hint "PLATFORM" is occurring more than once within the same comment rule',
                    position: {
                        startColumn: 0,
                        endColumn: 100,
                    },
                },
                {
                    rule: "duplicated-hints",
                    severity: 1,
                    message: 'The hint "NOT_PLATFORM" is occurring more than once within the same comment rule',
                    position: {
                        startColumn: 0,
                        endColumn: 100,
                    },
                },
            ],
        });

        expect(linter.lint(`!+ HINT HINT(aaa) HINT() HINT(aaa, bbb, ccc)`)).toMatchObject({
            problems: [
                {
                    rule: "duplicated-hints",
                    severity: 1,
                    message: 'The hint "HINT" is occurring more than once within the same comment rule',
                    position: {
                        startColumn: 0,
                        endColumn: 44,
                    },
                },
            ],
        });
    });
});
