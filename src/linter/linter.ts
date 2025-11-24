import * as v from 'valibot';

import { type LinterConfig, linterConfigSchema, type LinterSubParsersConfig } from './config';
import { createReportFn } from './core/report';
import { createLinterRuntime } from './core/runtime';
import { type LinterFileProps } from './file-props';
import { linterProblemSchema } from './linter-problem';
import { makeConfigCommentVisitor } from './phase/inline-config';
import { applyDisableDirectives, summarize } from './phase/postprocess';
import { runWalk } from './phase/walk';
import { linterRuleMetaSchema } from './rule';
import { type LinterRuleLoader } from './rule-registry/rule-loader';

export const linterResultSchema = v.object({
    /**
     * Array of problems detected by the linter.
     */
    problems: v.array(linterProblemSchema),
    /**
     * Metadata of the rules that were run.
     */
    metadata: v.optional(v.record(v.string(), linterRuleMetaSchema)),
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

/**
 * Options for running the linter on a file.
 */
export type LinterRunOptions = {
    /**
     * Properties of the file to lint (content, path, working directory).
     */
    fileProps: LinterFileProps;

    /**
     * Linter configuration specifying which rules to run and how.
     */
    config: LinterConfig;

    /**
     * Function to dynamically load rule modules by name.
     */
    loadRule: LinterRuleLoader;

    /**
     * Optional sub-parsers for handling embedded syntaxes (e.g., CSS).
     */
    subParsers?: LinterSubParsersConfig;

    /**
     * Optional module debugger for logging.
     */
    debug?: { log: (message: string) => void };

    /**
     * Whether to include metadata of the rules that were run.
     */
    includeMetadata?: boolean;
};

const CONFIG_COMMENT_SELECTOR = 'ConfigCommentRule';

/**
 * Lints a file according to the provided configuration and returns problems found.
 *
 * This is the main entry point for linting. The function:
 * 1. Validates and parses the configuration
 * 2. Creates a linter runtime environment
 * 3. Loads all configured rules
 * 4. Processes inline config comments (if enabled)
 * 5. Walks the AST and triggers rule visitors
 * 6. Applies disable directives to filter problems
 * 7. Summarizes results by severity.
 *
 * @param options Linter run options including file props, config, and rule loader.
 *
 * @returns Promise resolving to linter result with problems and severity counts.
 *
 * @throws Error if configuration is invalid.
 * @throws Error if a required rule cannot be loaded.
 *
 * @example
 * ```typescript
 * const result = await lint({
 *   fileProps: {
 *     content: 'example.com##.ad',
 *     filePath: 'filters.txt'
 *   },
 *   config: {
 *     rules: {
 *       'no-short-rules': 'error',
 *       'no-invalid-css': ['warn', { strict: true }]
 *     }
 *   },
 *   loadRule: async (name) => import(`./rules/${name}`)
 * });
 *
 * console.log(`Found ${result.errorCount} errors and ${result.warningCount} warnings`);
 * ```
 */
export async function lint(options: LinterRunOptions): Promise<LinterResult> {
    const debug = options.debug || { log: () => {} };
    const filePath = options.fileProps.filePath || 'unknown';
    const startTime = Date.now();

    debug.log(`Starting lint for: ${filePath}`);
    debug.log(`File size: ${options.fileProps.content.length} bytes`);

    // Parse and validate config
    const configParseStart = Date.now();
    const parsedConfig = v.parse(linterConfigSchema, options.config);
    debug.log(`Config parsed in ${Date.now() - configParseStart}ms`);
    if (debug) {
        debug.log(`Linter config: ${JSON.stringify(parsedConfig)}`);
    }

    // Create runtime (includes source code parsing)
    const runtimeStart = Date.now();
    const runtime = createLinterRuntime(
        options.fileProps,
        parsedConfig,
        options.loadRule,
        options.subParsers ?? {},
        debug,
    );
    debug.log(`Runtime created in ${Date.now() - runtimeStart}ms`);

    const report = createReportFn(runtime);
    runtime.ruleRegistry.setReporter(report);

    // Load rules
    const ruleLoadStart = Date.now();
    if (debug) {
        debug.log(`Loading ${Object.keys(parsedConfig.rules).length} rule(s)`);
    }
    await runtime.ruleRegistry.loadRules();
    debug.log(`Rules loaded in ${Date.now() - ruleLoadStart}ms`);

    const { onConfigComment, disabled } = makeConfigCommentVisitor(runtime);

    if (options.config.allowInlineConfig) {
        runtime.visitors.addVisitor(CONFIG_COMMENT_SELECTOR, onConfigComment);
        debug.log('Inline config comments enabled');
    }

    // AST walk
    const walkStart = Date.now();
    debug.log('Starting AST walk');
    runWalk(runtime);
    debug.log(`AST walk completed in ${Date.now() - walkStart}ms`);

    // Apply disable directives
    const disableStart = Date.now();
    debug.log(`Applying disable directives (${disabled.length} directive(s))`);
    applyDisableDirectives(
        runtime.problems,
        disabled,
        parsedConfig.reportUnusedDisableDirectives,
        parsedConfig.unusedDisableDirectivesSeverity,
    );
    debug.log(`Disable directives applied in ${Date.now() - disableStart}ms`);

    const counts = summarize(runtime.problems);
    const totalTime = Date.now() - startTime;

    debug.log(
        `Lint completed for ${filePath} in ${totalTime}ms: `
        + `${counts.errorCount} error(s), ${counts.warningCount} warning(s), `
        + `${counts.fatalErrorCount} fatal`,
    );

    const result: LinterResult = {
        problems: runtime.problems,
        ...counts,
    };

    if (options.includeMetadata) {
        result.metadata = {};

        // iterate over problems and add metadata for each rule
        for (const problem of runtime.problems) {
            if (!problem.ruleId) {
                continue;
            }

            if (!result.metadata[problem.ruleId]) {
                result.metadata[problem.ruleId] = runtime.ruleRegistry.getRuleMeta(problem.ruleId);
            }
        }
    }

    return result;
}
