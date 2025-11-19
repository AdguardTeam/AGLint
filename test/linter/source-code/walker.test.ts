import type esquery from 'esquery';
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import type { AnyNode, SelectorsWithVisitors, Visitor } from '../../../src/linter/source-code/visitor-collection';
import { LinterWalker } from '../../../src/linter/source-code/walker';

// Mock EsQueryUtils so we can control candidate typing/globality while using real esquery.parse
type SelectorAst = esquery.Selector;

const astToSelector = new WeakMap<object, string>();

vi.mock('../../src/linter/source-code/esquery-utils', async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const realEsquery = (await vi.importActual<typeof import('esquery')>('esquery'));

    /**
     * Parses a selector string into an AST.
     *
     * @param selector The selector string to parse.
     *
     * @returns The parsed AST.
     */
    function parse(selector: string): SelectorAst {
        const ast = realEsquery.parse(selector) as unknown as SelectorAst;
        astToSelector.set(ast as any, selector);
        return ast;
    }

    // Very small heuristic:
    // - return null (GLOBAL) for: "*", attribute-only (starts with '['), or complex (contains space, >, +, ~, ,)
    // - otherwise return the first identifier as the candidate type (TYPED)
    /**
     * Returns the candidate types for a given AST.
     *
     * @param ast The AST to get candidate types for.
     *
     * @returns The candidate types for the AST.
     */
    function getCandidateTypes(ast: object): Set<string> | null {
        const sel = astToSelector.get(ast) ?? '';
        if (
            sel === '*'
            || sel.startsWith('[')
            || /[\s>+~,]/.test(sel) // complex selector
        ) {
            // global
            return null;
        }

        const m = sel.match(/^[A-Za-z_][A-Za-z0-9_]*/);
        return m ? new Set([m[0]]) : null;
    }

    return {
        EsQueryUtils: {
            parse,
            getCandidateTypes,
        },
    };
});

const makeAst = (): AnyNode => ({
    type: 'Root',
    name: 'root',
    children: [
        { type: 'A', name: 'a1', children: [] },
        {
            type: 'B',
            name: 'b1',
            children: [
                { type: 'C', name: 'c1' },
                // no type -> must be skipped
                { name: 'notANode' },
            ],
        },
        {
            type: 'A',
            name: 'a2',
            // object child (not under "children")
            alt: { type: 'X', name: 'x1' },
            // array child (not under "children")
            arrayProp: [{ type: 'Y', name: 'y1' }, { junk: true }],
        },
    ],
});

