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

export type LinterRuntime = {
    sourceCode: LinterSourceCode;
    walker: LinterSourceCodeWalker;
    visitors: LinterVisitorCollection;
    fixGenerator: LinterFixGenerator;
    ruleRegistry: LinterRuleRegistry;
    problems: LinterProblem[];
    onParseError: (e: LinterSourceCodeError) => void;
    getOffsetRangeForNode: (node: any) => LinterOffsetRange | null;
};

export function createLinterRuntime(
    file: LinterFileProps,
    config: LinterConfigParsed,
    loadRule: LinterRuleLoader,
    subParsers: LinterSubParsersConfig,
): LinterRuntime {
    const problems: LinterProblem[] = [];

    const onParseError = (error: unknown) => {
        if (!(error instanceof LinterSourceCodeError)) {
            // Unknown error, we cannot extract position from it
            throw error;
        }

        problems.push({
            message: error.message,
            position: error.location,
            severity: LinterRuleSeverity.Error,
            fatal: true,
        });
    };

    const sourceCode = new LinterSourceCode(file.content, onParseError);
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

    const baseContext: LinterRuleBaseContext = {
        filePath: file.filePath,
        cwd: file.cwd,
        sourceCode,
        syntax: config.syntax,
        getOffsetRangeForNode,
    };

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
    };
}
