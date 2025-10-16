import { type ConfigCommentRule } from '@adguard/agtree';
import * as v from 'valibot';

import { getErrorMessage } from '../utils/error';
import { isNull } from '../utils/type-guards';

import { type LinterConfig, linterRulesConfigSchema } from './config';
import { LinterConfigCommentType } from './config-comment-type';
import { type LinterFileProps } from './file-props';
import { LinterInlineDisableApplier } from './inline-disable-applier';
import { type LinterProblem } from './linter-problem';
import {
    type LinterProblemReport,
    type LinterRuleBaseContext,
    LinterRuleSeverity,
    type WithMessages,
} from './rule';
import { type LinterRuleInstance } from './rule-registry/rule-instance';
import { type LinterRuleLoader } from './rule-registry/rule-loader';
import { LinterRuleRegistry } from './rule-registry/rule-registry';
import { type LinterSourceCodeError } from './source-code/error';
import { LinterFixGenerator } from './source-code/fix-generator';
import { type LinterOffsetRange, type LinterPositionRange, LinterSourceCode } from './source-code/source-code';
import { LinterSourceCodeWalker } from './source-code/source-code-walker';
import { LinterVisitorCollection } from './source-code/visitor-collection';

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

type LinterDisableComment = {
    commentNode: ConfigCommentRule;
    command: LinterConfigCommentType;
    position: LinterPositionRange;
    ruleId?: string;
};

export class FileLinter {
    private static readonly CONFIG_COMMENT_SELECTOR = 'ConfigCommentRule';

    private readonly fileProps: LinterFileProps;

    private readonly config: LinterConfig;

    private readonly problems: LinterProblem[];

    private readonly sourceCode: LinterSourceCode;

    private readonly sourceCodeWalker: LinterSourceCodeWalker;

    private readonly ruleRegistry: LinterRuleRegistry;

    private readonly visitorCollection: LinterVisitorCollection;

    private readonly disableComments: LinterDisableComment[];

    private readonly baseRuleContext: LinterRuleBaseContext;

    private readonly fixGenerator: LinterFixGenerator;

    constructor(
        fileProps: LinterFileProps,
        config: LinterConfig,
        loadRule: LinterRuleLoader,
    ) {
        this.fileProps = fileProps;
        this.config = config;

        this.disableComments = [];
        this.problems = [];

        this.sourceCode = new LinterSourceCode(
            this.fileProps.content,
            this.onParseError.bind(this),
        );

        this.fixGenerator = new LinterFixGenerator(this.sourceCode);

        this.sourceCodeWalker = new LinterSourceCodeWalker(
            this.sourceCode,
            this.config.subParsers,
            this.onParseError.bind(this),
        );

        this.visitorCollection = new LinterVisitorCollection();

        this.baseRuleContext = {
            filePath: this.fileProps.filePath,
            cwd: this.fileProps.cwd,
            sourceCode: this.sourceCode,
            syntax: this.config.syntax,
            getOffsetRangeForNode: this.getOffsetRangeForNode.bind(this),
        };

        this.ruleRegistry = new LinterRuleRegistry(
            this.config,
            this.visitorCollection,
            this.baseRuleContext,
            this.report.bind(this),
            loadRule,
        );

        if (this.config.allowInlineConfig) {
            this.visitorCollection.addVisitor(
                FileLinter.CONFIG_COMMENT_SELECTOR,
                this.onConfigComment.bind(this),
            );
        }
    }

    private getOffsetRangeForNode(node: any): LinterOffsetRange | null {
        // get parser node belongs to
        const parser = this.sourceCodeWalker.getParser(node);

        let start: number | null;
        let end: number | null;

        if (!parser) {
            // if no parser found, it means we have an agtree node
            start = node.start ?? null;
            end = node.end ?? null;
        } else {
            start = parser.getStartOffset ? parser.getStartOffset(node) : (node.start ?? null);
            end = parser.getEndOffset ? parser.getEndOffset(node) : (node.end ?? null);
        }

        if (start === null || end === null || start >= end) {
            return null;
        }

        return [
            start,
            end,
        ];
    }

    private report(report: LinterProblemReport, ruleInstance: LinterRuleInstance): void {
        // Probably rule is disabled meantime with config comment
        if (ruleInstance.getSeverity() === LinterRuleSeverity.Off) {
            return;
        }

        let position: LinterPositionRange;

        // prefer position over node
        if (report.position) {
            position = report.position;
        } else {
            const range = this.getOffsetRangeForNode(report.node);
            if (!range) {
                throw new Error('Node has no offset range');
            }

            const pos = this.sourceCode.getLinterPositionRangeFromOffsetRange(range);
            if (!pos) {
                throw new Error('Node has no position');
            }
            position = pos;
        }

        let messages: WithMessages;

        if (report.message) {
            messages = {
                message: report.message,
            };
        } else if (report.messageId) {
            messages = {
                messageId: report.messageId,
                data: report.data,
            };
        } else {
            // This should never happen if the report is properly constructed
            throw new Error('Report must have either message or messageId');
        }

        const problem: LinterProblem = {
            ruleId: ruleInstance.getId(),
            severity: ruleInstance.getSeverity(),
            position,
            ...messages,
        };

        if (report.fix) {
            if (!ruleInstance.hasFix()) {
                throw new Error(
                    // eslint-disable-next-line max-len
                    `Rule '${ruleInstance.getId()}' tried to report a fix, but its meta does not specify that it has a fix`,
                );
            }

            const fix = report.fix(this.fixGenerator);

            if (!isNull(fix)) {
                problem.fix = fix;
            }
        }

        if (report.suggest) {
            if (!ruleInstance.hasSuggestions()) {
                throw new Error(
                    // eslint-disable-next-line max-len
                    `Rule '${ruleInstance.getId()}' tried to report suggestions, but its meta does not specify that it has suggestions`,
                );
            }

            problem.suggestions = [];

            for (const suggestion of report.suggest) {
                const fix = suggestion.fix(this.fixGenerator);

                if (isNull(fix)) {
                    continue;
                }

                problem.suggestions.push({
                    ...suggestion,
                    fix,
                });
            }
        }

        this.problems.push(problem);
    }

