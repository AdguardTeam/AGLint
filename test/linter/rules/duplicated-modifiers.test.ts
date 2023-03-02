import { Linter } from '../../../src/linter';
import { DuplicatedModifiers } from '../../../src/linter/rules/duplicated-modifiers';

let linter: Linter;

describe('duplicated-modifiers', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('duplicated-modifiers', DuplicatedModifiers);
    });

    test('should ignore non-problematic cases', () => {
        // Cosmetic rule
        expect(linter.lint('example.com##.ad')).toMatchObject({ problems: [] });

        // Network rule, but no duplicates
        expect(linter.lint('||example.com^$script,third-party')).toMatchObject({ problems: [] });
    });

    it('should detect problematic cases', () => {
        // 4x script
        expect(linter.lint('||example.com^$script,third-party,script,script,script')).toMatchObject({
            problems: [
                {
                    rule: 'duplicated-modifiers',
                    severity: 2,
                    message: 'The modifier "script" is used multiple times, but it should be used only once',
                    position: {
                        startColumn: 0,
                        endColumn: 54,
                    },
                },
            ],
        });

        // 5x script, 2x third-party
        expect(linter.lint(
            '||example.com^$script,third-party,script,script,script,third-party,script,domain=example.net',
        )).toMatchObject({
            problems: [
                {
                    rule: 'duplicated-modifiers',
                    severity: 2,
                    message: 'The modifier "script" is used multiple times, but it should be used only once',
                    position: {
                        startColumn: 0,
                        endColumn: 92,
                    },
                },
                {
                    rule: 'duplicated-modifiers',
                    severity: 2,
                    message: 'The modifier "third-party" is used multiple times, but it should be used only once',
                    position: {
                        startColumn: 0,
                        endColumn: 92,
                    },
                },
            ],
        });

        // 2x domain
        expect(linter.lint(
            'ads.js$script,domain=example.com,domain=example.net',
        )).toMatchObject({
            problems: [
                {
                    rule: 'duplicated-modifiers',
                    severity: 2,
                    message: 'The modifier "domain" is used multiple times, but it should be used only once',
                    position: {
                        startColumn: 0,
                        endColumn: 51,
                    },
                },
            ],
        });
    });
});
