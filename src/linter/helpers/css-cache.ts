import { CssTreeParsingContext, type CssTreeParsingContextToNode } from './css-tree-types';

/**
 * Possible values for the cache map.
 */
export type CssCacheValue<K extends CssTreeParsingContext> = CssTreeParsingContextToNode[K] | Error;

/**
 * Cache maps for CSS tree nodes. Key is the CSS tree parsing context and value is a map of CSS to node or error
 * (if parsing failed before).
 */
export type CssCacheMaps = {
    [K in CssTreeParsingContext]: Map<string, CssCacheValue<K>>;
};

/**
 * Cache for CSS tree nodes. We share the cache between all rules to avoid parsing the same CSS multiple times.
 * For errors, we cache the relative error position, so the error position can be calculated for any AGTree node.
 */
export class CssCache {
    /**
     * Internal cache maps.
     */
    private maps: CssCacheMaps;

    /**
     * Creates a new cache instance for CSS tree nodes.
     */
    constructor() {
        this.maps = Object.values(CssTreeParsingContext).reduce((acc, context) => {
            acc[context] = new Map();
            return acc;
        }, {} as CssCacheMaps);
    }

    /**
     * Gets entry from the cache.
     *
     * @param context The parsing context.
     * @param css The CSS string.
     *
     * @returns The CSS tree node / error or undefined if CSS string is not cached.
     */
    public get<K extends CssTreeParsingContext>(context: K, css: string): CssCacheValue<K> | undefined {
        return this.maps[context].get(css);
    }

    /**
     * Adds entry to the cache.
     *
     * @param context The parsing context.
     * @param css The CSS string.
     * @param node The CSS tree node / error.
     */
    public set<K extends CssTreeParsingContext>(context: K, css: string, node: CssCacheValue<K>): void {
        this.maps[context].set(css, node);
    }
}
