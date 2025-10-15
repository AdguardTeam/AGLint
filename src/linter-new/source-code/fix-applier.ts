import { EMPTY } from '../../common/constants';

import { type LinterFixCommand } from './fixer';
import { type LinterSourceCode } from './source-code';

/**
 * The result of applying a list of fixes to the source code.
 */
export interface FixApplicationResult {
    /**
     * The fixed source code.
     */
    fixedSource: string;

    /**
     * The list of fixes that were applied.
     */
    appliedFixes: LinterFixCommand[];

    /**
     * The list of fixes that were not applied.
     */
    remainingFixes: LinterFixCommand[];
}

/**
 * Applies a list of fixes to the source code, handling conflicts and dynamic offset changes.
 */
export class FixApplier {
    /**
     * After fixing the source code, we may still have some ignored fixes due to conflicts.
     * In such cases, we run the linter again and again until all fixes are applied
     * or until we reach the maximum number of rounds.
     */
    public static readonly MAX_FIX_ROUNDS = 10;

    /**
     * The source code being fixed.
     */
    private readonly sourceCode: LinterSourceCode;

    /**
     * Constructs a new FixApplier instance.
     *
     * @param sourceCode The source code being fixed.
     */
    constructor(sourceCode: LinterSourceCode) {
        this.sourceCode = sourceCode;
    }

    /**
     * Applies a list of fixes to the source code, handling conflicts and dynamic offset changes.
     *
     * @param fixes The list of fixes to apply.
     *
     * @returns An object containing the fixed source code and ignored fixes.
     */
    public applyFixes(fixes: LinterFixCommand[]): FixApplicationResult {
        // Sort fixes by their starting position
        const sortedFixes = fixes.sort((a, b) => a.range[0] - b.range[0]);

        const appliedFixes: LinterFixCommand[] = [];
        const remainingFixes: LinterFixCommand[] = [];

        let output = EMPTY;
        let currentIndex = 0;
        let offsetShift = 0;

        for (const fix of sortedFixes) {
            let [start, end] = fix.range;

            // Adjust the fix's range based on the current offset shift
            start += offsetShift;
            end += offsetShift;

            // Check for conflicts
            if (start < currentIndex) {
                remainingFixes.push(fix);
                continue;
            }

            // Append unchanged content before the fix
            output += this.sourceCode.getSlicedPart(currentIndex, start);

            // Apply the fix text
            output += fix.text;

            // Calculate the offset shift introduced by this fix
            offsetShift += fix.text.length - (end - start);

            // Update the current index
            currentIndex = end;

            appliedFixes.push(fix);
        }

        // Append the remaining content after the last fix
        output += this.sourceCode.getSlicedPart(currentIndex);

        return {
            fixedSource: output,
            appliedFixes,
            remainingFixes,
        };
    }
}
