import { type Node } from '@adguard/agtree';
import esquery from 'esquery';

import { deepFreeze } from '../../utils/deep-freeze';
import { getErrorMessage } from '../../utils/error';
import {
    DEFAULT_CHILD_KEYS,
    DEFAULT_TYPE_KEY,
    type LinterSubParsersConfig,
    type Parser,
} from '../config';

import { LinterSourceCodeError } from './error';
import { EsQueryUtils } from './esquery-utils';
import { type LinterSourceCode } from './source-code';
import { type OnParseError } from './types';
import { type AnyNode, type SelectorsWithVisitors, type Visitor } from './visitor-collection';
import { LinterWalker } from './walker';

/**
 * Represents a parsed sub-AST (Abstract Syntax Tree) that was produced by a sub-parser.
 * Each sub-AST extends the main AST by one additional level of structure.
 *
 * Sub-ASTs are used when the main parser (AGTree) cannot handle certain syntaxes,
 * and those sections are delegated to specialized sub-parsers (e.g., CSS, HTML, JS).
 */
type SubAst = {
    /**
     * The root AST node returned by the sub-parser.
     */
    ast: object;

    /**
     * The key name that identifies the node type within this sub-AST.
     * Typically corresponds to the property used by the parser to denote node kinds,
     * such as "type" in ESTree-like formats.
     */
    nodeTypeKey: string;

    /**
     * The key names used to access child nodes.
     * For example, ["children"], ["body"], or ["children", "comments"] for multiple keys.
     */
    childNodeKeys: string[];
};

/**
 * A specialized AST traversal engine that operates on a parsed source code instance.
 *
 * This class is responsible for performing a full, depth-first walk of the main AST
 * (provided by {@link LinterSourceCode}), invoking registered visitor callbacks for
 * matching selectors. In addition to standard traversal, it also supports *on-the-fly*
 * parsing and traversal of **sub-ASTs** — nested syntactic structures that require
 * specialized parsers.
 *
 * ### Core Features
 * - Performs depth-first traversal of the main AST, triggering `Enter` and `Leave` events.
 * - Supports CSS-like selectors (via `esquery`) for precise node matching.
 * - Can dynamically invoke **sub-parsers** when a node matches a configured selector,
 *   allowing the walker to descend into embedded syntaxes (e.g., CSS, HTML, JS).
 * - Automatically manages and caches sub-ASTs to avoid redundant parsing of the same node.
 * - Maintains parser-specific `LinterWalker` instances for efficient repeated traversals.
 *
 * ### How Sub-Parsing Works
 * Each registered sub-parser defines:
 * - A selector that identifies which nodes trigger the parser.
 * - A function that receives a text slice of the source and returns a new AST.
 * - Metadata describing the node and child property names within that sub-AST.
 *
 * When the walker encounters a node that matches a sub-parser’s selector during the
 * `Enter` phase, it extracts the relevant source range, invokes the sub-parser, and
 * recursively traverses the resulting sub-AST using the same visitor set.
 *
 * ### Typical Usage.
 * ```ts
 * const walker = new LinterSourceCodeWalker(sourceCode, subParsers);
 * walker.walk(visitors);
 * ```
 *
 * This design allows the linter to analyze code that embeds other languages
 * (for example, a CSS block inside HTML, or JavaScript within a template literal)
 * without requiring a single monolithic parser.
 *
 * @see LinterSourceCode
 * @see LinterWalker
 * @see Parser
 */
export class LinterSourceCodeWalker {
    /**
     * The universal selector used to match all nodes.
     */
    private static readonly UNIVERSAL_SELECTOR = '*';

    /**
     * The source code to walk.
     */
    private readonly sourceCode: LinterSourceCode;

    /**
     * Maps nodes to their corresponding parsers.
     */
    private readonly nodeParserMap = new WeakMap<AnyNode, Parser>();

