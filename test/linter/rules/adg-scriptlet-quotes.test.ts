/* eslint-disable max-len */
import { Linter } from "../../../src/linter";
import { AdgScriptletQuotes } from "../../../src/linter/rules/adg-scriptlet-quotes";
import { NEWLINE } from "../../../src/utils/constants";

describe("adg-scriptlet-quotes", () => {
    test("detects problematic scriptlets", () => {
        const linter = new Linter(false);

        linter.addRule("adg-scriptlet-quotes", AdgScriptletQuotes);

        // No problematic scriptlets
        expect(
            linter.lint(
                [
                    `example.com##.ad1`,
                    `example.com##.ad2`,
                    `example.com#%#//scriptlet('scriptlet0')`,
                    `example.com#%#//scriptlet('scriptlet0', 'arg0', /arg1/)`,
                    `example.com#@%#//scriptlet('scriptlet0')`,
                    `example.com#@%#//scriptlet('scriptlet0', 'arg0', /arg1/)`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Ignore "aa'aa" because it contains a single quote
        expect(
            linter.lint([`example.com#@%#//scriptlet('scriptlet0', 'arg0', /arg1/, "aa'aa")`].join(NEWLINE))
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Problematic scriptlets
        expect(
            linter.lint(
                [
                    `example.com##.ad1`,
                    `example.com##.ad2`,
                    `example.com#%#//scriptlet('scriptlet0')`,
                    `example.com#%#//scriptlet('scriptlet0', 'arg0', /arg1/)`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet("scriptlet0")`,
                    `example.com#@%#//scriptlet('scriptlet0', 'arg0', /arg1/)`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "adg-scriptlet-quotes",
                    severity: 1,
                    message: "Single quoted AdGuard scriptlet parameters are preferred",
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 40,
                    },
                },
            ],
            warningCount: 1,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        expect(
            linter.lint(
                [
                    `example.com##.ad1`,
                    `example.com##.ad2`,
                    `example.com#%#//scriptlet('scriptlet0')`,
                    `example.com#%#//scriptlet('scriptlet0', 'arg0', /arg1/)`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet("scriptlet0")`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet("scriptlet0", 'arg0', /arg1/)`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet('scriptlet0', "arg0", /arg1/)`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "adg-scriptlet-quotes",
                    severity: 1,
                    message: "Single quoted AdGuard scriptlet parameters are preferred",
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 40,
                    },
                },
                {
                    rule: "adg-scriptlet-quotes",
                    severity: 1,
                    message: "Single quoted AdGuard scriptlet parameters are preferred",
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 56,
                    },
                },
                {
                    rule: "adg-scriptlet-quotes",
                    severity: 1,
                    message: "Single quoted AdGuard scriptlet parameters are preferred",
                    position: {
                        startLine: 7,
                        startColumn: 0,
                        endLine: 7,
                        endColumn: 56,
                    },
                },
            ],
            warningCount: 3,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });

    test("detects problematic scriptlets with custom config", () => {
        const linter = new Linter(false);

        linter.addRule("adg-scriptlet-quotes", AdgScriptletQuotes);

        // Prefer DoubleQuoted quotes
        linter.setRuleConfig("adg-scriptlet-quotes", ["warn", "double"]);

        // No problematic scriptlets
        expect(
            linter.lint(
                [
                    `example.com##.ad1`,
                    `example.com##.ad2`,
                    `example.com#%#//scriptlet("scriptlet0")`,
                    `example.com#%#//scriptlet("scriptlet0", "arg0", /arg1/)`,
                    `example.com#@%#//scriptlet("scriptlet0")`,
                    `example.com#@%#//scriptlet("scriptlet0", "arg0", /arg1/)`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Problematic scriptlets
        expect(
            linter.lint(
                [
                    `example.com##.ad1`,
                    `example.com##.ad2`,
                    `example.com#%#//scriptlet("scriptlet0")`,
                    `example.com#%#//scriptlet("scriptlet0", "arg0", /arg1/)`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet('scriptlet0')`,
                    `example.com#@%#//scriptlet("scriptlet0", "arg0", /arg1/)`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "adg-scriptlet-quotes",
                    severity: 1,
                    message: "Double quoted AdGuard scriptlet parameters are preferred",
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 40,
                    },
                },
            ],
            warningCount: 1,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        expect(
            linter.lint(
                [
                    `example.com##.ad1`,
                    `example.com##.ad2`,
                    `example.com#%#//scriptlet("scriptlet0")`,
                    `example.com#%#//scriptlet("scriptlet0", "arg0", /arg1/)`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet('scriptlet0')`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet('scriptlet0', "arg0", /arg1/)`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet("scriptlet0", 'arg0', /arg1/)`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "adg-scriptlet-quotes",
                    severity: 1,
                    message: "Double quoted AdGuard scriptlet parameters are preferred",
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 40,
                    },
                },
                {
                    rule: "adg-scriptlet-quotes",
                    severity: 1,
                    message: "Double quoted AdGuard scriptlet parameters are preferred",
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 56,
                    },
                },
                {
                    rule: "adg-scriptlet-quotes",
                    severity: 1,
                    message: "Double quoted AdGuard scriptlet parameters are preferred",
                    position: {
                        startLine: 7,
                        startColumn: 0,
                        endLine: 7,
                        endColumn: 56,
                    },
                },
            ],
            warningCount: 3,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });

    test("suggest fix with default config", () => {
        const linter = new Linter(false);

        linter.addRule("adg-scriptlet-quotes", AdgScriptletQuotes);

        expect(
            linter.lint(
                [
                    `example.com##.ad1`,
                    `example.com##.ad2`,
                    `example.com#%#//scriptlet('scriptlet0')`,
                    `example.com#%#//scriptlet('scriptlet0', 'arg0', /arg1/)`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet("scriptlet0")`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet("scriptlet0", 'arg0', /arg1/)`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet('scriptlet0', "arg0", /arg1/)`,
                    // Problematic scriptlet
                    `#%#//scriptlet("prevent-setTimeout", ".css('display','block');")`,
                ].join(NEWLINE),
                true
            )
        ).toMatchObject({
            fixed: [
                `example.com##.ad1`,
                `example.com##.ad2`,
                `example.com#%#//scriptlet('scriptlet0')`,
                `example.com#%#//scriptlet('scriptlet0', 'arg0', /arg1/)`,
                // Problematic scriptlet
                `example.com#@%#//scriptlet('scriptlet0')`,
                // Problematic scriptlet
                `example.com#@%#//scriptlet('scriptlet0', 'arg0', /arg1/)`,
                // Problematic scriptlet
                `example.com#@%#//scriptlet('scriptlet0', 'arg0', /arg1/)`,
                // Problematic scriptlet
                `#%#//scriptlet('prevent-setTimeout', ".css('display','block');")`,
            ].join(NEWLINE),
        });
    });

    test("suggest fix with double quotes config", () => {
        const linter = new Linter(false);

        linter.addRule("adg-scriptlet-quotes", AdgScriptletQuotes);

        // Prefer DoubleQuoted quotes
        linter.setRuleConfig("adg-scriptlet-quotes", ["warn", "double"]);

        expect(
            linter.lint(
                [
                    `example.com##.ad1`,
                    `example.com##.ad2`,
                    `example.com#%#//scriptlet("scriptlet0")`,
                    `example.com#%#//scriptlet("scriptlet0", "arg0", /arg1/)`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet('scriptlet0')`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet('scriptlet0', "arg0", /arg1/)`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet("scriptlet0", 'arg0', /arg1/)`,
                ].join(NEWLINE),
                true
            )
        ).toMatchObject({
            fixed: [
                `example.com##.ad1`,
                `example.com##.ad2`,
                `example.com#%#//scriptlet("scriptlet0")`,
                `example.com#%#//scriptlet("scriptlet0", "arg0", /arg1/)`,
                // Problematic scriptlet
                `example.com#@%#//scriptlet("scriptlet0")`,
                // Problematic scriptlet
                `example.com#@%#//scriptlet("scriptlet0", "arg0", /arg1/)`,
                // Problematic scriptlet
                `example.com#@%#//scriptlet("scriptlet0", "arg0", /arg1/)`,
            ].join(NEWLINE),
        });
    });

    test("suggest fix with no-quotes config", () => {
        const linter = new Linter(false);

        linter.addRule("adg-scriptlet-quotes", AdgScriptletQuotes);

        // Prefer DoubleQuoted quotes
        linter.setRuleConfig("adg-scriptlet-quotes", ["warn", "none"]);

        expect(
            linter.lint(
                [
                    `example.com##.ad1`,
                    `example.com##.ad2`,
                    `example.com#%#//scriptlet("scriptlet0")`,
                    `example.com#%#//scriptlet("scriptlet0", "arg0", /arg1/)`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet('scriptlet0')`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet('scriptlet0', "arg0", /arg1/)`,
                    // Problematic scriptlet
                    `example.com#@%#//scriptlet("scriptlet0", 'arg0', /arg1/)`,
                ].join(NEWLINE),
                true
            )
        ).toMatchObject({
            fixed: [
                `example.com##.ad1`,
                `example.com##.ad2`,
                `example.com#%#//scriptlet(scriptlet0)`,
                `example.com#%#//scriptlet(scriptlet0, arg0, /arg1/)`,
                // Problematic scriptlet
                `example.com#@%#//scriptlet(scriptlet0)`,
                // Problematic scriptlet
                `example.com#@%#//scriptlet(scriptlet0, arg0, /arg1/)`,
                // Problematic scriptlet
                `example.com#@%#//scriptlet(scriptlet0, arg0, /arg1/)`,
            ].join(NEWLINE),
        });
    });
});
