import {
    describe,
    test,
    expect,
    beforeAll,
    it,
} from 'vitest';

import { Linter } from '../../../src/linter';
import { UnknownPreProcessorDirectives } from '../../../src/linter/rules/unknown-preprocessor-directives';

let linter: Linter;

describe('unknown-preprocessor-directives', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('unknown-preprocessor-directives', UnknownPreProcessorDirectives);
    });

    test('should ignore non-problematic cases', () => {
        expect(linter.lint('!#include https://example.org/path/includedfile.txt')).toMatchObject({ problems: [] });
        expect(linter.lint('!#if (conditions)')).toMatchObject({ problems: [] });
        expect(linter.lint('!#if (conditions_2)')).toMatchObject({ problems: [] });
        expect(linter.lint('!#else')).toMatchObject({ problems: [] });
        expect(linter.lint('!#endif')).toMatchObject({ problems: [] });
        expect(linter.lint('!#safari_cb_affinity')).toMatchObject({ problems: [] });
        expect(linter.lint('!#safari_cb_affinity()')).toMatchObject({ problems: [] });
        expect(linter.lint('!#safari_cb_affinity(params)')).toMatchObject({ problems: [] });
        expect(linter.lint('!#safari_cb_affinity(general,privacy)')).toMatchObject({ problems: [] });
    });

    it('should detect problematic cases', () => {
        expect(linter.lint('!#incl2ude https://example.org/path/includedfile.txt')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-preprocessor-directives',
                    severity: 2,
                    message: 'Unknown preprocessor directive "incl2ude"',
                    position: {
                        startColumn: 2,
                        endColumn: 10,
                    },
                },
            ],
        });

        expect(linter.lint('!#IF (conditions)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-preprocessor-directives',
                    severity: 2,
                    message: 'Unknown preprocessor directive "IF"',
                    position: {
                        startColumn: 2,
                        endColumn: 4,
                    },
                },
            ],
        });

        expect(linter.lint('!#if2 (conditions_2)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-preprocessor-directives',
                    severity: 2,
                    message: 'Unknown preprocessor directive "if2"',
                    position: {
                        startColumn: 2,
                        endColumn: 5,
                    },
                },
            ],
        });

        expect(linter.lint('!#end-if')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-preprocessor-directives',
                    severity: 2,
                    message: 'Unknown preprocessor directive "end-if"',
                    position: {
                        startColumn: 2,
                        endColumn: 8,
                    },
                },
            ],
        });

        expect(linter.lint('!#something')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-preprocessor-directives',
                    severity: 2,
                    message: 'Unknown preprocessor directive "something"',
                    position: {
                        startColumn: 2,
                        endColumn: 11,
                    },
                },
            ],
        });

        expect(linter.lint('!#something')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-preprocessor-directives',
                    severity: 2,
                    message: 'Unknown preprocessor directive "something"',
                    position: {
                        startColumn: 2,
                        endColumn: 11,
                    },
                },
            ],
        });
    });
});
