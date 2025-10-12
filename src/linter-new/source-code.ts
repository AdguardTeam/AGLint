import { type FilterList, FilterListParser, type Node } from '@adguard/agtree';
import { defaultParserOptions } from '@adguard/agtree/parser';
import esquery from 'esquery';

import { CR, FF, LF } from '../common/constants';
import { isUndefined } from '../utils/type-guards';

import { EsQueryUtils } from './esquery-utils';
import {
    type AnyObject,
    LinterWalker,
    type Visitor,
    VisitorEvent,
} from './walker';

/**
 * Enum representing the types of line breaks.
 */
export enum LineBreakType {
    /**
     * Line feed (\n)
     */
    LineFeed,

    /**
     * Carriage return (\r)
     */
    CarriageReturn,

    /**
     * Carriage return line feed (\r\n)
     */
    CarriageReturnLineFeed,
}

/**
 * Represents the location of a problem that detected by the linter.
 */
export interface LinterPositionRange {
    /**
     * Start position.
     */
    start: LinterPosition;

    /**
     * End position.
     */
    end: LinterPosition;
}

/**
 * Represents a position in the source code.
 */
export interface LinterPosition {
    /**
     * 1-based line number.
     */
    line: number;

    /**
     * 0-based column number.
     */
    column: number;
}

/**
 * Represents a range of character offsets.
 * First element is the start offset, second is the end offset.
 */
export type OffsetRange = [number, number];

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
     * The key name used to access an array of child nodes.
     * For example, "children" or "body".
     */
    childNodeKey: string;
};

/**
 * Defines the signature of a sub-parser function.
 * A sub-parser takes a source code slice and contextual offset information,
 * and returns an AST object representing the parsed structure.
 *
 * @param source The portion of source code to parse.
 * @param offset The absolute start offset of the source slice in the original file.
 * @param line The zero-based line number corresponding to the slice start position.
 * @param lineStartOffset The absolute offset of the line start that contains the slice start.
 * @returns The parsed AST object.
 */
type ParseFunction = (
    source: string,
    offset: number,
    line: number,
    lineStartOffset: number
) => object;

/**
 * Retrieves a character offset (either start or end) from a given AST node.
 *
 * Used by sub-parsers to determine which portion of the main source
 * corresponds to a particular node.
 *
 * @param node The AST node from which to extract the offset.
 * @returns The absolute character offset within the source code.
 */
type GetOffsetFromNode = (node: Node) => number;

/**
 * Defines a sub-parser configuration, which describes how a specific parser
 * should process a subset of the main AST.
 *
 * Each parser is associated with a unique `namespace` and is invoked
 * when a node matches a registered selector.
 */
interface Parser {
    /**
     * Optional human-readable name of the parser.
     * Used primarily for debugging and logging.
     */
    name?: string;

    /**
     * Unique identifier for this parser instance.
     * Prevents duplicate parser registrations and enables caching.
     */
    namespace: string;

    /**
     * The function used to parse a given source slice into a sub-AST.
     */
    parse: ParseFunction;

    /**
     * The key used to identify node types within the sub-AST.
     * For example, "type" for ESTree-like ASTs.
     */
    nodeTypeKey: string;

    /**
     * The key used to access arrays of child nodes within the sub-AST.
     * For example, "children" or "body".
     */
    childNodeKey: string;

    /**
     * Optional function that returns the start offset of a node in the main source.
     * Used to determine the slice of code passed to the sub-parser.
     */
    getStartOffset?: GetOffsetFromNode;

    /**
     * Optional function that returns the end offset of a node in the main source.
     * Used to determine the slice of code passed to the sub-parser.
     */
    getEndOffset?: GetOffsetFromNode;

    /**
     * Optional transformer applied to each node of the sub-AST before traversal.
     * Useful for normalizing node shapes or adding metadata.
     *
     * @param node The node to transform.
     * @returns The transformed node object.
     */
    nodeTransformer?: (node: any) => any;
}

/**
 * Map of sub-parsers.
 *
 * Key is a selector for the rule that uses this sub-parser,
 * Value is a function that parses the source code.
 */
type SubParsers = Map<string, Parser>;

/**
 * Metadata about the source code's line structure.
 */
interface LineMeta {
    /**
     * Maps a character offset to a line number.
     */
    offsetToLine: number[];

    /**
     * Maps a line number to the starting character offset of that line.
     */
    lineStartOffsets: number[];

