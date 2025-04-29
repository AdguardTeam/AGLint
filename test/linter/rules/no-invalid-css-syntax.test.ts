import { beforeAll, describe, expect, test } from 'vitest';

import { Linter } from '../../../src/linter';
import { NEWLINE } from '../../../src/common/constants';
import { NoInvalidCssSyntax } from '../../../src/linter/rules/no-invalid-css-syntax';

let linter: Linter;

describe('no-invalid-css-syntax', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('no-invalid-css-syntax', NoInvalidCssSyntax);
    });

    test('should ignore non-problematic cases', () => {
        // if is closed properly
        expect(
            linter.lint(
                [
                    // not contain any CSS
                    'rule',
                    '!#if (condition1)',
                    'rule',
                    '!#endif',
                    'rule',

                    // contain valid CSS
                    '##.foo:has(.bar)',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
        });
    });

    test('support ABP syntax CSS injection', () => {
        expect(
            linter.lint(
                [
                    'example.com###banner {remove:true;}',
                    'example.com###banner {display:none!important;}',
                    'example.com###banner { background: pink !important; }',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
        });
    });

    test('should detect invalid CSS', () => {
        expect(
            linter.lint(
                [
                    '##.#foo', // class selector contains hash
                    '##.bar:has(', // unclosed pseudo-class
                    'example.com#$#body { padding 2px !important; }', // missing colon
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'no-invalid-css-syntax',
                    severity: 2,
                    message: 'Cannot parse CSS due to the following error: Identifier is expected',
                    position: {
                        startLine: 1,
                        startColumn: 3,
                        endLine: 1,
                        endColumn: 7,
                    },
                },
                {
                    rule: 'no-invalid-css-syntax',
                    severity: 2,
                    message: 'Cannot parse CSS due to the following error: ")" is expected',
                    position: {
                        startLine: 2,
                        startColumn: 11,
                        endLine: 2,
                        endColumn: 11,
                    },
                },
                {
                    rule: 'no-invalid-css-syntax',
                    severity: 2,
                    message: 'Cannot parse CSS due to the following error: Colon is expected',
                    position: {
                        startLine: 3,
                        startColumn: 29,
                        endLine: 3,
                        endColumn: 44,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 3,
            fatalErrorCount: 0,
        });
    });
});
