import esquery from 'esquery';

import { EsQueryUtils } from './esquery-utils';

/**
 * Represents an object with string keys and unknown values.
 * This is a basic type to represent AST nodes.
 */
export type AnyObject = Record<string, unknown>;

/**
 * Represents the traversal phase for a node.
 */
export const enum VisitorEvent {
    /**
     * Event is triggered when entering a node.
     */
    Enter,

    /**
     * Event is triggered when leaving a node.
     */
    Leave,
}

/**
 * A function that is called for each node that matches a selector.
 *
 * @param node The node that is being visited.
 * @param parent The parent of the node, or `null` if it is the root.
 * @param ancestry An array of the node's ancestors, from the root to the parent.
 * @param event The traversal phase, either `Enter` or `Leave`.
 */
export type Visitor = (
    node: AnyObject,
    parent: AnyObject | null,
    ancestry: AnyObject[],
    event: VisitorEvent,
) => void;

/**
 * Internal representation of a selector and its associated visitor.
 * This includes the parsed selector AST, its test function, and any
 * candidate node types for faster matching.
 */
type SelectorVisitorHandler = {
    /**
     * The parsed selector AST.
     */
    ast: esquery.Selector;

    /**
     * Tests whether a node matches this selector.
     */
    test: (node: AnyObject, ancestry: AnyObject[]) => boolean;

    /**
     * The visitor callback associated with this selector.
     */
    visitor: Visitor;

    /**
     * Candidate node types extracted from the selector, or `null` if universal.
     */
    candidateTypes: Set<string> | null;
};

/**
 * Index of selectors grouped by node type for efficient lookup.
 * Handlers with no explicit type constraints are stored in `globalHandlers`.
 *
 * This allows skipping non-relevant selectors during traversal.
 */
type SelectorIndex = {
    /**
     * Handlers grouped by node type.
     */
    typeHandlers: Map<string, SelectorVisitorHandler[]>;

    /**
     * Handlers with no explicit type constraints.
     */
    globalHandlers: SelectorVisitorHandler[];
};

/**
 * A generic AST walker that allows visitors to be attached to nodes
 * using CSS-like selectors. It supports enter and leave phases
 * and is optimized by indexing selectors by node type.
 */
export class LinterWalker {
    /**
     * Cache for parsed selector ASTs.
     */
    private readonly parseCache = new Map<string, esquery.Selector>();

    /**
     * Caches the selector index to avoid rebuilding it on subsequent walks
     * if the selectors have not changed.
     */
    private cachedIndex: SelectorIndex | null = null;

    /**
     * Parses a selector string into an AST, with caching.
     * This avoids re-parsing the same selector string multiple times.
     *
     * @param raw The raw selector string to parse.
     * @returns The parsed selector AST.
     */
    private getParsed(raw: string): esquery.Selector {
        let ast = this.parseCache.get(raw);

        if (!ast) {
            ast = esquery.parse(raw);
            this.parseCache.set(raw, ast);
        }

        return ast;
    }

    /**
     * Builds a fast lookup index of selectors, categorized by node type.
     * This allows the walker to quickly retrieve only the relevant selectors
     * for a given node type, avoiding unnecessary checks.
     * Selectors that do not specify a node type (e.g., `*` or `[name="foo"]`)
     * are stored in a separate `universal` list.
     *
     * @param selectors A map of selector strings to visitor functions.
     * @param typeKey The key used to access the node's type.
     *
     * @returns An object containing the index of selectors by type and a list of universal selectors.
     */
    private buildIndex(selectors: Record<string, Visitor>, typeKey: string): SelectorIndex {
        const result: SelectorIndex = {
            typeHandlers: new Map(),
            globalHandlers: [],
        };

        for (const [raw, visitor] of Object.entries(selectors)) {
            const ast = this.getParsed(raw);
            const test = (node: AnyObject, ancestry?: AnyObject[]) => {
                // TODO: Improve types when switching to our own node selector library
                return esquery.matches(
                    node as any,
                    ast as any,
                    ancestry as any,
                    {
                        nodeTypeKey: typeKey,
                    },
                );
            };

            const candidateTypes = EsQueryUtils.getCandidateTypes(ast);

            const item: SelectorVisitorHandler = {
                ast,
                test,
                visitor,
                candidateTypes,
            };

            if (!candidateTypes) {
                result.globalHandlers.push(item);
            } else {
                for (const t of candidateTypes) {
                    let arr = result.typeHandlers.get(t);
                    if (!arr) {
                        arr = [];
                        result.typeHandlers.set(t, arr);
                    }
                    arr.push(item);
                }
            }
        }

        return result;
    }

