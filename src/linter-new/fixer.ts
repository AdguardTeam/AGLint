import { type LinterConfig, type LinterSubParsersConfig } from './config';
import { type LinterFileProps } from './file-props';
import { type LinterResult } from './linter';
import { Linter } from './linter';
import { LinterRuleType } from './rule';
import { type LinterRuleLoader } from './rule-registry/rule-loader';
import { FixApplier } from './source-code/fix-applier';
import { type LinterFixCommand } from './source-code/fix-generator';

export type LinterFixerResult = LinterResult & {
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
        subParsers: LinterSubParsersConfig = {},
        maxFixRounds: number = FixApplier.MAX_FIX_ROUNDS,
        categories: Set<LinterRuleType> = new Set([LinterRuleType.Problem, LinterRuleType.Layout]),
    ): Promise<LinterFixerResult> {
        let source = fileProps.content;
        let remainingFixes: LinterFixCommand[] = [];
        let fixRoundsCount = 0;
        let appliedFixesCount = 0;
        let remainingFixesCount = 0;
        let linterResult: LinterResult;

        do {
            // eslint-disable-next-line no-await-in-loop
            linterResult = await Linter.lint(
                { ...fileProps, content: source },
                config,
                loadRule,
                subParsers,
            );
            const fixApplier = new FixApplier(source);
            const fixesToApply = linterResult.problems
                .filter((problem) => problem.fix && categories.has(problem.category ?? LinterRuleType.Problem))
                .map((problem) => problem.fix!);

            const fixApplicationResult = fixApplier.applyFixes(fixesToApply);

            remainingFixes = fixApplicationResult.remainingFixes;
            source = fixApplicationResult.fixedSource;
            appliedFixesCount += fixApplicationResult.appliedFixes.length;
            remainingFixesCount = remainingFixes.length;
            fixRoundsCount += 1;
        } while (remainingFixesCount > 0 && fixRoundsCount < maxFixRounds);

        // Final verification lint, ensures offsets match the fixed source
        linterResult = await Linter.lint(
            { ...fileProps, content: source },
            config,
            loadRule,
            subParsers,
        );

        return {
            ...linterResult,
            appliedFixesCount,
            remainingFixesCount,
            fixRoundsCount,
            fixedSource: source,
        };
    }
}