describe('LinterWalker', () => {
    let walker: LinterWalker;
    let root: AnyNode;

    beforeEach(() => {
        walker = new LinterWalker();
        root = makeAst();
    });

    it('calls enter and leave visitors for typed selectors in correct order', () => {
        const enterA = vi.fn();
        const exitA = vi.fn();
        const visitors: SelectorsWithVisitors = {
            A: [enterA],
            'A:exit': [exitA],
        };

        walker.walk(root, visitors);

        // There are two A nodes: a1 and a2
        expect(enterA).toHaveBeenCalledTimes(2);
        expect(exitA).toHaveBeenCalledTimes(2);

        // Check order (enter called before exit for each A)
        // Collect node names in order of enter/exit
        const enterNames = (enterA.mock.calls.map((args) => args[0]?.name));
        const exitNames = (exitA.mock.calls.map((args) => args[0]?.name));
        expect(enterNames).toEqual(['a1', 'a2']);
        expect(exitNames).toEqual(['a1', 'a2']);
    });

    it('matches global wildcard "*" on every node (enter/leave)', () => {
        const enterStar = vi.fn();
        const exitStar = vi.fn();
        const visitors: SelectorsWithVisitors = {
            '*': [enterStar],
            '*:exit': [exitStar],
        };

        walker.walk(root, visitors);

        // Count total nodes with a "type" visited
        // Root, A(a1), B(b1), C(c1), A(a2), X(x1), Y(y1) => 7
        expect(enterStar).toHaveBeenCalledTimes(7);
        expect(exitStar).toHaveBeenCalledTimes(7);
    });

    it('handles complex/global selectors (e.g., attribute-only), matched via esquery', () => {
        // This selector is global (attribute-only), will be tested by esquery
        const enterHasNameA1 = vi.fn();
        const visitors: SelectorsWithVisitors = {
            '[name="a1"]': [enterHasNameA1],
        };

        walker.walk(root, visitors);
        expect(enterHasNameA1).toHaveBeenCalledTimes(1);
        expect(enterHasNameA1.mock.calls[0]?.[0]?.name).toBe('a1');
    });

    it('supports relation selectors via esquery (global path)', () => {
    // "B > C" — should match the C under B
        const hit = vi.fn();
        const visitors: SelectorsWithVisitors = {
            'B > C': [hit], // complex → global in mocked getCandidateTypes
        };

        walker.walk(root, visitors);
        expect(hit).toHaveBeenCalledTimes(1);
        expect(hit.mock.calls[0]?.[0]?.type).toBe('C');
    });

    it('traverses children in arrays and plain object properties (both scanned)', () => {
        const seenTypes: string[] = [];
        const enter = ((node: AnyNode) => {
            seenTypes.push(node.type as string);
        }) as unknown as Visitor;

        const visitors: SelectorsWithVisitors = { '*': [enter] };
        walker.walk(root, visitors);

        // Must include X (from "alt") and Y (from "arrayProp")
        expect(seenTypes).toEqual(expect.arrayContaining(['Root', 'A', 'B', 'C', 'A', 'X', 'Y']));
    });

    it('skips non-node objects (without type)', () => {
        const hit = vi.fn();
        const visitors: SelectorsWithVisitors = { '[junk=true]': [hit] }; // global attribute selector

        walker.walk(root, visitors);

        // The object { junk: true } exists, but it's NOT a node (no "type"),
        // so the walker must not visit it → esquery never runs on it.
        expect(hit).toHaveBeenCalledTimes(0);
    });

    it('passes correct parent and ancestry (enter on child sees parent & ancestry)', () => {
        let snap: AnyNode[] | null = null;

        const enterA = vi.fn((_node, _parent, ancestry) => {
            // snapshot so later mutations don't affect the expectation
            snap = [...ancestry];
        });

        const visitors: SelectorsWithVisitors = { A: [enterA] };

        walker.walk(root, visitors);

        const [node, parent] = enterA.mock.calls[0]!;
        expect(node?.name).toBe('a1');
        expect(parent?.type).toBe('Root');
        // use snapshot instead of the live array
        expect(snap![0]?.type).toBe('Root');
    });

    it('honors initial ancestry (parent for root is the last of initial ancestry)', () => {
        const initial = { type: 'Init', name: 'ancestor' } as AnyNode;

        const onRootEnter = vi.fn();
        const visitors: SelectorsWithVisitors = { Root: [onRootEnter] };

        walker.walk(root, visitors, ['children'], 'type', [initial]);

        const [node, parent, ancestry] = onRootEnter.mock.calls[0]!;
        expect(node?.type).toBe('Root');
        expect(parent?.type).toBe('Init'); // initial ancestry parent
        // For the root enter call, ancestry should be the provided initial stack
        expect(ancestry[0]?.type).toBe('Init');
    });

    it('multiple visitors on the same selector are all invoked (enter and exit)', () => {
        const a1 = vi.fn();
        const a2 = vi.fn();
        const aExit1 = vi.fn();
        const aExit2 = vi.fn();

        const visitors: SelectorsWithVisitors = {
            A: [a1, a2],
            'A:exit': [aExit1, aExit2],
        };

        walker.walk(root, visitors);

        // Two A nodes; each visitor should be called twice
        expect(a1).toHaveBeenCalledTimes(2);
        expect(a2).toHaveBeenCalledTimes(2);
        expect(aExit1).toHaveBeenCalledTimes(2);
        expect(aExit2).toHaveBeenCalledTimes(2);
    });

    it('ENTER happens before traversing children and LEAVE after (depth-first order)', () => {
        const log: string[] = [];

        const enterAny: Visitor = (n) => log.push(`enter:${(n as any).type}:${(n as any).name ?? ''}`);
        const exitAny: Visitor = (n) => log.push(`exit:${(n as any).type}:${(n as any).name ?? ''}`);

        const visitors: SelectorsWithVisitors = {
            '*': [enterAny],
            '*:exit': [exitAny],
        };

        walker.walk(root, visitors);

        // Spot-check order around B -> C
        const iEnterB = log.indexOf('enter:B:b1');
        const iEnterC = log.indexOf('enter:C:c1');
        const iExitC = log.indexOf('exit:C:c1');
        const iExitB = log.indexOf('exit:B:b1');

        expect(iEnterB).toBeLessThan(iEnterC);
        expect(iEnterC).toBeLessThan(iExitC);
        expect(iExitC).toBeLessThan(iExitB);
    });

    it('reuses selector index when selectors are unchanged (caching)', async () => {
        const { EsQueryUtils } = await import('../../../src/linter/source-code/esquery-utils');
        const parseSpy = vi.spyOn(EsQueryUtils, 'parse');

        const f1: Visitor = () => {};
        const f2: Visitor = () => {};
        const visitors: SelectorsWithVisitors = { A: [f1], 'B:exit': [f2] };

        // 1st walk → parse twice: 'A' and 'B'
        walker.walk(root, visitors);
        const callsAfterFirst = parseSpy.mock.calls.length;
        expect(callsAfterFirst).toBe(2);

        // 2nd walk with the *same* selectors → should not re-parse
        walker.walk(root, visitors);
        expect(parseSpy).toHaveBeenCalledTimes(callsAfterFirst);

        // 3rd walk with *different selector strings* → must rebuild (+2)
        const g1: Visitor = () => {};
        const g2: Visitor = () => {};
        const visitors2: SelectorsWithVisitors = { C: [g1], 'D:exit': [g2] };

        walker.walk(root, visitors2);
        expect(parseSpy).toHaveBeenCalledTimes(callsAfterFirst + 2); // now 4
    });

    it('handles empty selectors object without errors', () => {
        // just smoke-test
        walker.walk(root, {});
        expect(true).toBe(true);
    });

    it('uses custom childrenKey and typeKey when provided', () => {
        // Put `list` directly on nodes with `kind`
        const customRoot: AnyNode = {
            kind: 'Root',
            list: [
                { kind: 'K' },
                { kind: 'L', list: [{ kind: 'K' }] },
            ],
        };

        const hits: string[] = [];
        const v: Visitor = (n) => hits.push((n as any).kind);

        const visitors: SelectorsWithVisitors = { K: [v] };

        walker.walk(
            customRoot,
            visitors,
            ['list'] /* childrenKey */,
            'kind' /* typeKey */,
        );

        expect(hits).toEqual(['K', 'K']);
    });

    it('supports multiple childrenKeys to visit nodes from different arrays', () => {
        // AST with both 'children' and 'comments' arrays
        const astWithComments: AnyNode = {
            type: 'Root',
            children: [
                { type: 'Child', name: 'c1' },
                { type: 'Child', name: 'c2' },
            ],
            comments: [
                { type: 'Comment', value: 'comment1' },
                { type: 'Comment', value: 'comment2' },
            ],
        };

        const childHits: string[] = [];
        const commentHits: string[] = [];

        const childVisitor: Visitor = (n) => childHits.push((n as any).name);
        const commentVisitor: Visitor = (n) => commentHits.push((n as any).value);

        const visitors: SelectorsWithVisitors = {
            Child: [childVisitor],
            Comment: [commentVisitor],
        };

        // Pass both 'children' and 'comments' as childrenKeys
        walker.walk(
            astWithComments,
            visitors,
            ['children', 'comments'] /* multiple childrenKeys */,
            'type',
        );

        // Should visit both children and comments
        expect(childHits).toEqual(['c1', 'c2']);
        expect(commentHits).toEqual(['comment1', 'comment2']);
    });
});