    /**
     * Stores the type of line breaks for each line.
     */
    linebreakTypes: LineBreakType[];
}

/**
 * A class representing the source code being linted, providing utilities for working with
 * its text, AST, and line/column position conversions.
 */
export class LinterSourceCode {
    /**
     * The raw source code as a string.
     */
    private readonly source: string;

    /**
     * The abstract syntax tree (AST) representation of the source code.
     * This is the main AST, parsed with AGTree.
     */
    private readonly ast: FilterList;

    /**
     * Maps a character offset to a "sub-AST".
     * We parse the source code with AGTree, but we provide possibility to parse
     * some parts of the source code with other parsers.
     * This map stores the parsed results of these parts.
     * For example, AGTree does not parse CSS, but during linting we need to parse it,
     * so we use other parser for CSS and store the result here.
     */
    private readonly subAsts: WeakMap<AnyObject, SubAst[]>;

    /**
     * List of all sub-ASTs.
     */
    private readonly subAstList: SubAst[];

    /**
     * Line meta information.
     */
    private readonly lineMeta: LineMeta;

    /**
     * Sub-parsers used for parsing specific parts of the source code.
     */
    private readonly subParsers: SubParsers;

    /**
     * Maps candidate node types to their corresponding sub-parsers and selectors.
     */
    private readonly subSelectorsByType = new Map<string, [Parser, esquery.Selector][]>();

    /**
     * List of sub-parsers that match any node type.
     */
    private readonly universalSubSelectors: [Parser, esquery.Selector][] = [];

    /**
     * Creates an instance of LinterSourceCode.
     *
     * @param source The source code as a string.
     * @param subParsers Sub-parsers to use for parsing specific parts of the source code.
     */
    constructor(source: string, subParsers: SubParsers) {
        this.source = source;
        this.subParsers = new Map();

        for (const [selector, parser] of subParsers.entries()) {
            if (subParsers.has(parser.namespace)) {
                throw new Error(`Sub-parser namespace ${parser.namespace} is already registered`);
            }

            this.subParsers.set(parser.namespace, parser);

            const selectorNode = EsQueryUtils.parse(selector);
            const candidateTypes = EsQueryUtils.getCandidateTypes(selectorNode);

            if (candidateTypes) {
                for (const candidateType of candidateTypes) {
                    const arr = this.subSelectorsByType.get(candidateType) ?? [];
                    arr.push([parser, selectorNode]);
                    this.subSelectorsByType.set(candidateType, arr);
                }
            } else {
                this.universalSubSelectors.push([parser, selectorNode]);
            }
        }

        this.subAsts = new WeakMap();
        this.subAstList = [];

        this.ast = FilterListParser.parse(this.source, {
            ...defaultParserOptions,
            tolerant: true,
        });

        this.lineMeta = LinterSourceCode.computeLineMetadata(this.source);
    }

