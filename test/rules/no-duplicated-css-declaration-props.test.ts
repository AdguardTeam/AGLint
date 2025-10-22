import {
    describe,
    expect,
    it,
    test,
} from 'vitest';

import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint, lintWithFixes } from './helpers/lint';

const rulesConfig: LinterRulesConfig = {
    'no-duplicated-css-declaration-props': LinterRuleSeverity.Error,
};

describe('no-duplicated-css-declaration-props', () => {
    test('should ignore non-problematic cases', async () => {
        // Single property
        await expect(
            lint(
                '##.foo { padding: 1px; }',
                rulesConfig,
            ),
        ).resolves.toMatchObject({ problems: [] });

        // Multiple different properties
        await expect(
            lint(
                '##.foo { padding: 1px; margin: 2px; color: red; }',
                rulesConfig,
            ),
        ).resolves.toMatchObject({ problems: [] });

        await expect(
            lint(
                '##.bar { padding: 2px; margin: 0; }',
                rulesConfig,
            ),
        ).resolves.toMatchObject({ problems: [] });

        // Empty rule
        // FIXME
        // await expect(
        //     lint(
        //         '##.foo { }',
        //         rulesConfig,
        //     ),
        // ).resolves.toMatchObject({ problems: [] });
    });

    it('should detect problematic cases', async () => {
        // Simple duplicate with identical values (should auto-fix, no suggestions)
        const result = await lint('##.foo { padding: 1px; padding: 1px; }', rulesConfig);
        expect(result.problems).toHaveLength(1);
        expect(result.problems[0]).toMatchObject({
            category: 'problem',
            ruleId: 'no-duplicated-css-declaration-props',
            severity: LinterRuleSeverity.Error,
            data: {
                property: 'padding',
            },
            messageId: 'duplicatedProperty',
            position: {
                start: {
                    column: 23,
                    line: 1,
                },
                end: {
                    column: 35,
                    line: 1,
                },
            },
        });
        // Should have auto-fix, not suggestions
        const problem = result.problems[0]!;
        expect(problem.fix).toBeDefined();
        expect(problem.suggestions).toBeUndefined();

        // Multiple duplicates of same property with identical values
        const multiResult = await lint(
            '##.foo { padding: 1px; margin: 2px; padding: 1px; padding: 1px; }',
            rulesConfig,
        );
        expect(multiResult.problems).toHaveLength(2);

        // Both problems should have auto-fix, not suggestions
        expect(multiResult.problems[0]!.fix).toBeDefined();
        expect(multiResult.problems[0]!.suggestions).toBeUndefined();
        expect(multiResult.problems[1]!.fix).toBeDefined();
        expect(multiResult.problems[1]!.suggestions).toBeUndefined();
    });

    it('should fix problematic cases properly', async () => {
        // Simple duplicate fix - different values, should NOT auto-fix
        expect(
            (await lintWithFixes('##.foo { padding: 1px; padding: 2px; }', rulesConfig)),
        ).toHaveProperty('fixedSource', '##.foo { padding: 1px; padding: 2px; }');

        // Identical values - SHOULD auto-fix
        expect(
            (await lintWithFixes('##.foo { padding: 1px; padding: 1px; }', rulesConfig)),
        ).toHaveProperty('fixedSource', '##.foo { padding: 1px; }');

        // Multiple duplicates with different values - should NOT auto-fix
        expect(
            (await lintWithFixes('##.foo { padding: 1px; margin: 2px; padding: 3px; padding: 4px; }', rulesConfig)),
        ).toHaveProperty('fixedSource', '##.foo { padding: 1px; margin: 2px; padding: 3px; padding: 4px; }');

        // Multiple duplicates with identical values - SHOULD auto-fix
        expect(
            (await lintWithFixes('##.foo { padding: 1px; margin: 2px; padding: 1px; padding: 1px; }', rulesConfig)),
        ).toHaveProperty('fixedSource', '##.foo { padding: 1px; margin: 2px; }');
    });

    it('should provide suggestions for different values', async () => {
        // Simple duplicate with different values - should provide suggestions
        const result = await lint('##.foo { padding: 1px; padding: 2px; }', rulesConfig);

        expect(result.problems).toHaveLength(1);
        expect(result.problems[0]).toMatchObject({
            category: 'problem',
            ruleId: 'no-duplicated-css-declaration-props',
            severity: LinterRuleSeverity.Error,
            messageId: 'duplicatedProperty',
            data: {
                property: 'padding',
            },
        });

        // Should have suggestions
        expect(result.problems).toHaveLength(1);
        const problem = result.problems[0]!;
        const { suggestions } = problem;
        expect(suggestions).toBeDefined();
        expect(suggestions).toHaveLength(2);

        // First suggestion: remove first declaration
        expect(suggestions![0]).toMatchObject({
            messageId: 'removeFirstDeclaration',
            data: {
                property: 'padding',
                value: '1px',
            },
        });

        // Second suggestion: remove current declaration
        expect(suggestions![1]).toMatchObject({
            messageId: 'removeCurrentDeclaration',
            data: {
                property: 'padding',
                value: '2px',
            },
        });
    });

    it('should provide suggestions for multiple different values', async () => {
        // Multiple duplicates with different values
        const result = await lint('##.foo { padding: 1px; margin: 2px; padding: 3px; padding: 4px; }', rulesConfig);

        expect(result.problems).toHaveLength(2);

        // First duplicate (padding: 3px)
        const firstProblem = result.problems[0]!;
        const firstSuggestions = firstProblem.suggestions;
        expect(firstSuggestions).toBeDefined();
        expect(firstSuggestions).toHaveLength(2);
        expect(firstSuggestions![0]).toMatchObject({
            messageId: 'removeFirstDeclaration',
            data: {
                property: 'padding',
                value: '1px',
            },
        });
        expect(firstSuggestions![1]).toMatchObject({
            messageId: 'removeCurrentDeclaration',
            data: {
                property: 'padding',
                value: '3px',
            },
        });

        // Second duplicate (padding: 4px)
        const secondProblem = result.problems[1]!;
        const secondSuggestions = secondProblem.suggestions;
        expect(secondSuggestions).toBeDefined();
        expect(secondSuggestions).toHaveLength(2);
        expect(secondSuggestions![0]).toMatchObject({
            messageId: 'removeFirstDeclaration',
            data: {
                property: 'padding',
                value: '1px',
            },
        });
        expect(secondSuggestions![1]).toMatchObject({
            messageId: 'removeCurrentDeclaration',
            data: {
                property: 'padding',
                value: '4px',
            },
        });
    });

    it('should not provide suggestions for identical values (auto-fix instead)', async () => {
        // Identical values should not have suggestions, only auto-fix
        const result = await lint('##.foo { padding: 1px; padding: 1px; }', rulesConfig);

        expect(result.problems).toHaveLength(1);
        expect(result.problems[0]).toMatchObject({
            category: 'problem',
            ruleId: 'no-duplicated-css-declaration-props',
            severity: LinterRuleSeverity.Error,
            messageId: 'duplicatedProperty',
        });

        // Should NOT have suggestions (has auto-fix instead)
        expect(result.problems).toHaveLength(1);
        const problem = result.problems[0]!;
        expect(problem.suggestions).toBeUndefined();
        expect(problem.fix).toBeDefined();
    });
});
