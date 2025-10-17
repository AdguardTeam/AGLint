import { type LinterResult, type LinterRunOptions } from './linter';
import { Linter } from './linter';
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
     * Fixed source code.
     */
    fixedSource: string;
};

export type LinterFixerRunOptions = LinterRunOptions & {
    maxFixRounds?: number;
    categories?: Set<LinterRuleType>;
    ruleIds?: Set<string>;
};

export class LinterFixer {
    public static async lint(options: LinterFixerRunOptions): Promise<LinterFixerResult> {
        const maxFixRounds = options.maxFixRounds ?? FixApplier.MAX_FIX_ROUNDS;

        let source = options.fileProps.content;
        let remainingFixes: LinterFixCommand[] = [];
        let fixRoundsCount = 0;
        let appliedFixesCount = 0;
        let remainingFixesCount = 0;
        let linterResult: LinterResult;

        do {
            // eslint-disable-next-line no-await-in-loop
            linterResult = await Linter.lint({
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
        linterResult = await Linter.lint({
            fileProps: {
                ...options.fileProps,
                content: source,
            },
            config: options.config,
            loadRule: options.loadRule,
            subParsers: options.subParsers,
        });

        return {
            ...linterResult,
            appliedFixesCount,
            remainingFixesCount,
            fixRoundsCount,
            fixedSource: source,
        };
    }
}