    /**
     * Traverses an AST, applying the given selectors and visitors.
     * It performs a depth-first traversal, calling visitors for both an `enter`
     * and `leave` phase for each node that matches a selector.
     *
     * @param root The root node of the AST to traverse.
     * @param selectors A map of selector strings to visitor functions.
     * @param childrenKey The key used to access an array of child nodes. Defaults to 'children'.
     * @param typeKey The key used to access the node's type. Defaults to 'type'.
     */
    public walk(
        root: AnyObject,
        selectors: Record<string, Visitor> = {},
        childrenKey: string = 'children',
        typeKey: string = 'type',
    ): void {
        if (!this.cachedIndex) {
            this.cachedIndex = this.buildIndex(selectors, typeKey);
        }

        const index = this.cachedIndex;
        const ancestors: AnyObject[] = [];

        const visit = (node: AnyObject, parent: AnyObject | null): void => {
            const nodeType = node[typeKey] as string | undefined;
            const candidatesTyped = nodeType ? index.typeHandlers.get(nodeType) : undefined;

            // ENTER phase
            if (candidatesTyped) {
                for (let i = 0; i < candidatesTyped.length; i += 1) {
                    const c = candidatesTyped[i]!;
                    if (c.test(node, ancestors)) {
                        c.visitor(node, parent, ancestors, VisitorEvent.Enter);
                    }
                }
            }
            if (index.globalHandlers.length > 0) {
                for (let i = 0; i < index.globalHandlers.length; i += 1) {
                    const c = index.globalHandlers[i]!;
                    if (c.test(node, ancestors)) {
                        c.visitor(node, parent, ancestors, VisitorEvent.Enter);
                    }
                }
            }

            // Traverse children
            ancestors.push(node);
            const list = (node as any)[childrenKey];
            if (Array.isArray(list)) {
                for (let i = 0; i < list.length; i += 1) {
                    const child = list[i];
                    if (child && typeof child === 'object' && (child as any)[typeKey]) {
                        visit(child, node);
                    }
                }
            } else {
                Object.keys(node).forEach((key) => {
                    const v = (node as any)[key];
                    if (!v || typeof v !== 'object') {
                        return;
                    }

                    if (Array.isArray(v)) {
                        for (let i = 0; i < v.length; i += 1) {
                            const child = v[i];
                            if (child && typeof child === 'object' && (child as any)[typeKey]) {
                                visit(child, node);
                            }
                        }
                    } else if ((v as any)[typeKey]) {
                        visit(v, node);
                    }
                });
            }
            ancestors.pop();

            // LEAVE phase
            if (candidatesTyped) {
                for (let i = 0; i < candidatesTyped.length; i += 1) {
                    const c = candidatesTyped[i]!;
                    if (c.test(node, ancestors)) {
                        c.visitor(node, parent, ancestors, VisitorEvent.Leave);
                    }
                }
            }
            if (index.globalHandlers.length > 0) {
                for (let i = 0; i < index.globalHandlers.length; i += 1) {
                    const c = index.globalHandlers[i]!;
                    if (c.test(node, ancestors)) {
                        c.visitor(node, parent, ancestors, VisitorEvent.Leave);
                    }
                }
            }
        };

        visit(root, null);
    }
}
