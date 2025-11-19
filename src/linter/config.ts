import { AdblockSyntax } from '@adguard/agtree';
import * as v from 'valibot';

import { linterRuleConfigSchema } from './rule';
import { anyNodeSchema } from './source-code/visitor-collection';

/**
 * Default key name used to identify node types in ASTs.
 */
export const DEFAULT_TYPE_KEY = 'type';

/**
 * Default key name used to access child nodes in ASTs.
 */
export const DEFAULT_CHILD_KEYS = ['children'];

const parseFunctionSchema = v.pipe(
    v.function(),
    v.args(v.tuple([
        // source
        v.pipe(v.string()),
        // offset
        v.pipe(v.number()),
        // line
        v.pipe(v.number()),
        // lineStartOffset
        v.pipe(v.number()),
    ])),
    v.returns(anyNodeSchema),
);

const getOffsetFromNodeSchema = v.pipe(
    v.function(),
    v.args(v.tuple([
        // node
        v.pipe(anyNodeSchema),
    ])),
    v.returns(v.number()),
);

/**
 * Retrieves a character offset (either start or end) from a given AST node.
 *
 * Used by sub-parsers to determine which portion of the main source
 * corresponds to a particular node.
 *
 * @param node The AST node from which to extract the offset.
 *
 * @returns The absolute character offset within the source code.
 */
export type GetOffsetFromNode = v.InferOutput<typeof getOffsetFromNodeSchema>;

const parserSchema = v.object({
    /**
     * Optional human-readable name of the parser.
     * Used primarily for debugging and logging.
     */
    name: v.optional(v.string()),

    /**
     * The function used to parse a given source slice into a sub-AST.
     */
    parse: parseFunctionSchema,

    /**
     * The key used to identify node types within the sub-AST.
     * For example, "type" for ESTree-like ASTs.
     */
    nodeTypeKey: v.string(),

    /**
     * The key (or keys) used to access arrays of child nodes within the sub-AST.
     * For example, ["children"], ["body"], or ["children", "comments"] for multiple keys.
     */
    childNodeKeys: v.array(v.string()),

    /**
     * Optional function that returns the start offset of a node in the main source.
     * Used to determine the slice of code passed to the sub-parser.
     */
    getStartOffset: v.optional(getOffsetFromNodeSchema),

    /**
     * Optional function that returns the end offset of a node in the main source.
     * Used to determine the slice of code passed to the sub-parser.
     */
    getEndOffset: v.optional(getOffsetFromNodeSchema),
});

/**
 * Defines a sub-parser configuration, which describes how a specific parser
 * should process a subset of the main AST.
 *
 * Each parser is associated with a unique `namespace` and is invoked
 * when a node matches a registered selector.
 */
export type Parser = v.InferOutput<typeof parserSchema>;

/**
 * Defines the signature of a sub-parser function.
 * A sub-parser takes a source code slice and contextual offset information,
 * and returns an AST object representing the parsed structure.
 *
 * @param source The portion of source code to parse.
 * @param offset The absolute start offset of the source slice in the original file.
 * @param line The zero-based line number corresponding to the slice start position.
 * @param lineStartOffset The absolute offset of the line start that contains the slice start.
 *
 * @returns The parsed AST object.
 */
export type ParseFunction = v.InferOutput<typeof parseFunctionSchema>;

/**
 * Schema for validating the rules configuration object.
 */
export const linterRulesConfigSchema = v.record(v.string(), linterRuleConfigSchema);

/**
 * Configuration object mapping rule names to their settings.
 *
 * @example
 * ```typescript
 * const rulesConfig: LinterRulesConfig = {
 *   'no-short-rules': 'error',
 *   'scriptlet-quotes': ['warn', { prefer: 'double' }]
 * };
 * ```
 */
export type LinterRulesConfig = v.InferOutput<typeof linterRulesConfigSchema>;

/**
 * Schema for validating the sub-parsers configuration object.
 */
export const linterSubParsersConfigSchema = v.record(v.string(), parserSchema);

/**
 * Configuration object mapping CSS selectors to sub-parser definitions.
 *
 * Each key is a selector that identifies which AST nodes should be parsed
 * by the corresponding sub-parser.
 *
 * @example
 * ```typescript
 * const subParsers: LinterSubParsersConfig = {
 *   'ElementHidingRuleBody > Value.selectorList': cssParser,
 *   'CssInjectionRuleBody > Value.declarationList': cssParser
 * };
 * ```
 */
export type LinterSubParsersConfig = v.InferOutput<typeof linterSubParsersConfigSchema>;

const adblockSyntaxSchema = v.enum(AdblockSyntax);

/**
 * Schema for validating an array of adblock syntax types.
 */
export const syntaxArraySchema = v.array(adblockSyntaxSchema);

/**
 * Schema for validating the complete linter configuration.
 */
export const linterConfigSchema = v.object({
    /**
     * Map of rule names to their configurations.
     */
    rules: linterRulesConfigSchema,

    /**
     * Whether inline configuration comments are allowed.
     * Defaults to true.
     */
    allowInlineConfig: v.optional(v.boolean(), true),

    /**
     * Array of adblock syntaxes to support.
     * Defaults to [AdblockSyntax.Common].
     */
    syntax: v.optional(syntaxArraySchema, [AdblockSyntax.Common]),

    /**
     * Whether to report unused disable directives as problems.
     * Defaults to false.
     */
    reportUnusedDisableDirectives: v.optional(v.boolean(), false),

    /**
     * Severity level for unused disable directive problems.
     * Only applies when reportUnusedDisableDirectives is true.
     * Defaults to 'warn'.
     */
    unusedDisableDirectivesSeverity: v.optional(
        v.union([v.literal('warn'), v.literal('error')]),
        'warn',
    ),
});

/**
 * Linter configuration before validation and default value application.
 */
export type LinterConfig = v.InferInput<typeof linterConfigSchema>;

/**
 * Linter configuration after validation with all defaults applied.
 */
export type LinterConfigParsed = v.InferOutput<typeof linterConfigSchema>;
