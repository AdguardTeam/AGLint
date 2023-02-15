import { Linter } from "../../../src/linter";
import { DuplicatedModifiers } from "../../../src/linter/rules/duplicated-modifiers";
import { NEWLINE } from "../../../src/utils/constants";

describe("duplicated-modifiers", () => {
    test("Detects duplicated modifiers", () => {
        const linter = new Linter(false);

        linter.addRule("duplicated-modifiers", DuplicatedModifiers);

        // No multiple selectors
        expect(linter.lint(["example.com##.ad", "||example.com^$script,third-party"].join(NEWLINE))).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        expect(
            linter.lint(["example.com##.ad", "||example.com^$script,third-party,script,script,script"].join(NEWLINE))
        ).toMatchObject({
            problems: [
                {
                    rule: "duplicated-modifiers",
                    severity: 2,
                    message: 'The modifier "script" is used multiple times, but it should be used only once',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 54,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        });

        expect(
            linter.lint(
                [
                    "example.com##.ad",
                    "||example.com^$script,third-party,script,script,script,third-party,script,domain=example.net",
                    "ads.js$script,domain=example.com,domain=example.net",
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "duplicated-modifiers",
                    severity: 2,
                    message: 'The modifier "script" is used multiple times, but it should be used only once',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 92,
                    },
                },
                {
                    rule: "duplicated-modifiers",
                    severity: 2,
                    message: 'The modifier "third-party" is used multiple times, but it should be used only once',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 92,
                    },
                },
                {
                    rule: "duplicated-modifiers",
                    severity: 2,
                    message: 'The modifier "domain" is used multiple times, but it should be used only once',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 51,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 3,
            fatalErrorCount: 0,
        });
    });
});