    /**
     * Walks the main AGTree AST and, on-the-fly, parses and walks **one extra level**
     * of sub-ASTs using registered sub-parsers whenever their selectors match.
     *
     * @param selectors A map of AST selectors to visitor callbacks.
     * These selectors are applied both to the main AST and any sub-ASTs produced by sub-parsers.
     */
    public walk(selectors: Record<string, Visitor>): void {
        const mainWalker = new LinterWalker();
        const perParserWalkers = new Map<string, LinterWalker>();

        // Ensures we parse each (hostNode × parserNamespace) at most once.
        // WeakMap keeps memory usage bounded as nodes are GC'ed.
        const parsedOnce = new WeakMap<AnyObject, Set<string>>();

        /**
         * Parses a sub-AST for the given host node with the given parser (once),
         * registers it, and immediately walks it with the same user selectors.
         */
        const parseAndWalkSub = (hostNode: AnyObject, ancestry: AnyObject[], parser: Parser): void => {
            // Idempotency guard: one parse per (host node × parser namespace)
            let seen = parsedOnce.get(hostNode);

            if (!seen) {
                seen = new Set();
                parsedOnce.set(hostNode, seen);
            }

            if (seen.has(parser.namespace)) {
                // Already parsed for this host node and parser
                return;
            }

            const agNode = hostNode as unknown as Node;
            const start = parser.getStartOffset ? parser.getStartOffset(agNode) : (agNode.start ?? null);
            const end = parser.getEndOffset ? parser.getEndOffset(agNode) : (agNode.end ?? null);

            if (start === null || end === null || start >= end) {
                // Nothing to parse (invalid or empty range)
                return;
            }

            const slice = this.source.slice(start, end);

            const subAstObj = parser.parse(
                slice,
                start,
                this.lineMeta.offsetToLine[start] ?? 0,
                this.lineMeta.lineStartOffsets[start] ?? 0,
            );

            const sub: SubAst = {
                ast: subAstObj,
                nodeTypeKey: parser.nodeTypeKey,
                childNodeKey: parser.childNodeKey,
            };

            // Keep per-host list and a global flat list (useful for diagnostics).
            const list = this.subAsts.get(hostNode) ?? [];
            list.push(sub);
            this.subAsts.set(hostNode, list);
            this.subAstList.push(sub);
            seen.add(parser.namespace);

            // Obtain (or create) a dedicated walker for this parser namespace
            // Reusing it avoids rebuilding selector indexes across many sub-ASTs.
            let walker = perParserWalkers.get(parser.namespace);
            if (!walker) {
                walker = new LinterWalker();
                perParserWalkers.set(parser.namespace, walker);
            }

            walker.walk(
                sub.ast as AnyObject,
                selectors,
                parser.childNodeKey,
                parser.nodeTypeKey,
                parser.nodeTransformer,
                [...ancestry, hostNode],
            );
        };

        /**
         * Internal “*” visitor that runs on **Enter** and decides whether to sub-parse the current node.
         * Uses type-indexed selector candidates for efficiency, then falls back to universal selectors.
         */
        const internalStar: Visitor = (node, _parent, ancestry, event) => {
            if (event !== VisitorEvent.Enter) return; // Only trigger sub-parsing on Enter

            // Resolve node type (AGTree uses 'type' by convention).
            const nodeType = (node as any).type as string | undefined;

            // Narrow down potential sub-parser selectors by node type, plus global fallbacks.
            const byType = nodeType ? this.subSelectorsByType.get(nodeType) : undefined;
            const candidates: Array<[Parser, esquery.Selector]> = [
                ...(byType ?? []),
                ...this.universalSubSelectors,
            ];

            if (candidates.length === 0) {
                return;
            }

            // Precise match check for each (parser, selectorAST) candidate.
            // We pass { nodeTypeKey: 'type' } to align esquery with our node shape.
            for (let i = 0; i < candidates.length; i += 1) {
                const [parser, selectorAst] = candidates[i]!;

                if (esquery.matches(node as any, selectorAst as any, ancestry as any, {
                    nodeTypeKey: 'type',
                })) {
                    parseAndWalkSub(node, ancestry, parser);
                }
            }
        };

        // If the user already provided a "*" visitor, chain it before our internal handler
        // to preserve user semantics and still enable sub-parsing.
        const userStar = selectors['*'];
        const combined: Record<string, Visitor> = { ...selectors };
        combined['*'] = userStar
            ? (node, parent, ancestry, event) => {
                userStar(node, parent, ancestry, event);
                internalStar(node, parent, ancestry, event);
            }
            : internalStar;

        // Kick off traversal over the main AST.
        // childrenKey = 'children', typeKey = 'type' are AGTree defaults.
        mainWalker.walk(this.ast as unknown as AnyObject, combined, 'children', 'type');
    }

    /**
     * Processes the source code to populate offset-to-line mapping, line start offsets,
     * and linebreak types.
     *
     * @param source The source code as a string.
     */
    private static computeLineMetadata(source: string): LineMeta {
        const offsetToLine: number[] = [];
        const lineStartOffsets = [0];
        const linebreakTypes: LineBreakType[] = [];

        let currentLine = 0;

        for (let i = 0; i < source.length; i += 1) {
            offsetToLine[i] = currentLine;
            const ch = source[i];
            if (ch === LF || ch === FF || ch === CR) {
                if (ch === CR && source[i + 1] === LF) {
                    linebreakTypes[currentLine] = LineBreakType.CarriageReturnLineFeed;
                    i += 1;
                } else if (ch === CR) {
                    linebreakTypes[currentLine] = LineBreakType.CarriageReturn;
                } else {
                    linebreakTypes[currentLine] = LineBreakType.LineFeed;
                }
                currentLine += 1;
                lineStartOffsets[currentLine] = i + 1;
            }
        }

        offsetToLine[source.length] = currentLine;

        return {
            offsetToLine,
            lineStartOffsets,
            linebreakTypes,
        };
    }

