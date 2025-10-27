import { lint, type LinterResult, type LinterRunOptions } from './linter';
import { type LinterRuleType } from './rule';
import { FixApplier } from './source-code/fix-applier';
import { type LinterFixCommand } from './source-code/fix-generator';

/**
 * Result of linting with fixes applied.
 */
export type LinterFixerResult = LinterResult & {
    /**
     * Number of fixes applied.
     */
    appliedFixesCount: number;

    /**
     * Number of remaining fixes.
     */
    remainingFixesCount: number;

    /**
     * Number of fix rounds performed.
     */
    fixRoundsCount: number;

    /**
     * Whether the maximum number of fix rounds was reached.
     */
    maxFixRoundsReached: boolean;

    /**
     * Fixed source code.
     */
    fixedSource: string;
};

export type AnyLinterResult = LinterResult | LinterFixerResult;

export type LinterFixerRunOptions = LinterRunOptions & {
    maxFixRounds?: number;
    categories?: Set<LinterRuleType>;
    ruleIds?: Set<string>;
};

export type ApplyFixesOptions = {
    linterResult: LinterResult;
    sourceContent: string;
    maxFixRounds?: number;
    categories?: Set<LinterRuleType>;
    ruleIds?: Set<string>;
};

/**
 * Applies fixes from an existing linter result to produce fixed source.
 * Does not perform initial linting - starts with the provided result.
 *
 * @param options Options containing the linter result and fix preferences
 * @returns Fixed source string
 */
export function applyFixesToResult(options: ApplyFixesOptions): string {
    const maxFixRounds = options.maxFixRounds ?? FixApplier.MAX_FIX_ROUNDS;
    let source = options.sourceContent;
    let fixRoundsCount = 0;
    let remainingFixes: LinterFixCommand[] = [];

    // Extract fixes from the linter result
    const fixesToApply = options.linterResult.problems
        .filter((problem) => {
            if (!problem.fix) {
                return false;
            }

            if (options.categories && (!problem.category || !options.categories.has(problem.category))) {
                return false;
            }

            if (options.ruleIds && (!problem.ruleId || !options.ruleIds.has(problem.ruleId))) {
                return false;
            }

            return true;
        })
        .map((problem) => problem.fix!);

    if (fixesToApply.length === 0) {
        return source;
    }

    // Apply fixes in rounds
    let currentFixes = fixesToApply;
    do {
        const fixApplier = new FixApplier(source);
        const fixApplicationResult = fixApplier.applyFixes(currentFixes);

        remainingFixes = fixApplicationResult.remainingFixes;
        source = fixApplicationResult.fixedSource;
        currentFixes = remainingFixes;
        fixRoundsCount += 1;
    } while (remainingFixes.length > 0 && fixRoundsCount < maxFixRounds);

    return source;
}

/**
 * Lints a file and applies all available fixes in iterative rounds.
 *
 * @param options Linter run options with fix preferences
 * @returns Promise resolving to linter result with fix statistics and fixed source
 */
export async function lintWithFixes(options: LinterFixerRunOptions): Promise<LinterFixerResult> {
    const maxFixRounds = options.maxFixRounds ?? FixApplier.MAX_FIX_ROUNDS;

    let source = options.fileProps.content;
    let remainingFixes: LinterFixCommand[] = [];
    let fixRoundsCount = 0;
    let appliedFixesCount = 0;
    let remainingFixesCount = 0;
    let linterResult: LinterResult;

    do {
        // eslint-disable-next-line no-await-in-loop
        linterResult = await lint({
            fileProps: {
                ...options.fileProps,
                content: source,
            },
            config: options.config,
            loadRule: options.loadRule,
            subParsers: options.subParsers,
        });
        const fixApplier = new FixApplier(source);
        const fixesToApply = linterResult.problems
            .filter((problem) => {
                if (!problem.fix) {
                    return false;
                }

                if (options.categories && (!problem.category || !options.categories.has(problem.category))) {
                    return false;
                }

                if (options.ruleIds && (!problem.ruleId || !options.ruleIds.has(problem.ruleId))) {
                    return false;
                }

                return true;
            })
            .map((problem) => problem.fix!);

        const fixApplicationResult = fixApplier.applyFixes(fixesToApply);

        remainingFixes = fixApplicationResult.remainingFixes;
        source = fixApplicationResult.fixedSource;
        appliedFixesCount += fixApplicationResult.appliedFixes.length;
        remainingFixesCount = remainingFixes.length;
        fixRoundsCount += 1;
    } while (remainingFixesCount > 0 && fixRoundsCount < maxFixRounds);

    // Final verification lint, ensures offsets match the fixed source
    if (appliedFixesCount > 0) {
        linterResult = await lint({
            fileProps: {
                ...options.fileProps,
                content: source,
            },
            config: options.config,
            loadRule: options.loadRule,
            subParsers: options.subParsers,
        });
    }

    return {
        ...linterResult,
        appliedFixesCount,
        remainingFixesCount,
        fixRoundsCount,
        maxFixRoundsReached: fixRoundsCount >= maxFixRounds,
        fixedSource: source,
    };
}
