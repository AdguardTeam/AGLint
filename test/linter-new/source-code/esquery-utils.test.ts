import * as esquery from 'esquery';
import { describe, expect, it } from 'vitest';

import { EsQueryUtils } from '../../../src/linter-new/source-code/esquery-utils';

/**
 * Helper to normalize the `Set<string> | null` into a sorted array or `null`.
 *
 * @param selector The esquery selector string to parse.
 * @returns A sorted array of node types that match the selector, or `null` if the selector doesn't narrow the subject.
 */
function candidatesOf(selector: string): string[] | null {
    const ast = esquery.parse(selector) as unknown as esquery.Selector;
    const set = EsQueryUtils.getCandidateTypes(ast);

    return set ? [...set].sort() : null;
}

describe('EsQueryUtils.getCandidateTypes', () => {
    it.each([
        // Basic type/identifier selectors
        ['Identifier', ['Identifier']],
        ['Literal', ['Literal']],

        // Attribute-based picking of node type
        ['[type="Identifier"]', ['Identifier']],
        ['[type="Identifier"][name="x"]', ['Identifier']],
        ['Identifier[name=/^x/]', ['Identifier']],
        ['CallExpression[callee.name="require"]', ['CallExpression']],
        ['FunctionDeclaration[id.name="foo"]', ['FunctionDeclaration']],

        ['CssInjectionRuleBody Value.declarationList', ['Value']],
        ['Modifier > Value[name="domain"].name', ['Value']],

        // Binary selectors: default subject is the RIGHT side
        ['IfStatement > BlockStatement', ['BlockStatement']],
        ['IfStatement BlockStatement', ['BlockStatement']],
        ['IfStatement + BlockStatement', ['BlockStatement']],
        ['IfStatement ~ BlockStatement', ['BlockStatement']],

        // Explicit subject "!" overrides defaults
        ['!IfStatement > BlockStatement', ['IfStatement']],
        ['Program > !VariableDeclaration', ['VariableDeclaration']],

        // :matches() unions subjects of its options
        [':matches(Identifier, Literal)', ['Identifier', 'Literal']],
        // eslint-disable-next-line max-len
        ['Program > :matches(VariableDeclaration, FunctionDeclaration)', ['FunctionDeclaration', 'VariableDeclaration']],

        // :has() does NOT change the subject; it filters the current one
        ['FunctionDeclaration:has(IfStatement)', ['FunctionDeclaration']],

        // Wildcards and broad classes mean "no useful narrowing" -> null
        ['*', null],
        [':statement', null],
        [':expression', null],
        ['*[name="x"]', null], // wildcard subject remains unconstrained
        [':not(Identifier)', null], // base is wildcard → still unconstrained
        [':has(Identifier)', null], // base is wildcard → still unconstrained

        // Mixed, deeper selectors (rightmost is still the subject unless ! is used)
        ['Program :matches(VariableDeclaration, FunctionDeclaration) > Identifier', ['Identifier']],
    ] as Array<[string, string[] | null]>)('selector %s → %j', (selector, expected) => {
        expect(candidatesOf(selector)).toEqual(expected);
    });

    it('returns null when no concrete types are found in a complex wildcard chain', () => {
        expect(candidatesOf('*:has(IfStatement) > *')).toBeNull();
    });

    it('respects explicit subject on both sides of a binary selector', () => {
        // Both sides explicitly subject-marked: union of both subjects
        expect(candidatesOf('!IfStatement > !BlockStatement')).toEqual(['BlockStatement', 'IfStatement']);
    });

    it('ignores non-subject context inside :not() and :has()', () => {
        // Here subject is FunctionDeclaration; the inner Identifier must NOT be collected
        expect(
            candidatesOf('FunctionDeclaration:has(Identifier):not([generator=true])'),
        ).toEqual(['FunctionDeclaration']);
    });
});
