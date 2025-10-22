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

export class LinterVisitorCollection {
    private visitors: SelectorsWithVisitors;

    constructor() {
        this.visitors = {};
    }

    public addVisitor(selector: string, visitor: Visitor): void {
        const list = this.visitors[selector];
        if (list) {
            list.push(visitor);
        } else {
            this.visitors[selector] = [visitor];
        }
    }

    public addVisitors(entries: SelectorsWithVisitors): void {
        for (const [selector, entry] of Object.entries(entries)) {
            entry.forEach((visitor) => this.addVisitor(selector, visitor));
        }
    }

    public getVisitors(): SelectorsWithVisitors {
        return this.visitors;
    }
}