    private summarizeProblems(): LinterResult {
        let warningCount = 0;
        let errorCount = 0;
        let fatalErrorCount = 0;

        for (const problem of this.problems) {
            if (problem.severity === LinterRuleSeverity.Warning) {
                warningCount += 1;
            } else if (problem.severity === LinterRuleSeverity.Error) {
                errorCount += 1;
            }

            if (problem.fatal) {
                fatalErrorCount += 1;
            }
        }

        return {
            problems: this.problems,
            warningCount,
            errorCount,
            fatalErrorCount,
        };
    }

    public async lint(): Promise<LinterResult> {
        await this.ruleRegistry.loadRules();

        this.sourceCodeWalker.walk(this.visitorCollection.getVisitors());

        const applier = new LinterInlineDisableApplier(this.disableComments, {
            keepFatal: true,
            // sameLineTakesEffect: true,
        });

        applier.filterInPlace(this.problems);

        return this.summarizeProblems();
    }

    private onParseError(error: LinterSourceCodeError): void {
        this.problems.push({
            message: error.message,
            position: error.location,
            severity: LinterRuleSeverity.Error,
            fatal: true,
        });
    }

    private onConfigComment(node: ConfigCommentRule): void {
        const command = node.command.value;

        switch (command) {
            case LinterConfigCommentType.Main: {
                // e.g. `! aglint` - it does not make sense, so we just ignore it
                if (!node.params || node.params.type !== 'ConfigNode') {
                    return;
                }

                // Apply config comment
                // e.g. `! aglint "rule-1": ["warn", { "option1": "value1" }], "rule-2": "off"`
                try {
                    const rulesConfig = v.parse(linterRulesConfigSchema, node.params.value);
                    this.ruleRegistry.applyConfig(rulesConfig);
                } catch (e: unknown) {
                    // its safe to use !, position is guaranteed to be not null
                    const range = this.getOffsetRangeForNode(node)!;
                    const position = this.sourceCode.getLinterPositionRangeFromOffsetRange(range)!;
                    this.problems.push({
                        severity: LinterRuleSeverity.Error,
                        message: getErrorMessage(e),
                        position,
                        fatal: true,
                    });
                }
                break;
            }

            case LinterConfigCommentType.Disable: {
                // e.g. `! aglint-disable rule-1 rule-2`
                if (node.params && node.params.type === 'ParameterList') {
                    for (const param of node.params.children) {
                        if (param) {
                            const range = this.getOffsetRangeForNode(param)!;
                            const position = this.sourceCode.getLinterPositionRangeFromOffsetRange(range)!;
                            this.disableComments.push({
                                commentNode: node,
                                command,
                                position,
                                ruleId: param.value,
                            });
                        }
                    }

                    break;
                }

                // `! aglint-disable`
                this.disableComments.push({
                    commentNode: node,
                    command,
                    position: this.sourceCode.getLinterPositionRangeFromOffsetRange(this.getOffsetRangeForNode(node)!)!,
                });
                break;
            }

            case LinterConfigCommentType.Enable: {
                // e.g. `! aglint-enable rule-1 rule-2`
                if (node.params && node.params.type === 'ParameterList') {
                    for (const param of node.params.children) {
                        if (param) {
                            const range = this.getOffsetRangeForNode(param)!;
                            const position = this.sourceCode.getLinterPositionRangeFromOffsetRange(range)!;
                            this.disableComments.push({
                                commentNode: node,
                                command,
                                position,
                                ruleId: param.value,
                            });
                        }
                    }

                    break;
                }

                // `! aglint-enable`
                this.disableComments.push({
                    commentNode: node,
                    command,
                    position: this.sourceCode.getLinterPositionRangeFromOffsetRange(this.getOffsetRangeForNode(node)!)!,
                });
                break;
            }

            case LinterConfigCommentType.DisableNextLine: {
                // e.g. `! aglint-disable-next-line rule-1 rule-2`
                if (node.params && node.params.type === 'ParameterList') {
                    for (const param of node.params.children) {
                        if (param) {
                            const range = this.getOffsetRangeForNode(param)!;
                            const position = this.sourceCode.getLinterPositionRangeFromOffsetRange(range)!;
                            this.disableComments.push({
                                commentNode: node,
                                command,
                                position,
                                ruleId: param.value,
                            });
                        }
                    }

                    break;
                }

                // `! aglint-disable-next-line`
                this.disableComments.push({
                    commentNode: node,
                    command,
                    position: this.sourceCode.getLinterPositionRangeFromOffsetRange(this.getOffsetRangeForNode(node)!)!,
                });

                break;
            }

            default:
                break;
        }
    }
}
