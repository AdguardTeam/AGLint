import { Linter } from '../../../src/linter';
import { IfClosed } from '../../../src/linter/rules/if-closed';
import { NEWLINE } from '../../../src/common/constants';

let linter: Linter;

describe('if-closed', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('if-closed', IfClosed);
    });

    test('should ignore non-problematic cases', () => {
        // if is closed properly
        expect(
            linter.lint(
                [
                    'rule',
                    '!#if (condition1)',
                    'rule',
                    '!#endif',
                    'rule',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
        });

        // both if-s are closed properly
        expect(
            linter.lint(
                [
                    'rule',
                    '!#if (condition1)',
                    '!#if (condition2)',
                    'rule',
                    '!#endif',
                    'rule',
                    '!#endif',
                    'rule',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // 'if' block with 'else' branch
        expect(
            linter.lint(
                [
                    'rule0',
                    '!#if (condition1)',
                    'rule1',
                    '!#else',
                    'rule2',
                    '!#endif',
                    'rule3',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
        });

        // 'include' directive inside 'if' block
        expect(
            linter.lint(
                [
                    'rule',
                    '!#if (condition1)',
                    '!#include https://raw.example.com/file1.txt',
                    '!#endif',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
        });
    });

    test('should detect unclosed if-s', () => {
        expect(
            linter.lint(
                [
                    'rule',
                    '!#if (condition1)',
                    '!#if (condition2)',
                    'rule',
                    '!#endif',
                    'rule',
                    'rule',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'if-closed',
                    severity: 2,
                    message: 'Unclosed "if" directive',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 17,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        });

        // unclosed 'if' block with 'else' branch
        expect(
            linter.lint(
                [
                    'rule0',
                    '!#if (condition1)',
                    'rule1',
                    '!#endif',
                    '!#if (condition2)',
                    'rule2',
                    '!#else',
                    'rule3',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'if-closed',
                    severity: 2,
                    message: 'Unclosed "if" directive',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 17,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        });
    });

    test('should detect unopened else directive', () => {
        expect(
            linter.lint(
                [
                    'rule1',
                    '!#else',
                    'rule2',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'if-closed',
                    severity: 2,
                    message: 'Using an "else" directive without an opening "if" directive',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 6,
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
                    '!#if (condition1)',
                    'rule1',
                    '!#endif',
                    '!#else',
                    'rule2',
                    '!#endif',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'if-closed',
                    severity: 2,
                    message: 'Using an "else" directive without an opening "if" directive',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 6,
                    },
                },
                {
                    rule: 'if-closed',
                    severity: 2,
                    message: 'Using an "endif" directive without an opening "if" directive',
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 7,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 2,
            fatalErrorCount: 0,
        });
    });

    test('should detect unopened endif-s', () => {
        expect(
            linter.lint(
                [
                    'rule',
                    '!#if (condition1)',
                    'rule',
                    '!#endif',
                    '!#endif',
                    'rule',
                    'rule',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'if-closed',
                    severity: 2,
                    message: 'Using an "endif" directive without an opening "if" directive',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 7,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        });
    });

    it('no value for else and endif directives', () => {
        expect(
            linter.lint(
                [
                    'rule0',
                    '!#if (condition1)',
                    'rule1',
                    '!#else (condition2)',
                    'rule2',
                    '!#endif (condition1)',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'if-closed',
                    severity: 2,
                    message: 'Invalid usage of preprocessor directive: "else"',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 19,
                    },
                },
                {
                    rule: 'if-closed',
                    severity: 2,
                    message: 'Invalid usage of preprocessor directive: "endif"',
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 20,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 2,
            fatalErrorCount: 0,
        });
    });
});
