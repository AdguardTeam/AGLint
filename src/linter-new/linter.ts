import { type LinterConfig } from './config';
import { createReportFn } from './core/report';
import { createLinterRuntime } from './core/runtime';
import { type LinterFileProps } from './file-props';
import { type LinterProblem } from './linter-problem';
import { makeConfigCommentVisitor } from './phase/inline-config';
import { applyDisableDirectives, summarize } from './phase/postprocess';
import { runWalk } from './phase/walk';
import { type LinterRuleLoader } from './rule-registry/rule-loader';

/**
 * Represents a linter result that is returned by the `lint` method.
 */
export interface LinterResult {
    /**
     * Array of problems detected by the linter.
     */
    problems: LinterProblem[];

    /**
     * Count of warnings (just for convenience, can be calculated from problems array).
     */
    warningCount: number;

    /**
     * Count of errors (just for convenience, can be calculated from problems array).
     */
    errorCount: number;

    /**
     * Count of fatal errors (just for convenience, can be calculated from problems array).
     */
    fatalErrorCount: number;
}

export class Linter {
    private static readonly CONFIG_COMMENT_SELECTOR = 'ConfigCommentRule';

    public static async lint(
        fileProps: LinterFileProps,
        config: LinterConfig,
        loadRule: LinterRuleLoader,
    ) {
        const runtime = createLinterRuntime(fileProps, config, loadRule);

        const report = createReportFn(runtime);
        runtime.ruleRegistry.setReporter(report);

        await runtime.ruleRegistry.loadRules();

        const { onConfigComment, disabled } = makeConfigCommentVisitor(runtime);

        if (config.allowInlineConfig) {
            runtime.visitors.addVisitor(Linter.CONFIG_COMMENT_SELECTOR, onConfigComment);
        }

        runWalk(runtime);

        applyDisableDirectives(runtime.problems, disabled);
        const counts = summarize(runtime.problems);

        return { problems: runtime.problems, ...counts };
    }
}
