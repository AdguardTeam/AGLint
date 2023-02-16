import { Linter } from "../../../src/linter";
import { InvalidModifierName } from "../../../src/linter/rules/invalid-modifier-name";
import { NEWLINE } from "../../../src/utils/constants";

describe("invalid-modifier-name", () => {
    test("Detects invalid modifier names", () => {
        const linter = new Linter(false);

        linter.addRule("invalid-modifier-name", InvalidModifierName);

        expect(
            linter.lint(
                [
                    "example.com##.ad",
                    "||example.net/ads.js",
                    "/something/$important,1p",
                    "||example.com^$script,third-party",
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
                    "example.com##.ad",
                    "||example.net/ads.js",
                    "/something/$important,IMPORTANT,-a,b-,-,--",
                    "||example.com^$script,third_party,$script,something--2",
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "invalid-modifier-name",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Name of the modifier "IMPORTANT" has invalid format',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 42,
                    },
                },
                {
                    rule: "invalid-modifier-name",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Name of the modifier "-a" has invalid format',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 42,
                    },
                },
                {
                    rule: "invalid-modifier-name",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Name of the modifier "b-" has invalid format',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 42,
                    },
                },
                {
                    rule: "invalid-modifier-name",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Name of the modifier "-" has invalid format',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 42,
                    },
                },
                {
                    rule: "invalid-modifier-name",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Name of the modifier "--" has invalid format',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 42,
                    },
                },
                {
                    rule: "invalid-modifier-name",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Name of the modifier "third_party" has invalid format',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 54,
                    },
                },
                {
                    rule: "invalid-modifier-name",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Name of the modifier "$script" has invalid format',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 54,
                    },
                },
                {
                    rule: "invalid-modifier-name",
                    severity: 2,
                    message:
                        // eslint-disable-next-line max-len
                        'Name of the modifier "something--2" has invalid format',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 54,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 8,
            fatalErrorCount: 0,
        });
    });
});
