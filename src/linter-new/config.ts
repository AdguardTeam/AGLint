import { AdblockSyntax } from '@adguard/agtree';
import * as v from 'valibot';

import { linterRuleConfigSchema } from './rule';
import { anyNodeSchema } from './source-code/visitor-collection';

export const DEFAULT_TYPE_KEY = 'type';
export const DEFAULT_CHILD_KEY = 'children';

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
 * @returns The absolute character offset within the source code.
 */
export type GetOffsetFromNode = v.InferOutput<typeof getOffsetFromNodeSchema>;

const nodeTransformerFunctionSchema = v.pipe(
    v.function(),
    v.args(v.tuple([
        // node
        v.pipe(anyNodeSchema),
    ])),
    v.returns(anyNodeSchema),
);

export type NodeTransformerFunction = v.InferOutput<typeof nodeTransformerFunctionSchema>;

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
     * The key used to access arrays of child nodes within the sub-AST.
     * For example, "children" or "body".
     */
    childNodeKey: v.string(),

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

    /**
     * Optional transformer applied to each node of the sub-AST before traversal.
     * Useful for normalizing node shapes or adding metadata.
     *
     * @param node The node to transform.
     * @returns The transformed node object.
     */
    nodeTransformer: v.optional(nodeTransformerFunctionSchema),
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

export const linterRulesConfigSchema = v.record(v.string(), linterRuleConfigSchema);

export type LinterRulesConfig = v.InferOutput<typeof linterRulesConfigSchema>;

const linterSubParsersConfigSchema = v.record(v.string(), parserSchema);

export type LinterSubParsersConfig = v.InferOutput<typeof linterSubParsersConfigSchema>;

const adblockSyntaxSchema = v.enum(AdblockSyntax);

export const linterConfigSchema = v.object({
    rules: linterRulesConfigSchema,
    subParsers: linterSubParsersConfigSchema,
    allowInlineConfig: v.optional(v.boolean()),
    syntax: v.optional(v.array(adblockSyntaxSchema)),
    reportUnusedDisableDirectives: v.optional(v.boolean()),
});

export type LinterConfig = v.InferOutput<typeof linterConfigSchema>;
