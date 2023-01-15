/* eslint-disable max-len */
import { Linter } from "../../src/linter";
import { SEVERITY } from "../../src/linter/severity";
import { NEWLINE } from "../../src/utils/constants";

describe("Linter", () => {
    test("lint detect parsing issues as fatal errors", () => {
        const linter = new Linter();

        // 1 invalid rule
        expect(
            linter.lint(
                [
                    "[uBlock Origin]",
                    "example.org##.ad",
                    "@@||example.org^$generichide",
                    "example.com##+js(aopr, test)",
                    "example.com##+js(aopr, test", // Missing closing bracket
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    severity: SEVERITY.fatal,
                    message:
                        'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no closing parentheses ")" at call: "(aopr, test"',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 27,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 1,
        });

        // Many invalid rules
        expect(
            linter.lint(
                [
                    "[AdGuard; uBlock Origin]",
                    "example.org##.ad",
                    "@@||example.org^$generichide",
                    "example.com##+js(aopr, test)", // Missing closing bracket
                    "example.com##+js(aopr, test", // Missing opening bracket
                    "example.com##+js...",
                    "example.com#$#body { padding 2px !important; }", // Invalid CSS rule (missing : after padding)
                    "! comment",
                    "||example.net^$third-party",
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    severity: SEVERITY.fatal,
                    message:
                        'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no closing parentheses ")" at call: "(aopr, test"',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 27,
                    },
                },
                {
                    severity: SEVERITY.fatal,
                    message:
                        'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no opening parentheses "(" at call: "..."',
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 19,
                    },
                },
                {
                    severity: SEVERITY.fatal,
                    position: {
                        startLine: 7,
                        startColumn: 0,
                        endLine: 7,
                        endColumn: 46,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 3,
        });
    });

    test("Config comments ignored if they aren't allowed in the linter config", () => {
        const linter = new Linter({
            allowInlineConfig: false,
        });

        // Invalid rule found
        expect(
            linter.lint(
                [
                    "[uBlock Origin]",
                    "example.org##.ad",
                    "@@||example.org^$generichide",
                    "example.com##+js(aopr, test)",
                    "! aglint-disable-next-line",
                    "example.com##+js(aopr, test", // Missing closing bracket
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    severity: SEVERITY.fatal,
                    message:
                        'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no closing parentheses ")" at call: "(aopr, test"',
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 27,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 1,
        });

        expect(
            linter.lint(
                [
                    "[uBlock Origin]",
                    "example.org##.ad",
                    "@@||example.org^$generichide",
                    "example.com##+js(aopr, test)",
                    "! aglint-disable",
                    "example.com##+js(aopr, test", // Missing closing bracket
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    severity: SEVERITY.fatal,
                    message:
                        'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no closing parentheses ")" at call: "(aopr, test"',
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 27,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 1,
        });
    });

    test("Config comments", () => {
        const linter = new Linter();

        // Don't report invalid rule if it preceded by aglint-disable-next-line
        expect(
            linter.lint(
                [
                    "[uBlock Origin]",
                    "example.org##.ad",
                    "@@||example.org^$generichide",
                    "example.com##+js(aopr, test)",
                    "! aglint-disable-next-line",
                    "example.com##+js(aopr, test", // Missing closing bracket
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Don't report invalid rule if it preceded by aglint-disable
        expect(
            linter.lint(
                [
                    "[uBlock Origin]",
                    "example.org##.ad",
                    "@@||example.org^$generichide",
                    "example.com##+js(aopr, test)",
                    "! aglint-disable",
                    "example.com##+js(aopr, test", // Missing closing bracket
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        expect(
            linter.lint(
                [
                    "[uBlock Origin]",
                    "example.org##.ad",
                    "@@||example.org^$generichide",
                    "example.com##+js(aopr, test)",
                    "! aglint-disable",
                    "example.com##+js(aopr, test", // Missing closing bracket
                    "! aglint-enable",
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // If another rules isn't preceded by aglint-disable-next-line, report it
        expect(
            linter.lint(
                [
                    "[uBlock Origin]",
                    "example.org##.ad",
                    "@@||example.org^$generichide",
                    "example.com##+js(aopr, test)",
                    "! aglint-disable-next-line",
                    "example.com##+js(aopr, test", // Missing closing bracket (should be skipped)
                    "example.net##+js(aopr, test", // Missing closing bracket (should be reported)
                    "example.org##+js(aopr, test", // Missing closing bracket (should be reported)
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    severity: SEVERITY.fatal,
                    message:
                        'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no closing parentheses ")" at call: "(aopr, test"',
                    position: {
                        startLine: 7,
                        startColumn: 0,
                        endLine: 7,
                        endColumn: 27,
                    },
                },
                {
                    severity: SEVERITY.fatal,
                    message:
                        'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no closing parentheses ")" at call: "(aopr, test"',
                    position: {
                        startLine: 8,
                        startColumn: 0,
                        endLine: 8,
                        endColumn: 27,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 2,
        });

        // Disable rule block with aglint-disable
        expect(
            linter.lint(
                [
                    "[uBlock Origin]",
                    "example.org##.ad",
                    "@@||example.org^$generichide",
                    "example.com##+js(aopr, test)",
                    "! aglint-disable",
                    "example.com##+js(aopr, test", // Missing closing bracket (should be skipped)
                    "example.net##+js(aopr, test", // Missing closing bracket (should be skipped)
                    "example.org##+js(aopr, test", // Missing closing bracket (should be skipped)
                    "! aglint-enable",
                    "example.hu##+js(aopr, test", // Missing closing bracket (should be reported)
                    "example.sk##+js(aopr, test", // Missing closing bracket (should be reported)
                    "! aglint-disable",
                    "example.com##+js(aopr, test", // Missing closing bracket (should be skipped)
                    "example.net##+js(aopr, test", // Missing closing bracket (should be skipped)
                    "example.org##+js(aopr, test", // Missing closing bracket (should be skipped)
                    "! aglint-enable",
                    "example.hu##+js(aopr, test", // Missing closing bracket (should be reported)
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    severity: SEVERITY.fatal,
                    message:
                        'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no closing parentheses ")" at call: "(aopr, test"',
                    position: {
                        startLine: 10,
                        startColumn: 0,
                        endLine: 10,
                        endColumn: 26,
                    },
                },
                {
                    severity: SEVERITY.fatal,
                    message:
                        'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no closing parentheses ")" at call: "(aopr, test"',
                    position: {
                        startLine: 11,
                        startColumn: 0,
                        endLine: 11,
                        endColumn: 26,
                    },
                },
                {
                    severity: SEVERITY.fatal,
                    message:
                        'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no closing parentheses ")" at call: "(aopr, test"',
                    position: {
                        startLine: 17,
                        startColumn: 0,
                        endLine: 17,
                        endColumn: 26,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 3,
        });

        // Disable rule block with aglint-disable and enable single rule with aglint-enable-next-line
        expect(
            linter.lint(
                [
                    "example.org##.ad",
                    "@@||example.org^$generichide",
                    "example.com##+js(aopr, test)",
                    "! aglint-disable",
                    "example.com##+js(aopr, test", // Missing closing bracket (should be skipped)
                    "! aglint-enable-next-line",
                    "example.net##+js(aopr, test", // Missing closing bracket (should be reported)
                    "example.org##+js(aopr, test", // Missing closing bracket (should be skipped)
                    "! aglint-enable",
                    "example.biz##+js(aopr, test", // Missing closing bracket (should be reported)
                    "example.com##+js(aopr, test", // Missing closing bracket (should be reported)
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    severity: SEVERITY.fatal,
                    message:
                        'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no closing parentheses ")" at call: "(aopr, test"',
                    position: {
                        startLine: 7,
                        startColumn: 0,
                        endLine: 7,
                        endColumn: 27,
                    },
                },
                {
                    severity: SEVERITY.fatal,
                    message:
                        'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no closing parentheses ")" at call: "(aopr, test"',
                    position: {
                        startLine: 10,
                        startColumn: 0,
                        endLine: 10,
                        endColumn: 27,
                    },
                },
                {
                    severity: SEVERITY.fatal,
                    message:
                        'AGLint parsing error: Invalid uBlock/AdGuard scriptlet call, no closing parentheses ")" at call: "(aopr, test"',
                    position: {
                        startLine: 11,
                        startColumn: 0,
                        endLine: 11,
                        endColumn: 27,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 3,
        });
    });
});
