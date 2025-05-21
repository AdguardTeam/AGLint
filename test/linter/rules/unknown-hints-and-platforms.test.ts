import {
    describe,
    test,
    expect,
    beforeAll,
    it,
} from 'vitest';

import { Linter } from '../../../src/linter';
import { UnknownHintsAndPlatforms } from '../../../src/linter/rules/unknown-hints-and-platforms';

let linter: Linter;

describe('unknown-hints-and-platforms', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('unknown-hints-and-platforms', UnknownHintsAndPlatforms);
    });

    test('should ignore non-problematic cases', () => {
        // NOT_OPTIMIZED
        expect(linter.lint('!+ NOT_OPTIMIZED')).toMatchObject({ problems: [] });

        // NOT_VALIDATE
        expect(linter.lint('!+ NOT_VALIDATE')).toMatchObject({ problems: [] });

        // PLATFORM single
        expect(linter.lint('!+ PLATFORM(windows)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ PLATFORM(mac)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ PLATFORM(cli)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ PLATFORM(android)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ PLATFORM(ios)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ PLATFORM(ext_chromium_mv3)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ PLATFORM(ext_chromium)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ PLATFORM(ext_ff)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ PLATFORM(ext_edge)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ PLATFORM(ext_opera)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ PLATFORM(ext_safari)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ PLATFORM(ext_android_cb)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ PLATFORM(ext_ublock)')).toMatchObject({ problems: [] });

        // PLATFORM mixed
        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                '!+ PLATFORM(windows, mac, cli, android, ios, ext_chromium_mv3, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)',
            ),
        ).toMatchObject({ problems: [] });

        // NOT_PLATFORM single
        expect(linter.lint('!+ NOT_PLATFORM(windows)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ NOT_PLATFORM(mac)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ NOT_PLATFORM(cli)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ NOT_PLATFORM(android)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ NOT_PLATFORM(ios)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ NOT_PLATFORM(ext_chromium_mv3)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ NOT_PLATFORM(ext_chromium)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ NOT_PLATFORM(ext_ff)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ NOT_PLATFORM(ext_edge)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ NOT_PLATFORM(ext_opera)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ NOT_PLATFORM(ext_safari)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ NOT_PLATFORM(ext_android_cb)')).toMatchObject({ problems: [] });
        expect(linter.lint('!+ NOT_PLATFORM(ext_ublock)')).toMatchObject({ problems: [] });

        // NOT_PLATFORM mixed
        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                '!+ NOT_PLATFORM(windows, mac, cli, android, ios, ext_chromium_mv3, ext_chromium, ext_ff, ext_edge, ext_opera, ext_safari, ext_android_cb, ext_ublock)',
            ),
        ).toMatchObject({ problems: [] });
    });

    it('should detect problematic cases', () => {
        // syntax error
        expect(linter.lint('!+ NOT_OPTIMIZED(')).toMatchObject({
            problems: [
                {
                    severity: 3,
                    // eslint-disable-next-line max-len
                    message: 'Cannot parse adblock rule due to the following error: Missing closing parenthesis for hint "NOT_OPTIMIZED"',
                    position: {
                        startColumn: 3,
                        endColumn: 17,
                    },
                },
            ],
        });

        // NOT_OPTIMIZED should not have parameters
        expect(linter.lint('!+ NOT_OPTIMIZED()')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Hint "NOT_OPTIMIZED" must not have any parameters',
                    position: {
                        startColumn: 3,
                        endColumn: 18,
                    },
                },
            ],
        });

        // NOT_OPTIMIZED should not have parameters
        expect(linter.lint('!+ NOT_OPTIMIZED(aa)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Hint "NOT_OPTIMIZED" must not have any parameters',
                    position: {
                        startColumn: 3,
                        endColumn: 20,
                    },
                },
            ],
        });

        // NOT_OPTIMIZED should not have parameters
        expect(linter.lint('!+ NOT_OPTIMIZED(aa, bb)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Hint "NOT_OPTIMIZED" must not have any parameters',
                    position: {
                        startColumn: 3,
                        endColumn: 24,
                    },
                },
            ],
        });

        // Hint name is case-sensitive
        expect(linter.lint('!+ not_optimized')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown hint name "not_optimized"',
                    position: {
                        startColumn: 3,
                        endColumn: 16,
                    },
                },
            ],
        });

        // syntax error
        expect(linter.lint('!+ NOT_VALIDATE(')).toMatchObject({
            problems: [
                {
                    severity: 3,
                    // eslint-disable-next-line max-len
                    message: 'Cannot parse adblock rule due to the following error: Missing closing parenthesis for hint "NOT_VALIDATE"',
                    position: {
                        startColumn: 3,
                        endColumn: 16,
                    },
                },
            ],
        });

        // NOT_VALIDATE should not have parameters
        expect(linter.lint('!+ NOT_VALIDATE()')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Hint "NOT_VALIDATE" must not have any parameters',
                    position: {
                        startColumn: 3,
                        endColumn: 17,
                    },
                },
            ],
        });

        // NOT_VALIDATE should not have parameters
        expect(linter.lint('!+ NOT_VALIDATE(aa)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Hint "NOT_VALIDATE" must not have any parameters',
                    position: {
                        startColumn: 3,
                        endColumn: 19,
                    },
                },
            ],
        });

        // NOT_VALIDATE should not have parameters
        expect(linter.lint('!+ NOT_VALIDATE(aa, bb)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Hint "NOT_VALIDATE" must not have any parameters',
                    position: {
                        startColumn: 3,
                        endColumn: 23,
                    },
                },
            ],
        });

        // Hint name is case-sensitive
        expect(linter.lint('!+ not_validate')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown hint name "not_validate"',
                    position: {
                        startColumn: 3,
                        endColumn: 15,
                    },
                },
            ],
        });

        // Syntax error
        expect(linter.lint('!+ PLATFORM(')).toMatchObject({
            problems: [
                {
                    severity: 3,
                    // eslint-disable-next-line max-len
                    message: 'Cannot parse adblock rule due to the following error: Missing closing parenthesis for hint "PLATFORM"',
                    position: {
                        startColumn: 3,
                        endColumn: 12,
                    },
                },
            ],
        });

        // PLATFORM should have valid parameters
        expect(linter.lint('!+ PLATFORM()')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Hint "PLATFORM" must have at least one platform specified',
                    position: {
                        startColumn: 3,
                        endColumn: 13,
                    },
                },
            ],
        });

        // PLATFORM should have valid parameters
        expect(linter.lint('!+ PLATFORM(aa)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown platform "aa" in hint "PLATFORM"',
                    position: {
                        startColumn: 12,
                        endColumn: 14,
                    },
                },
            ],
        });

        // PLATFORM should have valid parameters
        expect(linter.lint('!+ PLATFORM(aa, bb)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown platform "aa" in hint "PLATFORM"',
                    position: {
                        startColumn: 12,
                        endColumn: 14,
                    },
                },
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown platform "bb" in hint "PLATFORM"',
                    position: {
                        startColumn: 16,
                        endColumn: 18,
                    },
                },
            ],
        });

        // Platform name is case-sensitive, even if it has a valid parameter
        expect(linter.lint('!+ platform(windows)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown hint name "platform"',
                    position: {
                        startColumn: 3,
                        endColumn: 11,
                    },
                },
            ],
        });

        // Syntax error
        expect(linter.lint('!+ NOT_PLATFORM(')).toMatchObject({
            problems: [
                {
                    severity: 3,
                    // eslint-disable-next-line max-len
                    message: 'Cannot parse adblock rule due to the following error: Missing closing parenthesis for hint "NOT_PLATFORM"',
                    position: {
                        startColumn: 3,
                        endColumn: 16,
                    },
                },
            ],
        });

        // PLATFORM should have valid parameters
        expect(linter.lint('!+ NOT_PLATFORM()')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Hint "NOT_PLATFORM" must have at least one platform specified',
                    position: {
                        startColumn: 3,
                        endColumn: 17,
                    },
                },
            ],
        });

        // PLATFORM should have valid parameters
        expect(linter.lint('!+ NOT_PLATFORM(aa)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown platform "aa" in hint "NOT_PLATFORM"',
                    position: {
                        startColumn: 16,
                        endColumn: 18,
                    },
                },
            ],
        });

        // PLATFORM should have valid parameters
        expect(linter.lint('!+ NOT_PLATFORM(aa, bb)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown platform "aa" in hint "NOT_PLATFORM"',
                    position: {
                        startColumn: 16,
                        endColumn: 18,
                    },
                },
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown platform "bb" in hint "NOT_PLATFORM"',
                    position: {
                        startColumn: 20,
                        endColumn: 22,
                    },
                },
            ],
        });

        // Platform name is case-sensitive, even if it has a valid parameter
        expect(linter.lint('!+ not_platform(windows)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown hint name "not_platform"',
                    position: {
                        startColumn: 3,
                        endColumn: 15,
                    },
                },
            ],
        });

        // Syntax error
        expect(linter.lint('!+ HINT(')).toMatchObject({
            problems: [
                {
                    severity: 3,
                    // eslint-disable-next-line max-len
                    message: 'Cannot parse adblock rule due to the following error: Missing closing parenthesis for hint "HINT"',
                    position: {
                        startColumn: 3,
                        endColumn: 8,
                    },
                },
            ],
        });

        // Unknown hint name
        expect(linter.lint('!+ HINT')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown hint name "HINT"',
                    position: {
                        startColumn: 3,
                        endColumn: 7,
                    },
                },
            ],
        });

        // Unknown hint name
        expect(linter.lint('!+ HINT(aa)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown hint name "HINT"',
                    position: {
                        startColumn: 3,
                        endColumn: 7,
                    },
                },
            ],
        });

        // Unknown hint name
        expect(linter.lint('!+ HINT(aa, bb)')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown hint name "HINT"',
                    position: {
                        startColumn: 3,
                        endColumn: 7,
                    },
                },
            ],
        });

        // Unknown hint name
        expect(linter.lint('!+ NOT_HINT')).toMatchObject({
            problems: [
                {
                    rule: 'unknown-hints-and-platforms',
                    severity: 2,
                    message: 'Unknown hint name "NOT_HINT"',
                    position: {
                        startColumn: 3,
                        endColumn: 11,
                    },
                },
            ],
        });
    });
});
