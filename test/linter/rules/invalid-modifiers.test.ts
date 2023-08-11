import { AdblockSyntax } from '@adguard/agtree';

import { Linter } from '../../../src/linter';
import { InvalidModifiers } from '../../../src/linter/rules/invalid-modifiers';

describe('invalid-modifiers', () => {
    describe('non-specified syntax -- Common', () => {
        const linter = new Linter(false);
        linter.addRule('invalid-modifiers', InvalidModifiers);

        // For Common syntax only modifier existence is checked,
        // any other adblocker-specific checks cannot be done
        // so even if the rule is not fully correct, it is not invalid for Common syntax
        const existentModifiers = [
            '||example.com^$cname',
            '||example.com^$app',
            '||example.com^$webrtc',
            '||example.com^$empty',
        ];
        test.each(existentModifiers)('%s', (rule) => {
            expect(linter.lint(rule)).toMatchObject({ problems: [] });
        });

        const testCases = [
            {
                actual: '||example.com^$protobuf',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 2,
                    message: "Not existent modifier: 'protobuf'",
                    position: {
                        startColumn: 15,
                        endColumn: 23,
                    },
                },
            },
            {
                actual: '||example.com^$invalid',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 2,
                    message: "Not existent modifier: 'invalid'",
                    position: {
                        startColumn: 15,
                        endColumn: 22,
                    },
                },
            },
        ];

        test.each(testCases)('$actual', ({ actual, expected }) => {
            expect(linter.lint(actual)).toMatchObject({ problems: [expected] });
        });
    });

    describe('linter AdGuard syntax', () => {
        const linter = new Linter(false, {
            syntax: [AdblockSyntax.Adg],
        });
        linter.addRule('invalid-modifiers', InvalidModifiers);

        const validCases = [
            '||example.com/*.test.$replace=/("ad":{).+"(\\}\\,"(?:log|watermark)")/\\$1\\$2/',
            '||example.com$/$third-party,script,_____,domain=example.org',
            '@@||example.com^$cookie',
            '@@||example.com^$csp',
            '||example.com^$removeparam',
            '@@||example.com^$stealth',
        ];
        test.each(validCases)('%s', (rule) => {
            expect(linter.lint(rule).problems).toHaveLength(0);
        });

        /**
         * Test cases where:
         * `actual` is a single adblock rule;
         * `expected` is a single problem report.
         */
        const invalidCases = [
            {
                actual: '||example.com^$protobuf',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 2,
                    message: "Not existent modifier: 'protobuf'",
                    position: {
                        startColumn: 15,
                        endColumn: 23,
                    },
                },
            },
            {
                actual: '||example.com^$cname',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 2,
                    message: "The adblocker does not support the modifier: 'cname'",
                    position: {
                        startColumn: 15,
                        endColumn: 20,
                    },
                },
            },
            {
                actual: '||example.com^$app',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 2,
                    message: "Value is required for the modifier: 'app'",
                    position: {
                        startColumn: 15,
                        endColumn: 18,
                    },
                },
            },
            {
                actual: '||example.com^$webrtc',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 2,
                    message: "Removed and no longer supported modifier: 'webrtc'",
                    position: {
                        startColumn: 15,
                        endColumn: 21,
                    },
                },
            },
            {
                actual: '||example.com^$empty',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 1,
                    // eslint-disable-next-line max-len
                    message: 'Rules with `$empty` are still supported and being converted into `$redirect=nooptext` now\nbut the support shall be removed in the future.',
                    position: {
                        startColumn: 15,
                        endColumn: 20,
                    },
                },
            },
        ];

        test.each(invalidCases)('$actual', ({ actual, expected }) => {
            expect(linter.lint(actual)).toMatchObject({ problems: [expected] });
        });
    });

    describe('uBlock Origin syntax', () => {
        const linter = new Linter(false, {
            syntax: [AdblockSyntax.Ubo],
        });
        linter.addRule('invalid-modifiers', InvalidModifiers);

        /**
         * Test cases where:
         * `actual` is a single adblock rule;
         * `expected` is a single problem report.
         */
        const testCases = [
            {
                actual: '||example.com^$protobuf',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 2,
                    message: "Not existent modifier: 'protobuf'",
                    position: {
                        startColumn: 15,
                        endColumn: 23,
                    },
                },
            },
            {
                actual: '||example.com^$cname',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 2,
                    message: "Only exception rules may contain the modifier: 'cname'",
                    position: {
                        startColumn: 15,
                        endColumn: 20,
                    },
                },
            },
            {
                actual: '||example.com^$app',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 2,
                    message: "The adblocker does not support the modifier: 'app'",
                    position: {
                        startColumn: 15,
                        endColumn: 18,
                    },
                },
            },
            {
                actual: '||example.com^$webrtc',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 2,
                    message: "Removed and no longer supported modifier: 'webrtc'",
                    position: {
                        startColumn: 15,
                        endColumn: 21,
                    },
                },
            },
        ];

        test.each(testCases)('$actual', ({ actual, expected }) => {
            expect(linter.lint(actual)).toMatchObject({ problems: [expected] });
        });
    });

    describe('Adblock Plus syntax', () => {
        const linter = new Linter(false, {
            syntax: [AdblockSyntax.Abp],
        });
        linter.addRule('invalid-modifiers', InvalidModifiers);

        /**
         * Test cases where:
         * `actual` is a single adblock rule;
         * `expected` is a single problem report.
         */
        const testCases = [
            {
                actual: '||example.com^$protobuf',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 2,
                    message: "Not existent modifier: 'protobuf'",
                    position: {
                        startColumn: 15,
                        endColumn: 23,
                    },
                },
            },
            {
                actual: '||example.com^$badfilter',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 2,
                    message: "The adblocker does not support the modifier: 'badfilter'",
                    position: {
                        startColumn: 15,
                        endColumn: 24,
                    },
                },
            },
            {
                actual: '||example.com^$domain',
                expected: {
                    rule: 'invalid-modifiers',
                    severity: 2,
                    message: "Value is required for the modifier: 'domain'",
                    position: {
                        startColumn: 15,
                        endColumn: 21,
                    },
                },
            },
        ];

        test.each(testCases)('$actual', ({ actual, expected }) => {
            expect(linter.lint(actual)).toMatchObject({ problems: [expected] });
        });
    });
});
