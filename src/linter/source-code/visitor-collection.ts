import * as v from 'valibot';

export const anyNodeSchema = v.any();

export type AnyNode = v.InferOutput<typeof anyNodeSchema>;

/**
 * A function that is called for each node that matches a selector.
 *
 * @param node The node that is being visited.
 * @param parent The parent of the node, or `null` if it is the root.
 * @param ancestry An array of the node's ancestors, from the root to the parent.
 */
export type Visitor = (
    node: AnyNode,
    parent: AnyNode | null,
    ancestry: AnyNode[],
) => void;

export type SelectorsWithVisitors = Record<string, Visitor[]>;

/**
 * Manages a collection of AST visitors organized by CSS-like selectors.
 *
 * Rules register their visitors with this collection, which are later
 * retrieved and passed to the AST walker for traversal.
 *
 * @example
 * ```typescript
 * const collection = new LinterVisitorCollection();
 * collection.addVisitor('NetworkRule', (node) => { ... });
 * collection.addVisitor('CosmeticRule', (node) => { ... });
 * const allVisitors = collection.getVisitors();
 * ```
 */
export class LinterVisitorCollection {
    /**
     * Map of selectors to their visitor functions.
     */
    private visitors: SelectorsWithVisitors;

    /**
     * Creates a new visitor collection.
     */
    constructor() {
        this.visitors = {};
    }

    /**
     * Registers a visitor function for a specific selector.
     *
     * Multiple visitors can be registered for the same selector.
     * They will all be called when a matching node is encountered.
     *
     * @param selector - CSS-like selector string (e.g., 'NetworkRule', 'CssInjectionRuleBody > Value')
     * @param visitor - Function to call when the selector matches
     *
     * @example
     * ```typescript
     * collection.addVisitor('NetworkRule', (node, parent, ancestry) => {
     *   console.log('Found network rule:', node);
     * });
     * ```
     */
    public addVisitor(selector: string, visitor: Visitor): void {
        const list = this.visitors[selector];
        if (list) {
            list.push(visitor);
        } else {
            this.visitors[selector] = [visitor];
        }
    }

    /**
     * Registers multiple visitors at once.
     *
     * @param entries - Object mapping selectors to arrays of visitor functions
     *
     * @example
     * ```typescript
     * collection.addVisitors({
     *   'NetworkRule': [(node) => { ... }],
     *   'CosmeticRule': [(node) => { ... }]
     * });
     * ```
     */
    public addVisitors(entries: SelectorsWithVisitors): void {
        for (const [selector, entry] of Object.entries(entries)) {
            entry.forEach((visitor) => this.addVisitor(selector, visitor));
        }
    }

    /**
     * Returns all registered visitors.
     *
     * @returns Object mapping selectors to their visitor functions
     */
    public getVisitors(): SelectorsWithVisitors {
        return this.visitors;
    }
}
