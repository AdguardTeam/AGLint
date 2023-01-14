/* eslint-disable max-len */
import { Linter } from "../../../src/linter";
import { AdgScriptletQuotes } from "../../../src/linter/rules/adg-scriptlet-quotes";
import { NEWLINE } from "../../../src/utils/constants";

describe("adg-scriptlet-quotes", () => {
    test("Detects problematic scriptlets", () => {
        const linter = new Linter();

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
                    message: "The scriptlet should use SingleQuoted quotes",
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
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "adg-scriptlet-quotes",
                    severity: 1,
                    message: "The scriptlet should use SingleQuoted quotes",
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
                    message: "The scriptlet should use SingleQuoted quotes",
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 56,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });

    test("Detects problematic scriptlets with custom config", () => {
        const linter = new Linter();

        // Prefer DoubleQuoted quotes
        linter.addRuleEx("adg-scriptlet-quotes", {
            rule: AdgScriptletQuotes,
            storage: {},
            configOverride: "DoubleQuoted",
        });

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
                    message: "The scriptlet should use DoubleQuoted quotes",
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
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "adg-scriptlet-quotes",
                    severity: 1,
                    message: "The scriptlet should use DoubleQuoted quotes",
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
                    message: "The scriptlet should use DoubleQuoted quotes",
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 56,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });

    test("Suggest fix", () => {
        const linter = new Linter();

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
            ].join(NEWLINE),
        });
    });

    test("Suggest fix with custom config", () => {
        const linter = new Linter();

        // Prefer DoubleQuoted quotes
        linter.addRuleEx("adg-scriptlet-quotes", {
            rule: AdgScriptletQuotes,
            storage: {},
            configOverride: "DoubleQuoted",
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
            ].join(NEWLINE),
        });
    });
});
