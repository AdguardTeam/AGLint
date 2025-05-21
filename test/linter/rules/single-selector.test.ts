import {
    describe,
    test,
    expect,
    beforeAll,
    it,
} from 'vitest';

import { Linter } from '../../../src/linter';
import { SingleSelector } from '../../../src/linter/rules/single-selector';
import { NEWLINE } from '../../../src/common/constants';

let linter: Linter;

describe('single-selector', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('single-selector', SingleSelector);
    });

    test('should ignore non-problematic cases', () => {
        expect(
            linter.lint(
                [
                    'example.com##.ad1',
                    'example.com##.ad2',
                    'example.com##.ad3',
                    'example.com##.ad4',
                    'example.com##.ad5',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });

    it('should detect problematic cases', () => {
        expect(
            linter.lint(
                [
                    'example.com##.ad1',
                    'example.com##.ad2,.ad3', // multiple selectors
                    'example.com##.ad4',
                    'example.com##.ad5, .ad6,.ad7', //  multiple selectors
                    'example.com##.ad8',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'single-selector',
                    severity: 1,
                    message: 'An element hiding rule should contain only one selector',
                    position: {
                        startLine: 2,
                        startColumn: 13,
                        endLine: 2,
                        endColumn: 22,
                    },
                },
                {
                    rule: 'single-selector',
                    severity: 1,
                    message: 'An element hiding rule should contain only one selector',
                    position: {
                        startLine: 4,
                        startColumn: 13,
                        endLine: 4,
                        endColumn: 28,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });

    test('should fix problematic cases', () => {
        // No multiple selectors
        expect(
            linter.lint(
                [
                    'example.com##.ad1',
                    'example.com##.ad2',
                    'example.com##.ad3',
                    'example.com##.ad4',
                    'example.com##.ad5',
                ].join(NEWLINE),
                true,
            ),
        ).toMatchObject({
            fixed: [
                'example.com##.ad1',
                'example.com##.ad2',
                'example.com##.ad3',
                'example.com##.ad4',
                'example.com##.ad5',
            ].join(NEWLINE),
        });

        // Multiple selectors
        expect(
            linter.lint(
                [
                    'example.com##.ad1',
                    'example.com##.ad2,.ad3', // multiple selectors
                    'example.com##.ad4',
                    'example.com##.ad5, .ad6,.ad7', //  multiple selectors
                    'example.com##.ad8',
                ].join(NEWLINE),
                true,
            ),
        ).toMatchObject({
            fixed: [
                'example.com##.ad1',
                'example.com##.ad2',
                'example.com##.ad3',
                'example.com##.ad4',
                'example.com##.ad5',
                'example.com##.ad6',
                'example.com##.ad7',
                'example.com##.ad8',
            ].join(NEWLINE),
        });
    });
});
