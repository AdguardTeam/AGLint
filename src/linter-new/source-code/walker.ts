import esquery from 'esquery';

import { EsQueryUtils } from './esquery-utils';
import { type AnyNode, type SelectorsWithVisitors, type Visitor } from './visitor-collection';

/**
 * Internal representation of a selector and its associated visitor.
 * This includes the parsed selector AST, its test function, and any
 * candidate node types for faster matching.
 */
type SelectorVisitorsHandler = {
    /**
     * The parsed selector AST.
     */
    ast: esquery.Selector;

    /**
     * Tests whether a node matches this selector.
     */
    test: (node: AnyNode, ancestry: AnyNode[]) => boolean;

    /**
     * Enter visitor callbacks associated with this selector.
     */
    visitorsEnter: Visitor[];

    /**
     * Leave visitor callbacks associated with this selector.
     */
    visitorsLeave: Visitor[];

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
    typeHandlers: Map<string, SelectorVisitorsHandler[]>;

    /**
     * Handlers with no explicit type constraints.
     */
    globalHandlers: SelectorVisitorsHandler[];
};

/**
 * A generic AST walker that allows visitors to be attached to nodes
 * using CSS-like selectors. It supports enter and leave phases
 * and is optimized by indexing selectors by node type.
 */
export class LinterWalker {
    /**
     * Suffix for exit selectors.
     */
    private static readonly EXIT_SELECTOR_SUFFIX = ':exit';

    /**
     * Cached key for the current set of selectors.
     */
    private cachedIndexKey: string | null = null;

    /**
     * Caches the selector index to avoid rebuilding it on subsequent walks
     * if the selectors have not changed.
     */
    private cachedIndex: SelectorIndex | null = null;

    /**
     * Normalizes the given visitors object by splitting it into enter and exit visitors.
     *
     * @param visitors The visitors object to normalize.
     * @returns An object containing the enter and exit visitors.
     */
    private static normalizeVisitors(visitors: SelectorsWithVisitors): {
        enter: SelectorsWithVisitors;
        exit: SelectorsWithVisitors;
    } {
        const enter: SelectorsWithVisitors = {};
        const exit: SelectorsWithVisitors = {};

        for (const [rawSelector, fns] of Object.entries(visitors)) {
            const isExit = rawSelector.endsWith(LinterWalker.EXIT_SELECTOR_SUFFIX);
            const selector = isExit
                ? rawSelector.slice(0, -LinterWalker.EXIT_SELECTOR_SUFFIX.length).trim()
                : rawSelector.trim();

            const target = isExit ? exit : enter;
            (target[selector] ??= []).push(...fns);
        }

        return { enter, exit };
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
    private static buildIndex(selectors: SelectorsWithVisitors, typeKey: string): SelectorIndex {
        const result: SelectorIndex = {
            typeHandlers: new Map(),
            globalHandlers: [],
        };
        const { enter, exit } = LinterWalker.normalizeVisitors(selectors);
        const uniqueSelectors = new Set([...Object.keys(enter), ...Object.keys(exit)]);

        for (const raw of uniqueSelectors) {
            const ast = EsQueryUtils.parse(raw);
            const test = (node: AnyNode, ancestry?: AnyNode[]) => {
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

            const item: SelectorVisitorsHandler = {
                ast,
                test,
                visitorsEnter: enter[raw] ?? [],
                visitorsLeave: exit[raw] ?? [],
                candidateTypes,
            };

            if (!candidateTypes) {
                result.globalHandlers.push(item);
            } else {
                for (const t of candidateTypes) {
                    const arr = result.typeHandlers.get(t) ?? [];
                    arr.push(item);
                    result.typeHandlers.set(t, arr);
                }
            }
        }

        return result;
    }

    /**
     * Computes a key for the given selectors.
     * The key is a string that uniquely identifies the selectors.
     * It is used to cache the index of selectors.
     *
     * @param selectors The selectors to compute the key for.
     * @returns The computed key.
     */
    private static computeKey(selectors: SelectorsWithVisitors): string {
        const parts: string[] = [];
        const sortedKeys = Object.keys(selectors).sort();
        for (const key of sortedKeys) {
            const visitors = selectors[key] ?? [];
            parts.push(
                `${key}:${visitors.map((v) => v.toString().length).join(',')}`,
            );
        }
        return parts.join('|');
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
        root: AnyNode,
        selectors: SelectorsWithVisitors = {},
        childrenKey: string = 'children',
        typeKey: string = 'type',
        nodeTransformer?: (node: AnyNode) => AnyNode,
        initialAncestry?: AnyNode[],
    ): void {
        const currentKey = LinterWalker.computeKey(selectors);

        if (!this.cachedIndex || this.cachedIndexKey !== currentKey) {
            this.cachedIndex = LinterWalker.buildIndex(selectors, typeKey);
            this.cachedIndexKey = currentKey;
        }

        const index = this.cachedIndex;
        const ancestors: AnyNode[] = initialAncestry ?? [];

        const visit = (node: AnyNode, parent: AnyNode | null): void => {
            const nodeType = node[typeKey] as string | undefined;
            const candidatesTyped = nodeType ? index.typeHandlers.get(nodeType) : undefined;

            if (nodeTransformer) {
                // eslint-disable-next-line no-param-reassign
                node = nodeTransformer(node);
            }

            // ENTER phase
            if (candidatesTyped) {
                for (let i = 0; i < candidatesTyped.length; i += 1) {
                    const c = candidatesTyped[i]!;
                    if (c.test(node, ancestors)) {
                        c.visitorsEnter.forEach((visitor) => {
                            visitor(node, parent, ancestors);
                        });
                    }
                }
            }
            if (index.globalHandlers.length > 0) {
                for (let i = 0; i < index.globalHandlers.length; i += 1) {
                    const c = index.globalHandlers[i]!;
                    if (c.test(node, ancestors)) {
                        c.visitorsEnter.forEach((visitor) => {
                            visitor(node, parent, ancestors);
                        });
                    }
                }
            }

            // Traverse children
            ancestors.unshift(node);
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
            ancestors.shift();

            // LEAVE phase
            if (candidatesTyped) {
                for (let i = 0; i < candidatesTyped.length; i += 1) {
                    const c = candidatesTyped[i]!;
                    if (c.test(node, ancestors)) {
                        c.visitorsLeave.forEach((visitor) => {
                            visitor(node, parent, ancestors);
                        });
                    }
                }
            }
            if (index.globalHandlers.length > 0) {
                for (let i = 0; i < index.globalHandlers.length; i += 1) {
                    const c = index.globalHandlers[i]!;
                    if (c.test(node, ancestors)) {
                        c.visitorsLeave.forEach((visitor) => {
                            visitor(node, parent, ancestors);
                        });
                    }
                }
            }
        };

        const parent = ancestors.length > 0 ? ancestors[ancestors.length - 1]! : null;
        visit(root, parent);
    }
}