    /**
     * Retrieves the raw source code as a string.
     *
     * @returns The source code string.
     */
    public getText(): string {
        return this.source;
    }

    /**
     * Retrieves the abstract syntax tree (AST) of the source code.
     *
     * @returns The AST of the source code.
     */
    public getAst(): FilterList {
        return this.ast;
    }

    /**
     * Converts a character offset to a line and column position.
     *
     * @param offset The zero-based character offset in the source code.
     *
     * @returns A Position object containing the 1-based line and 0-based column number,
     * or null if the offset is out of range.
     */
    public getPositionFromOffset(offset: number): LinterPosition | null {
        if (!this.isOffsetValid(offset)) {
            return null;
        }

        const line = this.lineMeta.offsetToLine[offset];

        if (line === undefined) {
            return null;
        }

        const lineStartOffset = this.lineMeta.lineStartOffsets[line];

        if (lineStartOffset === undefined) {
            return null;
        }

        return {
            line: line + 1,
            column: offset - lineStartOffset,
        };
    }

    /**
     * Converts a line and column position to a character offset.
     *
     * @param position The position in the source code.
     *
     * @returns The zero-based character offset, or null if the position is invalid.
     */
    public getOffsetFromPosition(position: LinterPosition): number | null {
        const { line, column } = position;
        const zeroBasedLine = line - 1;

        if (!this.isLineValid(zeroBasedLine)) {
            return null;
        }

        const lineStartOffset = this.lineMeta.lineStartOffsets[zeroBasedLine];
        // eslint-disable-next-line max-len
        const nextLineStartOffset = this.lineMeta.lineStartOffsets[zeroBasedLine + 1] ?? this.lineMeta.offsetToLine.length;

        if (lineStartOffset === undefined || nextLineStartOffset === undefined) {
            return null;
        }

        const offset = lineStartOffset + column;

        if (offset < lineStartOffset || offset >= nextLineStartOffset) {
            return null;
        }

        return offset;
    }

    /**
     * Gets the 1-based line number for a given character offset.
     *
     * @param offset The zero-based character offset.
     *
     * @returns The 1-based line number, or null if the offset is out of range.
     */
    public getLineNumberForOffset(offset: number): number | null {
        if (!this.isOffsetValid(offset)) {
            return null;
        }

        const line = this.lineMeta.offsetToLine[offset];

        if (line === undefined) {
            return null;
        }

        return line + 1;
    }

    /**
     * Gets the character range for a specific line number.
     *
     * @param lineNumber The 1-based line number.
     * @param includeNewlines Whether to include newline characters in the range.
     *
     * @returns A tuple containing the start and end offsets, or null if the line number is invalid.
     */
    public getLineRange(lineNumber: number, includeNewlines: boolean): [number, number] | null {
        const zeroBasedLine = lineNumber - 1;

        if (!this.isLineValid(zeroBasedLine)) {
            return null;
        }

        const startOffset = this.lineMeta.lineStartOffsets[zeroBasedLine];

        if (startOffset === undefined) {
            return null;
        }

        let endOffset: number | undefined;

        if (this.lineMeta.lineStartOffsets[zeroBasedLine + 1] !== undefined) {
            endOffset = this.lineMeta.lineStartOffsets[zeroBasedLine + 1];

            if (endOffset === undefined) {
                return null;
            }

            if (!includeNewlines) {
                if (this.lineMeta.linebreakTypes[zeroBasedLine] === LineBreakType.CarriageReturnLineFeed) {
                    endOffset -= 2;
                } else {
                    endOffset -= 1;
                }
            }
        } else {
            endOffset = this.source.length;
        }

        return [startOffset, endOffset];
    }

    /**
     * Gets the content of a specific line.
     *
     * @param lineNumber The 1-based line number.
     *
     * @returns The line content as a string, or null if the line number is invalid.
     */
    public getLine(lineNumber: number): string | null {
        const range = this.getLineRange(lineNumber, false);

        if (range === null) {
            return null;
        }

        return this.source.slice(range[0], range[1]);
    }

