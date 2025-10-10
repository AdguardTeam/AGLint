import esquery from 'esquery';
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { LinterWalker, VisitorEvent } from '../../src/linter-new/walker';

const sampleAst = {
    type: 'Root',
    children: [
        {
            type: 'Parent',
            children: [
                { type: 'Child', name: 'x' },
                { type: 'Child', name: 'y' },
            ],
        },
        { type: 'Sibling' },
    ],
};

describe('LinterWalker', () => {
    let walker: LinterWalker;

    beforeEach(() => {
        walker = new LinterWalker();
    });

    describe('getParsed', () => {
        it('parses a selector string and caches it', () => {
            const spy = vi.spyOn(esquery, 'parse');
            const first = (walker as any).getParsed('Identifier');
            const second = (walker as any).getParsed('Identifier');
            // same object (cached)
            expect(first).toBe(second);
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('buildIndex', () => {
        it('indexes selectors by node type', () => {
            const selector = 'Identifier';
            const visitor = vi.fn();
            const result = (walker as any).buildIndex({ [selector]: visitor });

            expect(result.typeHandlers.size).toBeGreaterThan(0);
            const handlers = Array.from(result.typeHandlers.values()) as { visitor: unknown }[][];
            expect(handlers[0]?.[0]?.visitor).toBe(visitor);
            expect(result.globalHandlers.length).toBe(0);
        });

        it('places universal selectors into globalHandlers', () => {
            const selector = '[name="x"]';
            const visitor = vi.fn();
            const result = (walker as any).buildIndex({ [selector]: visitor });

            expect(result.globalHandlers.length).toBe(1);
            expect(result.typeHandlers.size).toBe(0);
        });

        it('handles multiple types per selector', () => {
            // Create fake AST manually with two type entries
            const fakeAst = {
                type: 'compound',
                selectors: [
                    { type: 'type', value: 'A' },
                    { type: 'type', value: 'B' },
                ],
            };
            const parseSpy = vi.spyOn(esquery, 'parse').mockReturnValue(fakeAst as any);

            const visitor = vi.fn();
            const result = (walker as any).buildIndex({ 'A, B': visitor });

            expect(result.typeHandlers.get('A')).toBeDefined();
            expect(result.typeHandlers.get('B')).toBeDefined();

            parseSpy.mockRestore();
        });
    });

    describe('walk', () => {
        it('calls visitors for matching nodes (enter and leave)', () => {
            const visitor = vi.fn();
            const selectors = {
                Root: visitor,
                Parent: visitor,
                Child: visitor,
            };

            walker.walk(sampleAst, selectors);

            // Expect enter and leave per matching node
            const calls = visitor.mock.calls.filter(([node]) => node.type === 'Child');
            expect(calls.length).toBe(4); // 2 nodes * (Enter + Leave)
            expect(calls?.[0]?.[3]).toBe(VisitorEvent.Enter);
            expect(calls?.[1]?.[3]).toBe(VisitorEvent.Leave);
        });

        it('handles universal selectors and ancestry tracking', () => {
            const expected = [
                ['Root', []],
                ['Parent', ['Root']],
                ['Child', ['Root', 'Parent']],
                ['Child', ['Root', 'Parent']],
                ['Child', ['Root', 'Parent']],
                ['Child', ['Root', 'Parent']],
                ['Parent', ['Root']],
                ['Sibling', ['Root']],
                ['Sibling', ['Root']],
                ['Root', []],
            ];

            const stored: [unknown, unknown[]][] = [];

            walker.walk(sampleAst, {
                '*': (node, _, ancestry) => {
                    stored.push([node.type, ancestry.map((n) => n.type)]);
                },
            });

            expect(stored).toEqual(expected);
        });

        it('supports custom childrenKey and typeKey', () => {
            const ast = {
                kind: 'Root',
                nodes: [{ kind: 'Item', nodes: [] }],
            };
            const visitor = vi.fn();
            const selectors = { Item: visitor };
            walker.walk(ast, selectors, 'nodes', 'kind');

            expect(visitor).toHaveBeenCalled();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/naming-convention
            const [node, parent, _, event] = visitor.mock.calls[0] as any;
            expect(node.kind).toBe('Item');
            expect(parent.kind).toBe('Root');
            expect(event).toBe(VisitorEvent.Enter);
        });

        it('skips invalid or missing children gracefully', () => {
            const badAst = {
                type: 'Root',
                child: null,
                something: 42,
                nested: { type: 'Node' },
            };
            const visitor = vi.fn();
            const selectors = { Node: visitor };
            expect(() => walker.walk(badAst, selectors)).not.toThrow();
            expect(visitor).toHaveBeenCalledTimes(2); // enter + leave for Node
        });

        it('uses cached selector index on subsequent walks', () => {
            const visitor = vi.fn();
            const selectors = { Root: visitor };
            const spy = vi.spyOn<any, any>(walker as any, 'buildIndex');

            walker.walk(sampleAst, selectors);
            walker.walk(sampleAst, selectors);

            // buildIndex only called once
            expect(spy).toHaveBeenCalledTimes(1);
            spy.mockRestore();
        });

        it('does not throw if no matching selectors', () => {
            const visitor = vi.fn();
            const selectors = { NonExistingType: visitor };

            expect(() => walker.walk(sampleAst, selectors)).not.toThrow();
            expect(visitor).not.toHaveBeenCalled();
        });
    });
});
