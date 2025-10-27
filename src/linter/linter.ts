import * as v from 'valibot';

import { type LinterConfig, linterConfigSchema, type LinterSubParsersConfig } from './config';
import { createReportFn } from './core/report';
import { createLinterRuntime } from './core/runtime';
import { type LinterFileProps } from './file-props';
import { linterProblemSchema } from './linter-problem';
import { makeConfigCommentVisitor } from './phase/inline-config';
import { applyDisableDirectives, summarize } from './phase/postprocess';
import { runWalk } from './phase/walk';
import { type LinterRuleLoader } from './rule-registry/rule-loader';

export const linterResultSchema = v.object({
    /**
     * Array of problems detected by the linter.
     */
    problems: v.array(linterProblemSchema),
    /**
     * Count of warnings (just for convenience, can be calculated from problems array).
     */
    warningCount: v.number(),
    /**
     * Count of errors (just for convenience, can be calculated from problems array).
     */
    errorCount: v.number(),
    /**
     * Count of fatal errors (just for convenience, can be calculated from problems array).
     */
    fatalErrorCount: v.number(),
});

/**
 * Represents a linter result that is returned by the `lint` method.
 */
export type LinterResult = v.InferOutput<typeof linterResultSchema>;

export type LinterRunOptions = {
    fileProps: LinterFileProps;
    config: LinterConfig;
    loadRule: LinterRuleLoader;
    subParsers?: LinterSubParsersConfig;
};

const CONFIG_COMMENT_SELECTOR = 'ConfigCommentRule';

/**
 * Lints a file according to the provided configuration and returns problems found.
 *
 * @param options Linter run options including file props, config, and rule loader
 * @returns Promise resolving to linter result with problems and counts
 */
export async function lint(options: LinterRunOptions): Promise<LinterResult> {
    const parsedConfig = v.parse(linterConfigSchema, options.config);
    const runtime = createLinterRuntime(
        options.fileProps,
        parsedConfig,
        options.loadRule,
        options.subParsers ?? {},
    );

    const report = createReportFn(runtime);
    runtime.ruleRegistry.setReporter(report);

    await runtime.ruleRegistry.loadRules();

    const { onConfigComment, disabled } = makeConfigCommentVisitor(runtime);

    if (options.config.allowInlineConfig) {
        runtime.visitors.addVisitor(CONFIG_COMMENT_SELECTOR, onConfigComment);
    }

    runWalk(runtime);

    applyDisableDirectives(runtime.problems, disabled);
    const counts = summarize(runtime.problems);

    return { problems: runtime.problems, ...counts };
}
