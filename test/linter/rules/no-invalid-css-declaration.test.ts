import { beforeAll, describe, expect, test } from 'vitest';

import { Linter } from '../../../src/linter';
import { NEWLINE } from '../../../src/common/constants';
import { NoInvalidCssDeclaration } from '../../../src/linter/rules/no-invalid-css-declaration';

let linter: Linter;

describe('no-invalid-css-declaration', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('no-invalid-css-declaration', NoInvalidCssDeclaration);
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

                    // contain valid declaration
                    '#$#.foo { color: red; }',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
        });
    });

    test('should detect invalid CSS declarations', () => {
        expect(
            linter.lint(
                [
                    '#$#.foo { color: bar; }', // invalid color
                    '#$#.bar { background: url(foo.png) [foo]; }', // invalid background
                    '#$#.bar { foo: url(foo.png); }', // invalid property
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'no-invalid-css-declaration',
                    severity: 2,
                    message: "Invalid value for 'color' property, mismatch with syntax <color>",
                    position: {
                        startLine: 1,
                        startColumn: 17,
                        endLine: 1,
                        endColumn: 20,
                    },
                },
                {
                    rule: 'no-invalid-css-declaration',
                    severity: 2,
                    // eslint-disable-next-line max-len
                    message: "Invalid value for 'background' property, mismatch with syntax [ <bg-layer> , ]* <final-bg-layer>",
                    position: {
                        startLine: 2,
                        startColumn: 35,
                        endLine: 2,
                        endColumn: 40,
                    },
                },
                {
                    rule: 'no-invalid-css-declaration',
                    severity: 2,
                    message: 'Unknown property `foo`',
                    position: {
                        startLine: 3,
                        startColumn: 10,
                        endLine: 3,
                        endColumn: 27,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 3,
            fatalErrorCount: 0,
        });
    });
});
