// import { defaultParserOptions, DomainListParser } from '@adguard/agtree/parser';
import { type CssNode, List, parse as parseCss } from '@adguard/ecss-tree';

import { type LinterConfig, type LinterSubParsersConfig, type Parser } from '../linter/config';
import { type AnyLinterResult, LinterFixer } from '../linter/fixer';
import { Linter, type LinterRunOptions } from '../linter/linter';
import { type LinterRule } from '../linter/rule';

import { type CacheFileData, getFileHash, LinterCacheStrategy } from './cache';
import { type LinterCliConfig } from './cli-options';

const fsPromises = import('node:fs/promises');
const { readFile, writeFile } = await fsPromises;

export type LinterWorkerTask = {
    filePath: string;
    cwd: string;
    linterConfig: LinterConfig;
    fileCacheData?: CacheFileData;
};

export type LinterWorkerTasks = {
    tasks: LinterWorkerTask[];
    cliConfig: LinterCliConfig;
};

export type LinterWorkerResult = {
    linterResult: AnyLinterResult;
    fromCache: boolean;
    fileHash?: string;
};

export type LinterWorkerResults = {
    results: LinterWorkerResult[];
};

const cssParser: Parser = {
    name: '@adguard/ecss-tree',
    parse: ((source: string, offset: number, line: number, lineStartOffset: number) => {
        return parseCss(source, {
            context: 'selectorList',
            positions: true,
            offset,
            line,
            column: offset - lineStartOffset,
        });
    }),
    nodeTypeKey: 'type',
    childNodeKey: 'children',
    nodeTransformer: (node: CssNode) => {
        if ('children' in node) {
            const maybeChildren = (node as { children?: unknown }).children;

            if (maybeChildren instanceof List) {
                // eslint-disable-next-line no-param-reassign
                (node as { children: unknown }).children = maybeChildren.toArray();
            }
        }
        return node;
    },
    getStartOffset: (node: CssNode) => {
        return node.loc!.start.offset;
    },
    getEndOffset: (node: CssNode) => {
        return node.loc!.end.offset;
    },
};

export const commonSubParsers: LinterSubParsersConfig = {
    'ElementHidingRuleBody > Value.selectorList': cssParser,
    'CssInjectionRuleBody > Value.selectorList': cssParser,
    // Problematic with regex values in domain modifiers,
    // their parsing should be improved, see https://github.com/AdguardTeam/tsurlfilter/issues/121

    // 'Modifier[name.value="domain"] > Value.value': {
    //     name: '@adguard/agtree',
    //     parse: ((source: string, offset: number) => {
    //         return DomainListParser.parse(
    //             source,
    //             defaultParserOptions,
    //             offset,
    //             '|',
    //         );
    //     }),
    //     nodeTypeKey: 'type',
    //     childNodeKey: 'children',
    // },
};

const ruleCache = new Map<string, LinterRule>();

const runLinterWorker = async (tasks: LinterWorkerTasks): Promise<LinterWorkerResults> => {
    const promises = tasks.tasks.map(async (task): Promise<LinterWorkerResult> => {
        // Check if we have valid cached data
        if (tasks.cliConfig.cache && task.fileCacheData) {
            const strategy = tasks.cliConfig.cacheStrategy!;
            let cacheValid = false;
            let fileHash: string | undefined;

            if (strategy === LinterCacheStrategy.Metadata) {
                // For metadata strategy, executor already validated mtime/size
                cacheValid = true;
            } else if (strategy === LinterCacheStrategy.Content) {
                // For content strategy, read file and check hash
                const content = await readFile(task.filePath, 'utf8');
                fileHash = getFileHash(content);
                cacheValid = task.fileCacheData.contentHash === fileHash;

                // If cache valid and fix mode, apply fixes from cached result
                if (cacheValid && tasks.cliConfig.fix) {
                    const fixedSource = LinterFixer.applyFixesToResult({
                        linterResult: task.fileCacheData.linterResult,
                        sourceContent: content,
                        maxFixRounds: tasks.cliConfig.maxFixRounds,
                        categories: tasks.cliConfig.fixTypes ? new Set(tasks.cliConfig.fixTypes) : undefined,
                        ruleIds: tasks.cliConfig.fixRules ? new Set(tasks.cliConfig.fixRules) : undefined,
                    });

                    if (fixedSource !== content) {
                        await writeFile(task.filePath, fixedSource);
                    }
                }
            }

            if (cacheValid) {
                return {
                    linterResult: task.fileCacheData.linterResult,
                    fromCache: true,
                    fileHash,
                };
            }
        }

        // Cache miss or no cache - read file and lint
        const content = await readFile(task.filePath, 'utf8');
        let fileHash: string | undefined;

        // Compute hash for content strategy
        if (tasks.cliConfig.cache && tasks.cliConfig.cacheStrategy === LinterCacheStrategy.Content) {
            fileHash = getFileHash(content);
        }

        const commonLinterRunOptions: LinterRunOptions = {
            fileProps: {
                filePath: task.filePath,
                content,
                cwd: task.cwd,
            },
            config: task.linterConfig,
            loadRule: async (ruleName) => {
                if (ruleCache.has(ruleName)) {
                    return ruleCache.get(ruleName);
                }

                const rule = (await import(`../rules/${ruleName}.js`)).default;
                ruleCache.set(ruleName, rule);

                return rule;
            },
            subParsers: commonSubParsers,
        };

        if (tasks.cliConfig.fix) {
            const linterResult = await LinterFixer.lintWithFixes({
                ...commonLinterRunOptions,
                maxFixRounds: tasks.cliConfig.maxFixRounds,
                categories: tasks.cliConfig.fixTypes ? new Set(tasks.cliConfig.fixTypes) : undefined,
                ruleIds: tasks.cliConfig.fixRules ? new Set(tasks.cliConfig.fixRules) : undefined,
            });

            if (linterResult.fixedSource !== content) {
                await writeFile(task.filePath, linterResult.fixedSource);
            }

            return {
                linterResult,
                fromCache: false,
                fileHash,
            };
        }

        return {
            linterResult: await Linter.lint(commonLinterRunOptions),
            fromCache: false,
            fileHash,
        };
    });

    return {
        results: await Promise.all(promises),
    };
};

export default runLinterWorker;
