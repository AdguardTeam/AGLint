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

/**
 * Union type representing either a standard linter result or a fixer result.
 */
export type AnyLinterResult = LinterResult | LinterFixerResult;

/**
 * Options for running the linter with automatic fixing.
 *
 * Extends LinterRunOptions with fix-specific configuration.
 */
export type LinterFixerRunOptions = LinterRunOptions & {
    /**
     * Maximum number of fix rounds to perform.
     * Defaults to FixApplier.MAX_FIX_ROUNDS (10).
     */
    maxFixRounds?: number;

    /**
     * Set of rule categories to fix (Problem, Suggestion, Layout).
     * If specified, only fixes from these categories are applied.
     */
    categories?: Set<LinterRuleType>;

    /**
     * Set of specific rule IDs to fix.
     * If specified, only fixes from these rules are applied.
     */
    ruleIds?: Set<string>;
};

/**
 * Options for applying fixes from an existing linter result.
 */
export type ApplyFixesOptions = {
    /**
     * The linter result containing problems with fixes.
     */
    linterResult: LinterResult;

    /**
     * The source code to apply fixes to.
     */
    sourceContent: string;

    /**
     * Maximum number of fix rounds.
     */
    maxFixRounds?: number;

    /**
     * Optional filter by rule categories.
     */
    categories?: Set<LinterRuleType>;

    /**
     * Optional filter by specific rule IDs.
     */
    ruleIds?: Set<string>;
};

/**
 * Applies fixes from an existing linter result to produce fixed source.
 *
 * This function does not perform linting - it only applies fixes from
 * problems that already have fix commands. Useful when you want to
 * apply fixes without re-running the full linting process.
 *
 * Fixes are applied in rounds to handle cases where fixes create new
 * problems or overlap with each other. Conflicting fixes are deferred
 * to subsequent rounds.
 *
 * @param options - Options containing the linter result and fix preferences
 *
 * @returns Fixed source code string
 *
 * @example
 * ```typescript
 * const linterResult = await lint({ fileProps, config, loadRule });
 * const fixed = applyFixesToResult({
 *   linterResult,
 *   sourceContent: fileProps.content,
 *   categories: new Set([LinterRuleType.Layout])
 * });
 * // Returns source with only layout fixes applied
 * ```
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
 * This function:
 * 1. Runs the linter to find problems
 * 2. Applies fixes from problems
 * 3. Re-lints the fixed source
 * 4. Repeats until no more fixes can be applied or max rounds reached
 * 5. Returns the final result with fixed source and statistics
 *
 * Fixes are filtered by categories and rule IDs if specified.
 * The process continues until either all fixes are applied or the
 * maximum number of rounds is reached.
 *
 * @param options - Linter run options with fix preferences
 *
 * @returns Promise resolving to linter result with fix statistics and fixed source
 *
 * @example
 * ```typescript
 * const result = await lintWithFixes({
 *   fileProps: {
 *     content: 'example.com##.ad',
 *     filePath: 'filters.txt'
 *   },
 *   config: {
 *     rules: {
 *       'no-short-rules': 'error',
 *       'scriptlet-quotes': ['error', { prefer: 'double' }]
 *     }
 *   },
 *   loadRule: async (name) => import(`./rules/${name}`),
 *   maxFixRounds: 5,
 *   categories: new Set([LinterRuleType.Problem])
 * });
 *
 * console.log(`Applied ${result.appliedFixesCount} fixes`);
 * console.log(`Fixed source:\n${result.fixedSource}`);
 * ```
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