    /**
     * Maps a character offset to a "sub-AST".
     * We parse the source code with AGTree, but we provide possibility to parse
     * some parts of the source code with other parsers.
     * This map stores the parsed results of these parts.
     * For example, AGTree does not parse CSS, but during linting we need to parse it,
     * so we use other parser for CSS and store the result here.
     */
    private readonly subAsts: WeakMap<AnyNode, SubAst[]>;

    /**
     * List of all sub-ASTs.
     */
    private readonly subAstList: SubAst[];

    /**
     * Maps candidate node types to their corresponding sub-parsers and selectors.
     */
    private readonly subSelectorsByType = new Map<string, [Parser, esquery.Selector][]>();

    /**
     * List of sub-parsers that match any node type.
     */
    private readonly universalSubSelectors: [Parser, esquery.Selector][] = [];

    /**
     * Callback function to be called when a parse error occurs.
     */
    private readonly onParseError?: OnParseError;

    /**
     * Creates an instance of LinterSourceCodeWalker.
     *
     * @param sourceCode The source code to walk.
     * @param subParsers Sub-parsers to use for parsing specific parts of the source code.
     * @param onParseError Callback function to be called when a parse error occurs.
     */
    constructor(
        sourceCode: LinterSourceCode,
        subParsers: LinterSubParsersConfig,
        onParseError?: OnParseError,
    ) {
        this.sourceCode = sourceCode;
        this.subAsts = new WeakMap();
        this.subAstList = [];
        this.onParseError = onParseError;

        for (const [selector, parser] of Object.entries(subParsers)) {
            const selectorNode = EsQueryUtils.parse(selector);
            const candidateTypes = EsQueryUtils.getCandidateTypes(selectorNode);

            if (candidateTypes) {
                for (const t of candidateTypes) {
                    const arr = this.subSelectorsByType.get(t) ?? [];
                    arr.push([parser, selectorNode]);
                    this.subSelectorsByType.set(t, arr);
                }
            } else {
                this.universalSubSelectors.push([parser, selectorNode]);
            }
        }
    }

    /**
     * Returns the parser associated with the given node, if any.
     *
     * @param node The node to query.
     *
     * @returns The parser associated with the node, or null if none is found.
     */
    public getParser(node: AnyNode): Parser | null {
        return this.nodeParserMap.get(node) ?? null;
    }

