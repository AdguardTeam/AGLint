import {
    type AnyPlatform,
    getPlatformsByProduct,
    parseRawPlatforms,
    PLATFORM_SEPARATOR,
} from '@adguard/agtree';

import { type ModuleDebug } from '../../utils/debug';
import { type LinterConfigParsed, type LinterSubParsersConfig } from '../config';
import { type LinterFileProps } from '../file-props';
import { type LinterProblem } from '../linter-problem';
import { type LinterRuleBaseContext, LinterRuleSeverity } from '../rule';
import { type LinterRuleLoader } from '../rule-registry/rule-loader';
import { LinterRuleRegistry } from '../rule-registry/rule-registry';
import { LinterSourceCodeError } from '../source-code/error';
import { LinterFixGenerator } from '../source-code/fix-generator';
import { type LinterOffsetRange } from '../source-code/source-code';
import { LinterSourceCode } from '../source-code/source-code';
import { LinterSourceCodeWalker } from '../source-code/source-code-walker';
import { LinterVisitorCollection } from '../source-code/visitor-collection';

/**
 * Represents the complete runtime environment for a linter execution.
 *
 * This aggregates all the components needed to lint source code:
 * - Source code representation with utilities
 * - AST walker with sub-parser support
 * - Visitor collection for rules
 * - Fix generator for automatic repairs
 * - Rule registry managing active rules
 * - Problems array collecting issues found
 * - Error handlers for parse failures.
 */
export type LinterRuntime = {
    /**
     * The parsed source code with utilities for position mapping and line access.
     */
    sourceCode: LinterSourceCode;

    /**
     * AST walker that traverses the main AST and any sub-ASTs.
     */
    walker: LinterSourceCodeWalker;

    /**
     * Collection of all registered visitors from active rules.
     */
    visitors: LinterVisitorCollection;

    /**
     * Generator for creating fix commands.
     */
    fixGenerator: LinterFixGenerator;

    /**
     * Registry managing all loaded rule instances.
     */
    ruleRegistry: LinterRuleRegistry;

    /**
     * Array accumulating all problems found during linting.
     */
    problems: LinterProblem[];

    /**
     * Callback invoked when a parse error occurs in the source code or sub-parsers.
     */
    onParseError: (e: LinterSourceCodeError) => void;

    /**
     * Utility function to extract offset range from an AST node.
     * Handles both main AST and sub-AST nodes.
     */
    getOffsetRangeForNode: (node: any) => LinterOffsetRange | null;
};

/**
 * Creates a complete linter runtime environment for processing a file.
 *
 * This function:
 * - Parses the source code into an AST
 * - Sets up error handling for parse failures
 * - Creates the AST walker with sub-parser support
 * - Initializes the visitor collection
 * - Sets up the fix generator
 * - Creates the rule registry
 * - Wires up all components together.
 *
 * @param file Properties of the file to lint (content, path, cwd).
 * @param config Parsed linter configuration.
 * @param loadRule Function to dynamically load rule modules.
 * @param subParsers Configuration for sub-parsers (e.g., CSS, HTML).
 * @param debug Optional module debugger for logging.
 *
 * @returns A fully initialized linter runtime ready for rule loading and AST traversal.
 */
export function createLinterRuntime(
    file: LinterFileProps,
    config: LinterConfigParsed,
    loadRule: LinterRuleLoader,
    subParsers: LinterSubParsersConfig,
    debug?: ModuleDebug,
): LinterRuntime {
    const problems: LinterProblem[] = [];

    const onParseError = (error: unknown) => {
        if (!(error instanceof LinterSourceCodeError)) {
            // Unknown error, we cannot extract position from it
            throw error;
        }

        if (debug) {
            debug.log(`Parse error: ${error.message} at line ${error.location.start.line}`);
        }
        problems.push({
            message: error.message,
            position: error.location,
            severity: LinterRuleSeverity.Error,
            fatal: true,
        });
    };

    const parseStart = Date.now();
    const sourceCode = new LinterSourceCode(file.content, onParseError);
    if (debug) {
        debug.log(`Parsing source code completed in ${Date.now() - parseStart}ms`);
    }

    const walker = new LinterSourceCodeWalker(sourceCode, subParsers, onParseError);
    const visitors = new LinterVisitorCollection();
    const fixGen = new LinterFixGenerator(sourceCode);

    const getOffsetRangeForNode = (node: any): LinterOffsetRange | null => {
        const parser = walker.getParser(node);
        const start = parser ? (parser.getStartOffset?.(node) ?? node.start ?? null) : (node.start ?? null);
        const end = parser ? (parser.getEndOffset?.(node) ?? node.end ?? null) : (node.end ?? null);
        if (start === null || end === null || start >= end) return null;
        return [start, end];
    };

    let platforms: AnyPlatform = 0;

    if (config.platforms.length > 0) {
        platforms = parseRawPlatforms(config.platforms.join(PLATFORM_SEPARATOR));
    }

    const baseContext: LinterRuleBaseContext = {
        filePath: file.filePath,
        cwd: file.cwd,
        sourceCode,
        platforms,
        platformsByProduct: getPlatformsByProduct(platforms),
        getOffsetRangeForNode,
        debug,
    } as LinterRuleBaseContext;

    const ruleRegistry = new LinterRuleRegistry(
        config,
        visitors,
        baseContext,
        loadRule,
    );

    return {
        sourceCode,
        walker,
        visitors,
        fixGenerator: fixGen,
        ruleRegistry,
        problems,
        onParseError,
        getOffsetRangeForNode,
        ...(debug ? { debug } : {}),
    } as LinterRuntime;
}