    /**
     * Gets the type of line break used at a specific line.
     *
     * @param lineNumber The 1-based line number.
     *
     * @returns The LineBreakType enum value, or null if the line number is invalid.
     */
    public getLinebreakType(lineNumber: number): LineBreakType | null {
        const zeroBasedLine = lineNumber - 1;

        if (!this.isLineValid(zeroBasedLine)) {
            return null;
        }

        const linebreakType = this.lineMeta.linebreakTypes[zeroBasedLine];

        if (linebreakType === undefined) {
            return null;
        }

        return linebreakType;
    }

    /**
     * Gets the line break used at a specific line.
     *
     * @param lineNumber The 1-based line number.
     * @param fallback The fallback line break to use if the line number is invalid.
     *
     * @returns The line break as a string.
     */
    public getLineBreak(lineNumber: number, fallback = LF): string {
        const type = this.getLinebreakType(lineNumber);

        switch (type) {
            case LineBreakType.LineFeed:
                return LF;

            case LineBreakType.CarriageReturn:
                return CR;

            case LineBreakType.CarriageReturnLineFeed:
                return CR + LF;

            default:
                return fallback;
        }
    }

    /**
     * Gets the dominant line break used in the source code.
     *
     * @returns The dominant line break as a string.
     */
    public getDominantLineBreak(): string {
        let lineFeedCount = 0;
        let carriageReturnCount = 0;
        let crlfCount = 0;

        for (let i = 0; i < this.lineMeta.linebreakTypes.length; i += 1) {
            const linebreakType = this.lineMeta.linebreakTypes[i];

            if (linebreakType === LineBreakType.LineFeed) {
                lineFeedCount += 1;
            } else if (linebreakType === LineBreakType.CarriageReturn) {
                carriageReturnCount += 1;
            } else if (linebreakType === LineBreakType.CarriageReturnLineFeed) {
                crlfCount += 1;
            }
        }

        if (lineFeedCount > carriageReturnCount && lineFeedCount > crlfCount) {
            return LF;
        }

        if (carriageReturnCount > lineFeedCount && carriageReturnCount > crlfCount) {
            return CR;
        }

        return CR + LF;
    }

    /**
     * Determines whether the given offset is valid in the source code.
     *
     * @param offset The zero-based character offset.
     *
     * @returns True if the offset is valid, false otherwise.
     */
    public isOffsetValid(offset: number): boolean {
        return offset >= 0 && offset < this.source.length;
    }

    /**
     * Determines whether the given line is valid.
     *
     * @param zeroBasedLine The zero-based line index.
     *
     * @returns True if the line is valid, false otherwise.
     */
    private isLineValid(zeroBasedLine: number): boolean {
        return zeroBasedLine >= 0 && zeroBasedLine < this.lineMeta.lineStartOffsets.length - 1;
    }

    /**
     * Determines whether the given range of offsets is valid.
     *
     * @param range A tuple containing the start and end offsets.
     *
     * @returns True if the range is valid, false otherwise.
     */
    public isRangeValid(range: OffsetRange): boolean {
        const [start, end] = range;
        return this.isOffsetValid(start) && this.isOffsetValid(end) && start <= end;
    }

    /**
     * Gets the offset range for a given AST node.
     *
     * @param node The AST node.
     *
     * @returns A tuple containing the start and end offsets of the node, or null if invalid.
     */
    public static getOffsetRangeFromNode(node: Node): OffsetRange | null {
        if (isUndefined(node.start) || isUndefined(node.end)) {
            return null;
        }

        return [node.start, node.end];
    }

    /**
     * Gets the linting position (line/column) for a given AST node.
     *
     * @param node The AST node.
     *
     * @returns A LinterPosition object, or null if the node is invalid.
     */
    public getLinterPositionRangeFromNode(node: Node): LinterPositionRange | null {
        const range = LinterSourceCode.getOffsetRangeFromNode(node);

        if (range === null) {
            return null;
        }

        return this.getLinterPositionRangeFromOffsetRange(range);
    }

    /**
     * Gets the linting position (line/column) for a given range of offsets.
     *
     * @param range A tuple containing the start and end offsets.
     *
     * @returns A LinterPosition object, or null if the range is invalid.
     */
    public getLinterPositionRangeFromOffsetRange(range: OffsetRange): LinterPositionRange | null {
        const start = this.getPositionFromOffset(range[0]);
        const end = this.getPositionFromOffset(range[1]);

        if (start === null || end === null) {
            return null;
        }

        return {
            start,
            end,
        };
    }
}