    /**
     * Walks the main AGTree AST and, on-the-fly, parses and walks **one extra level**
     * of sub-ASTs using registered sub-parsers whenever their selectors match.
     *
     * @param selectors A map of AST selectors to visitor callbacks.
     * These selectors are applied both to the main AST and any sub-ASTs produced by sub-parsers.
     */
    public walk(selectors: SelectorsWithVisitors): void {
        const ast = this.sourceCode.getAst();
        const mainWalker = new LinterWalker();
        const perParserWalkers = new WeakMap<Parser, LinterWalker>();

        // Ensures we parse each (hostNode × parserNamespace) at most once.
        // WeakMap keeps memory usage bounded as nodes are GC'ed.
        const parsedOnce = new WeakMap<AnyNode, Set<Parser>>();

        /**
         * Parses a sub-AST for the given host node with the given parser (once),
         * registers it, and immediately walks it with the same user selectors.
         *
         * @param hostNode The host node to parse.
         * @param ancestry The ancestry of the host node.
         * @param parser The parser to use for parsing the sub-AST.
         */
        const parseAndWalkSub = (hostNode: AnyNode, ancestry: AnyNode[], parser: Parser): void => {
            // Idempotency guard: one parse per (host node × parser namespace)
            let seen = parsedOnce.get(hostNode);

            if (!seen) {
                seen = new Set();
                parsedOnce.set(hostNode, seen);
            }

            if (seen.has(parser)) {
                // Already parsed for this host node and parser
                return;
            }

            const agNode = hostNode as unknown as Node;
            const start = agNode.start ?? null;
            const end = agNode.end ?? null;

            if (start === null || end === null || start >= end) {
                // Nothing to parse (invalid or empty range)
                return;
            }

            const slice = this.sourceCode.getSlicedPart(start, end);

            try {
                let subAstObj;
                try {
                    const lineNumber = this.sourceCode.getLineNumberForOffset(start) ?? 0;
                    const lineStartOffset = this.sourceCode.getLineStartOffsetByLine(lineNumber) ?? 0;
                    subAstObj = parser.parse(
                        slice,
                        start,
                        lineNumber,
                        lineStartOffset,
                    );
                } catch (e) {
                    if (this.onParseError) {
                        let message = 'Failed to parse sub-AST';

                        if (parser.name) {
                            message += ` with '${parser.name}'`;
                        }

                        message += `, got error: ${getErrorMessage(e)}`;

                        this.onParseError(
                            new LinterSourceCodeError(
                                message,
                                this.sourceCode.getLinterPositionRangeFromOffsetRange([
                                    start,
                                    end,
                                ])!,
                            ),
                        );
                        throw e;
                    }
                }

                // Freeze the sub-AST to prevent accidental mutations
                const frozenSubAst = deepFreeze(subAstObj);

                const sub: SubAst = {
                    ast: frozenSubAst,
                    nodeTypeKey: parser.nodeTypeKey,
                    childNodeKeys: parser.childNodeKeys,
                };

                // Keep per-host list and a global flat list (useful for diagnostics).
                const list = this.subAsts.get(hostNode) ?? [];
                list.push(sub);
                this.subAsts.set(hostNode, list);
                this.subAstList.push(sub);
                seen.add(parser);

                // Obtain (or create) a dedicated walker for this parser namespace
                // Reusing it avoids rebuilding selector indexes across many sub-ASTs.
                let walker = perParserWalkers.get(parser);
                if (!walker) {
                    walker = new LinterWalker();
                    perParserWalkers.set(parser, walker);
                }

                walker.walk(
                    sub.ast as AnyNode,
                    selectors,
                    parser.childNodeKeys,
                    parser.nodeTypeKey,
                    [...ancestry, hostNode],
                    (node) => {
                        this.nodeParserMap.set(node, parser);
                    },
                );
            } catch {
                // Do nothing
            }
        };

        /**
         * Internal “*” visitor that runs on **Enter** and decides whether to sub-parse the current node.
         * Uses type-indexed selector candidates for efficiency, then falls back to universal selectors.
         *
         * @param node The node to visit.
         * @param _parent The parent node of the node to visit.
         * @param ancestry The ancestry of the node to visit.
         */
        const internalStar: Visitor = (node, _parent, ancestry) => {
            // This visitor always runs on "enter" phase implicitly.
            // LinterWalker already filters ":exit" visitors separately.
            const nodeType = (node as any).type as string | undefined;

            const byType = nodeType ? this.subSelectorsByType.get(nodeType) : undefined;
            const candidates: Array<[Parser, esquery.Selector]> = [
                ...(byType ?? []),
                ...this.universalSubSelectors,
            ];

            if (candidates.length === 0) {
                return;
            }

            for (let i = 0; i < candidates.length; i += 1) {
                const [parser, selectorAst] = candidates[i]!;
                if (
                    esquery.matches(node as any, selectorAst as any, ancestry as any, {
                        nodeTypeKey: 'type',
                    })
                ) {
                    parseAndWalkSub(node, ancestry, parser);
                }
            }
        };

        // If the user already provided a "*" visitor, chain it before our internal handler
        // to preserve user semantics and still enable sub-parsing.
        const userStar = selectors[LinterSourceCodeWalker.UNIVERSAL_SELECTOR];
        const combined: SelectorsWithVisitors = { ...selectors };
        combined[LinterSourceCodeWalker.UNIVERSAL_SELECTOR] = userStar
            ? [
                (node, parent, ancestry) => {
                    userStar.forEach((visitor) => visitor(node, parent, ancestry));
                },
                internalStar,
            ]
            : [internalStar];

        // Kick off traversal over the main AST.
        // childrenKey = 'children', typeKey = 'type' are AGTree defaults.
        mainWalker.walk(
            ast as unknown as AnyNode,
            combined,
            DEFAULT_CHILD_KEYS,
            DEFAULT_TYPE_KEY,
        );
    }
}
