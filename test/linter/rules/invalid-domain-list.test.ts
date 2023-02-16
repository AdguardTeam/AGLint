import { Linter } from "../../../src/linter";
import { InvalidDomainList } from "../../../src/linter/rules/invalid-domain-list";
import { NEWLINE } from "../../../src/utils/constants";

describe("invalid-domain-list", () => {
    test("Detects invalid domains", () => {
        const linter = new Linter(false);

        linter.addRule("invalid-domain-list", InvalidDomainList);

        expect(
            linter.lint(
                [
                    // No domain at all
                    `##.banner`,

                    // Wildcard-only
                    `*##.banner`,

                    `example.com##.banner`,
                    `example.*##.banner`,
                    `*.example.com##.banner`,
                    `*.example.*##.banner`,
                    `127.0.0.1##.banner`,

                    `~example.com##.banner`,
                    `~example.*##.banner`,
                    `~*.example.com##.banner`,
                    `~*.example.*##.banner`,
                    `~127.0.0.1##.banner`,

                    // Mixed
                    // eslint-disable-next-line max-len
                    `example.com,~example.com,example.*,~example.*,*.example.com,~*.example.com,*.example.*,~*.example.*,127.0.0.1,~127.0.0.1##.banner`,
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
                    // Missed TLD
                    `example.##.banner`,

                    // Dot only
                    `.##.banner`,
                    `...##.banner`,

                    // Invalid characters
                    `AA BB##.banner`,
                    `AA BB CC##.banner`,
                    `a^b##.banner`,
                ].join(NEWLINE)
            )
        ).toMatchObject({
            problems: [
                {
                    rule: "invalid-domain-list",
                    severity: 2,
                    message: 'Invalid domain "example."',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 17,
                    },
                },
                {
                    rule: "invalid-domain-list",
                    severity: 2,
                    message: 'Invalid domain "."',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 10,
                    },
                },
                {
                    rule: "invalid-domain-list",
                    severity: 2,
                    message: 'Invalid domain "..."',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 12,
                    },
                },
                {
                    rule: "invalid-domain-list",
                    severity: 2,
                    message: 'Invalid domain "AA BB"',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 14,
                    },
                },
                {
                    rule: "invalid-domain-list",
                    severity: 2,
                    message: 'Invalid domain "AA BB CC"',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 17,
                    },
                },
                {
                    rule: "invalid-domain-list",
                    severity: 2,
                    message: 'Invalid domain "a^b"',
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 12,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 6,
            fatalErrorCount: 0,
        });
    });
});
