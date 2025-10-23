import { AdblockSyntaxError, type FilterList, FilterListParser } from '@adguard/agtree';
import { defaultParserOptions } from '@adguard/agtree/parser';
import * as v from 'valibot';

import { CR, FF, LF } from '../../common/constants';

import { LinterSourceCodeError } from './error';
import { type OnParseError } from './types';

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

export const linterPositionSchema = v.object({
    /**
     * 1-based line number.
     */
    line: v.number(),
    /**
     * 0-based column number.
     */
    column: v.number(),
});

/**
 * Represents a position in the source code.
 */
export type LinterPosition = v.InferOutput<typeof linterPositionSchema>;

export const linterPositionRangeSchema = v.object({
    /**
     * Start position.
     */
    start: linterPositionSchema,
    /**
     * End position.
     */
    end: linterPositionSchema,
});

/**
 * Represents the location of a problem that detected by the linter.
 */
export type LinterPositionRange = v.InferOutput<typeof linterPositionRangeSchema>;

export const linterOffsetRangeSchema = v.tuple([v.number(), v.number()]);

/**
 * Represents a range of character offsets.
 * First element is the start offset, second is the end offset.
 */
export type LinterOffsetRange = v.InferOutput<typeof linterOffsetRangeSchema>;

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
     * Line meta information.
     */
    private readonly lineMeta: LineMeta;

    private readonly onParseError?: OnParseError;

    /**
     * Creates an instance of LinterSourceCode.
     *
     * @param source The source code as a string.
     * @param subParsers Sub-parsers to use for parsing specific parts of the source code.
     */
    constructor(source: string, onParseError?: OnParseError) {
        this.source = source;
        this.onParseError = onParseError;

        this.lineMeta = LinterSourceCode.computeLineMetadata(this.source);

        this.ast = FilterListParser.parse(this.source, {
            ...defaultParserOptions,
            tolerant: true,
            onParseError: (error: unknown) => {
                if (!this.onParseError) {
                    return;
                }

                if (error instanceof AdblockSyntaxError) {
                    this.onParseError(new LinterSourceCodeError(
                        error.message,
                        this.getLinterPositionRangeFromOffsetRange([
                            error.start,
                            error.end,
                        ])!,
                    ));
                    return;
                }

                this.onParseError(error);
            },
        });
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

    public getLineStartOffsetByLine(line: number): number | null {
        const zeroBasedLine = line - 1;

        if (!this.isLineValid(zeroBasedLine)) {
            return null;
        }

        return this.lineMeta.lineStartOffsets[zeroBasedLine] ?? null;
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
        return offset >= 0 && offset <= this.source.length;
    }

    /**
     * Determines whether the given line is valid.
     *
     * @param zeroBasedLine The zero-based line index.
     *
     * @returns True if the line is valid, false otherwise.
     */
    private isLineValid(zeroBasedLine: number): boolean {
        return zeroBasedLine >= 0 && zeroBasedLine <= this.lineMeta.lineStartOffsets.length;
    }

    /**
     * Determines whether the given range of offsets is valid.
     *
     * @param range A tuple containing the start and end offsets.
     *
     * @returns True if the range is valid, false otherwise.
     */
    public isRangeValid(range: LinterOffsetRange): boolean {
        const [start, end] = range;
        return this.isOffsetValid(start) && this.isOffsetValid(end) && start <= end;
    }

    /**
     * Gets the linting position (line/column) for a given range of offsets.
     *
     * @param range A tuple containing the start and end offsets.
     *
     * @returns A LinterPosition object, or null if the range is invalid.
     */
    public getLinterPositionRangeFromOffsetRange(range: LinterOffsetRange): LinterPositionRange | null {
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

    /**
     * Gets the sliced part of the source code.
     *
     * @param start The starting offset.
     * @param end The ending offset.
     *
     * @returns The sliced part of the source code.
     */
    public getSlicedPart(start?: number, end?: number): string {
        return this.source.slice(start, end);
    }

    /**
     * Finds the next unescaped character in the source code.
     *
     * @param start The starting offset.
     * @param char The character to find.
     * @param end The ending offset to stop searching at (optional).
     *
     * @returns The offset of the next unescaped character, or null if not found.
     */
    public findNextUnescapedChar(start: number, char: string, end?: number): number | null {
        for (let i = start; i < (end ?? this.source.length); i += 1) {
            if (this.source[i] === char) {
                return i;
            }
        }

        return null;
    }

    /**
     * Finds the previous unescaped character in the source code.
     *
     * @param start The starting offset.
     * @param char The character to find.
     * @param end The ending offset to stop searching at (optional).
     *
     * @returns The offset of the previous unescaped character, or null if not found.
     */
    public findPreviousUnescapedChar(start: number, char: string, end?: number): number | null {
        for (let i = start; i >= (end ?? 0); i -= 1) {
            if (this.source[i] === char) {
                return i;
            }
        }

        return null;
    }
}
