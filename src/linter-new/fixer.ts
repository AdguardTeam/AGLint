import { type LinterConfig } from './config';
import { type LinterFileProps } from './file-props';
import { type LinterResult } from './linter';
import { Linter } from './linter';
import { LinterRuleType } from './rule';
import { type LinterRuleLoader } from './rule-registry/rule-loader';
import { FixApplier } from './source-code/fix-applier';
import { type LinterFixCommand } from './source-code/fix-generator';

type LinterFixerResult = LinterResult & {
    appliedFixesCount: number;
    remainingFixesCount: number;
    fixRoundsCount: number;
    fixedSource: string;
};

export class LinterFixer {
    public static async lint(
        fileProps: LinterFileProps,
        config: LinterConfig,
        loadRule: LinterRuleLoader,
        maxFixRounds: number = FixApplier.MAX_FIX_ROUNDS,
        categories: Set<LinterRuleType> = new Set([LinterRuleType.Problem, LinterRuleType.Layout]),
    ): Promise<LinterFixerResult> {
        let actualSource = fileProps.content;
        let remainingFixes: LinterFixCommand[] = [];
        let fixRoundsCount = 0;
        let appliedFixesCount = 0;
        let remainingFixesCount = 0;
        let linterResult: LinterResult;

        do {
            // eslint-disable-next-line no-await-in-loop
            linterResult = await Linter.lint(
                {
                    ...fileProps,
                    content: actualSource,
                },
                config,
                loadRule,
            );
            const fixApplier = new FixApplier(actualSource);
            const fixesToApply: LinterFixCommand[] = [];

            for (const problem of linterResult.problems) {
                if (problem.fix && problem.category && categories.has(problem.category)) {
                    fixesToApply.push(problem.fix);
                }
            }

            const fixApplicationResult = fixApplier.applyFixes(fixesToApply);

            remainingFixes = fixApplicationResult.remainingFixes;
            actualSource = fixApplicationResult.fixedSource;
            appliedFixesCount += fixApplicationResult.appliedFixes.length;
            remainingFixesCount = remainingFixes.length;
            fixRoundsCount += 1;
        } while (remainingFixesCount > 0 && fixRoundsCount < maxFixRounds);

        return {
            ...linterResult,
            appliedFixesCount,
            remainingFixesCount,
            fixRoundsCount,
            fixedSource: actualSource,
        };
    }
}
