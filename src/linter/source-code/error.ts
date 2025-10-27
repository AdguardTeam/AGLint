import { type LinterPositionRange } from './source-code';

/**
 * Error thrown when source code parsing fails.
 *
 * Extends the standard Error with location information to indicate
 * where in the source code the parse error occurred.
 *
 * @example
 * ```typescript
 * throw new LinterSourceCodeError(
 *   'Unexpected token',
 *   { start: { line: 1, column: 0 }, end: { line: 1, column: 5 } }
 * );
 * ```
 */
export class LinterSourceCodeError extends Error {
    /**
     * Creates a new source code error.
     *
     * @param message - Description of the parse error
     * @param location - Position range where the error occurred
     */
    constructor(
        message: string,
        public readonly location: LinterPositionRange,
    ) {
        super(message);
    }
}
