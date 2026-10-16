import { type CommentRule, FilterListPipeline } from '@adguard/agtree';
import { describe, expect, it } from 'vitest';

import { parseConfigComment } from '../../src/linter/config-comment';

const parseComment = (source: string): CommentRule => {
    const ast = new FilterListPipeline().parse(source, { isLocIncluded: true });
    return ast.children[0] as CommentRule;
};

describe('parseConfigComment', () => {
    it('returns null for non-aglint comments', () => {
        expect(parseConfigComment(parseComment('! hello'))).toBeNull();
    });

    it('parses a command without params', () => {
        const source = '! aglint-disable';
        const parsed = parseConfigComment(parseComment(source));

        expect(parsed?.command.value).toBe('aglint-disable');
        expect(parsed?.params).toBeUndefined();
        expect(source.slice(parsed!.command.start, parsed!.command.end)).toBe('aglint-disable');
    });

    it('parses a comma-separated parameter list with positions', () => {
        const source = '! aglint-disable rule1, rule2';
        const parsed = parseConfigComment(parseComment(source));

        expect(parsed?.command.value).toBe('aglint-disable');
        expect(parsed?.params?.type).toBe('ParameterList');

        if (parsed?.params?.type !== 'ParameterList') {
            throw new Error('expected a ParameterList');
        }

        expect(parsed.params.children.map((child) => child.value)).toEqual(['rule1', 'rule2']);

        for (const child of parsed.params.children) {
            expect(source.slice(child.start, child.end)).toBe(child.value);
        }
    });

    it('parses a configuration object with levn', () => {
        const source = '! aglint "rule-1": ["warn", { "option1": "value1" }], "rule-2": "off"';
        const parsed = parseConfigComment(parseComment(source));

        expect(parsed?.command.value).toBe('aglint');
        expect(parsed?.params).toMatchObject({
            type: 'ConfigNode',
            value: {
                'rule-1': ['warn', { option1: 'value1' }],
                'rule-2': 'off',
            },
        });
    });

    it('extracts a trailing comment after --', () => {
        const source = '! aglint-enable rule1 -- comment';
        const parsed = parseConfigComment(parseComment(source));

        expect(parsed?.comment?.value).toBe('-- comment');
        expect(source.slice(parsed!.comment!.start, parsed!.comment!.end)).toBe('-- comment');
    });

    it('throws for an empty configuration', () => {
        expect(() => parseConfigComment(parseComment('! aglint'))).toThrow('Empty AGLint config');
    });

    it('throws for malformed configuration', () => {
        expect(() => parseConfigComment(parseComment('! aglint rule1'))).toThrow();
    });
});
