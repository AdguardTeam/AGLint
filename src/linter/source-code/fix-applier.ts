import { type LinterFixCommand } from './fix-generator';

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
    private readonly sourceCode: string;

    /**
     * Constructs a new FixApplier instance.
     *
     * @param sourceCode The source code being fixed.
     */
    constructor(sourceCode: string) {
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
        const sorted = [...fixes].sort((a, b) => a.range[0] - b.range[0] || a.range[1] - b.range[1]);

        const appliedFixes: LinterFixCommand[] = [];
        const remainingFixes: LinterFixCommand[] = [];

        let last = 0;
        let out = '';

        for (const fix of sorted) {
            const [start, end] = fix.range;

            if (start < last) {
                remainingFixes.push(fix);
                continue;
            }

            out += this.sourceCode.slice(last, start);
            out += fix.text;
            last = end;

            appliedFixes.push(fix);
        }

        out += this.sourceCode.slice(last);

        return {
            fixedSource: out,
            appliedFixes,
            remainingFixes,
        };
    }
}
