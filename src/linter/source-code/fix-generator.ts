/* eslint-disable max-classes-per-file */
// Inspired by https://github.com/eslint/eslint/blob/e84e6e269c4aefc84952e17a1f967697b02b7ad2/lib/linter/rule-fixer.js
import * as v from 'valibot';

import { EMPTY } from '../../common/constants';
import { isNull } from '../../utils/type-guards';

import { type LinterOffsetRange, linterOffsetRangeSchema, type LinterSourceCode } from './source-code';

export const linterFixCommandSchema = v.object({
    /**
     * The range of offsets in the source code where the fix should be applied.
     */
    range: linterOffsetRangeSchema,
    /**
     * The text to insert at the specified range.
     */
    text: v.string(),
});

/**
 * Represents a command to fix a linting issue.
 */
export type LinterFixCommand = v.InferOutput<typeof linterFixCommandSchema>;

/**
 * A utility class for creating fixes to linting issues in source code.
 */
export class LinterFixGenerator {
    /**
     * The source code being fixed.
     */
    private readonly linterSourceCode: LinterSourceCode;

    /**
     * Constructs a new LinterRuleFixer instance.
     *
     * @param linterSourceCode LinterSourceCode instance representing the source code.
     */
    constructor(linterSourceCode: LinterSourceCode) {
        this.linterSourceCode = linterSourceCode;
    }

    /**
     * Creates a command to insert text at a specified offset.
     *
     * @param offset The offset in the source code where the text should be inserted.
     * @param text The text to insert.
     *
     * @returns A LinterFixCommand representing the insertion.
     */
    private static createInsertCommand(offset: number, text: string): LinterFixCommand {
        return {
            range: [offset, offset],
            text,
        };
    }

    /**
     * Resolves the range of offsets for a given node or range.
     *
     * @param nodeOrRange The node or range to resolve.
     *
     * @returns The resolved range of offsets, or null if invalid.
     */
    private resolveRange(nodeOrRange: LinterOffsetRange): LinterOffsetRange | null {
        if (!this.linterSourceCode.isRangeValid(nodeOrRange)) {
            return null;
        }

        return nodeOrRange;
    }

    /**
     * Creates a command to insert text before a specified node or range.
     *
     * @param nodeOrRange The node or range before which the text should be inserted.
     * @param text The text to insert.
     *
     * @returns A LinterFixCommand representing the insertion, or null if the range is invalid.
     */
    public insertTextBefore(nodeOrRange: LinterOffsetRange, text: string): LinterFixCommand | null {
        const range = this.resolveRange(nodeOrRange);

        if (isNull(range)) {
            return null;
        }

        return LinterFixGenerator.createInsertCommand(range[0], text);
    }

    /**
     * Creates a command to insert text after a specified node or range.
     *
     * @param nodeOrRange The node or range after which the text should be inserted.
     * @param text The text to insert.
     *
     * @returns A LinterFixCommand representing the insertion, or null if the range is invalid.
     */
    public insertTextAfter(nodeOrRange: LinterOffsetRange, text: string): LinterFixCommand | null {
        const range = this.resolveRange(nodeOrRange);

        if (isNull(range)) {
            return null;
        }

        return LinterFixGenerator.createInsertCommand(range[1], text);
    }

    /**
     * Creates a command to replace text in a specified node or range.
     *
     * @param nodeOrRange The node or range to replace.
     * @param text The replacement text.
     *
     * @returns A LinterFixCommand representing the replacement, or null if the range is invalid.
     */
    public replaceWithText(nodeOrRange: LinterOffsetRange, text: string): LinterFixCommand | null {
        const range = this.resolveRange(nodeOrRange);

        if (isNull(range)) {
            return null;
        }

        return { range, text };
    }

    /**
     * Creates a command to remove text in a specified node or range.
     *
     * @param nodeOrRange The node or range to remove.
     *
     * @returns A LinterFixCommand representing the removal, or null if the range is invalid.
     */
    public remove(nodeOrRange: LinterOffsetRange): LinterFixCommand | null {
        const range = this.resolveRange(nodeOrRange);

        if (isNull(range)) {
            return null;
        }

        return { range, text: EMPTY };
    }
}
