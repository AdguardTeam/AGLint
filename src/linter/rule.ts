import { type PlatformsByProduct } from '@adguard/agtree';
import * as v from 'valibot';

import { type ModuleDebug } from '../utils/debug';

import { type LinterFixCommand, type LinterFixGenerator } from './source-code/fix-generator';
import { type LinterOffsetRange, type LinterPositionRange, type LinterSourceCode } from './source-code/source-code';
import { type Visitor } from './source-code/visitor-collection';

/**
 * Represents the severity of a linter rule.
 */
export enum LinterRuleSeverity {
    /**
     * The rule is disabled.
     */
    Off,

    /**
     * The rule is a warning.
     */
    Warning,

    /**
     * The rule is an error.
     */
    Error,
}

/**
 * Mapping from text severity strings to enum values.
 */
const linterRuleSeverityMap = {
    off: LinterRuleSeverity.Off,
    warn: LinterRuleSeverity.Warning,
    error: LinterRuleSeverity.Error,
} as const;

/**
 * String literal type for text-based severity values.
 */
type LinterRuleTextSeverity = keyof typeof linterRuleSeverityMap;

/**
 * Schema for numeric severity values.
 */
const linterRuleNumberSeveritySchema = v.pipe(
    v.enum(LinterRuleSeverity),
    v.description('Rule severity as numeric value'),
);

/**
 * Schema for text-based severity values.
 */
const linterRuleTextSeveritySchema = v.pipe(
    v.picklist(Object.keys(linterRuleSeverityMap) as [LinterRuleTextSeverity, ...LinterRuleTextSeverity[]]),
    v.description('Rule severity as string'),
);

/**
 * Schema accepting either numeric or text severity values.
 */
const linterRuleSeveritySchema = v.pipe(
    v.union([
        linterRuleNumberSeveritySchema,
        linterRuleTextSeveritySchema,
    ]),
    v.description('Rule severity level controlling whether the rule is disabled, reports warnings, or reports errors'),
);

/**
 * Schema for validating rule configuration.
 * Can be a severity level or a tuple with severity and options.
 */
export const linterRuleConfigSchema = v.pipe(
    v.union([
        linterRuleSeveritySchema,
        v.looseTuple([
            linterRuleSeveritySchema,
        ]),
    ]),
    v.description(
        'Rule configuration: either a severity level alone, or an array with severity and additional options',
    ),
);

/**
 * Type representing a rule configuration value.
 * Inferred from the schema to avoid duplication.
 */
export type LinterRuleConfig = v.InferOutput<typeof linterRuleConfigSchema>;

/**
 * Reverse mapping from severity enum values to text representation.
 */
const linterRuleSeverityToTextMap: Record<LinterRuleSeverity, LinterRuleTextSeverity> = {
    [LinterRuleSeverity.Off]: 'off',
    [LinterRuleSeverity.Warning]: 'warn',
    [LinterRuleSeverity.Error]: 'error',
};

/**
 * Helper function to normalize text severity to enum value.
 * This provides the same runtime behavior as the previous transform.
 *
 * @param severity The severity value to normalize.
 *
 * @returns The normalized severity as LinterRuleSeverity enum.
 */
export function normalizeSeverity(
    severity: LinterRuleSeverity | LinterRuleTextSeverity,
): LinterRuleSeverity {
    if (typeof severity === 'string') {
        return linterRuleSeverityMap[severity];
    }
    return severity;
}

/**
 * Helper function to convert enum severity to text format.
 *
 * @param severity The severity enum value.
 *
 * @returns The text representation of the severity.
 */
export function severityToText(severity: LinterRuleSeverity): LinterRuleTextSeverity {
    return linterRuleSeverityToTextMap[severity];
}

/**
 * Type alias for tuple schemas used in rule configuration.
 * Provides better type safety and IDE support.
 */
export type TupleOf<Elements extends readonly v.BaseSchema<any, any, any>[]> =
  v.TupleSchema<Elements, undefined>;

/**
 * Type alias for extracting the output type from a configuration tuple.
 * Uses Valibot's InferOutput to derive the type automatically.
 */
export type ConfigOf<Elements extends readonly v.BaseSchema<any, any, any>[]> =
  v.InferOutput<TupleOf<Elements>>;

/**
 * Helper to define a configuration schema tuple.
 *
 * @param els Schema elements for the configuration tuple.
 *
 * @returns Typed tuple schema.
 */
export const defineConfigSchema = <
    const Elements extends readonly v.BaseSchema<any, any, any>[],
>(
    ...els: Elements
): TupleOf<Elements> => v.tuple(els) as TupleOf<Elements>;

/**
 * Default empty tuple schema for rules without configuration.
 */
export const DEFAULT_TUPLE_SCHEMA: TupleOf<[]> = v.tuple([]);

/**
 * Base configuration type for rules.
 * Inferred from default tuple schema to avoid duplication.
 */
export type LinterRuleBaseConfig = v.InferOutput<typeof DEFAULT_TUPLE_SCHEMA>;

/**
 * Categories of linter rules.
 */
export enum LinterRuleType {
    /**
     * The rule is a problem.
     */
    Problem = 'problem',

    /**
     * The rule is a suggestion.
     */
    Suggestion = 'suggestion',

    /**
     * The rule is a layout.
     */
    Layout = 'layout',
}

/**
 * Schema for validating rule type values.
 */
const linterRuleTypeSchema = v.enum(LinterRuleType);

/**
 * Schema for rule example configuration (config parameters without severity).
 */
const linterRuleExampleConfigSchema = v.optional(v.array(v.any()));

/**
 * Schema for rule examples.
 */
export const linterRuleExampleSchema = v.object({
    /**
     * Optional name of the example.
     */
    name: v.optional(v.string()),

    /**
     * Code for the example.
     */
    code: v.string(),

    /**
     * Linter rule config for the example.
     */
    // should be configOf without severity
    config: v.optional(linterRuleExampleConfigSchema),
});

/**
 * Type representing a rule example.
 * Inferred from schema to avoid duplication.
 */
export type LinterRuleExample = v.InferOutput<typeof linterRuleExampleSchema>;

/**
 * Schema representing the documentation of a linter rule.
 */
export const linterRuleDocsSchema = v.object({
    /**
     * The name of the rule.
     */
    name: v.string(),

    /**
     * The description of the rule.
     */
    description: v.string(),

    /**
     * Whether the rule is recommended to be enabled.
     */
    recommended: v.boolean(),

    /**
     * The URL of the rule documentation.
     */
    url: v.optional(v.string()),

    /**
     * When to use this rule.
     */
    whenToUseIt: v.optional(v.string()),

    /**
     * When not to use this rule.
     */
    whenNotToUseIt: v.optional(v.string()),
});

/**
 * Type representing the documentation of a linter rule.
 * Inferred from schema to avoid duplication.
 */
export type LinterRuleDocs = v.InferOutput<typeof linterRuleDocsSchema>;

/**
 * Schema for rule message templates.
 */
export const linterRuleMessagesSchema = v.record(v.string(), v.string());

/**
 * Type for rule message templates mapping message IDs to template strings.
 * Inferred from schema to avoid duplication.
 */
export type LinterRuleMessages = v.InferOutput<typeof linterRuleMessagesSchema>;

/**
 * Base schema containing common metadata fields shared between runtime and serializable versions.
 * This schema is used as a foundation for both `linterRuleMetaSchema` and `linterRuleMetaSerializableSchema`.
 */
const linterRuleMetaBaseSchema = v.object({
    /**
     * The type of the rule.
     */
    type: linterRuleTypeSchema,

    /**
     * The documentation of the rule.
     */
    docs: linterRuleDocsSchema,

    /**
     * Examples of incorrect code for the rule.
     */
    incorrectExamples: v.optional(v.array(linterRuleExampleSchema)),

    /**
     * Examples of correct code for the rule.
     */
    correctExamples: v.optional(v.array(linterRuleExampleSchema)),

    /**
     * Whether the rule has suggestions.
     */
    hasSuggestions: v.optional(v.boolean()),

    /**
     * Whether the rule has a fix.
     */
    hasFix: v.optional(v.boolean()),

    /**
     * The messages of the rule.
     */
    messages: v.optional(linterRuleMessagesSchema),

    /**
     * The configuration schema of the rule.
     */
    configSchema: v.optional(v.any()),

    /**
     * The linter version in which this rule was added.
     */
    version: v.optional(v.string()),
});

/**
 * Schema for validating rule metadata.
 * Extends base schema with runtime-only fields.
 */
export const linterRuleMetaSchema = v.object({
    ...linterRuleMetaBaseSchema.entries,

    /**
     * Default configuration for the rule.
     * This field is runtime-only and excluded from serializable schema.
     */
    defaultConfig: v.optional(v.any()),
});

/**
 * Type representing rule metadata.
 * Inferred from schema to avoid duplication.
 */
export type LinterRuleMeta = v.InferOutput<typeof linterRuleMetaSchema>;

/**
 * Schema for validating JSON-serializable rule metadata.
 * Uses the same base schema but excludes runtime-only fields (defaultConfig).
 * The configSchema is serialized to JSON Schema format.
 */
export const linterRuleMetaSerializableSchema = linterRuleMetaBaseSchema;

/**
 * Type representing JSON-serializable rule metadata.
 * Inferred from schema to avoid duplication.
 */
export type LinterRuleMetaSerializable = v.InferOutput<typeof linterRuleMetaSerializableSchema>;

/**
 * Schema for message template data.
 */
export const linterMessageDataSchema = v.record(v.string(), v.unknown());

/**
 * Type for data passed to message templates.
 * Inferred from schema to avoid duplication.
 */
export type LinterMessageData = v.InferOutput<typeof linterMessageDataSchema>;

/**
 * Helper type to extract message ID keys from a message record type.
 */
type MessageIdOf<Msgs> =
  Msgs extends Record<infer K extends string, string> ? K : never;

/**
 * Helper type for objects that can have either a direct message string or a messageId with optional data.
 */
type WithRuleMessages<Msgs, T extends {} = {}> =
  | (T & { message: string; messageId?: never; data?: never })
  | (T & { message?: never; messageId: MessageIdOf<Msgs>; data?: LinterMessageData });

/**
 * Back-compat alias for code that still uses an unconstrained `messageId: string`.
 */
export type WithMessages<T extends {} = {}> = WithRuleMessages<Record<string, string>, T>;

/**
 * Function type for creating fix commands.
 */
export type FixerFunction = (fixer: LinterFixGenerator) => LinterFixCommand | null;

/**
 * Base type for suggestion objects.
 */
type SuggestionBase = { fix: FixerFunction };

/**
 * Represents a suggestion for fixing a problem.
 */
export type Suggestion<Msgs = Record<string, string>> = WithRuleMessages<Msgs, SuggestionBase>;

/**
 * Type defining fix and suggestion fields for problem reports.
 */
type LinterProblemReportFixes<Msgs> = {
    /**
     * Fix for the problem.
     *
     * @param fixer The fixer object.
     *
     * @returns A fix command, an array of fix commands, or an iterable of fix commands.
     */
    fix?: FixerFunction;

    /**
     * Suggestion for the problem.
     *
     * @param fixer The fixer object.
     *
     * @returns A fix command, an array of fix commands, or an iterable of fix commands.
     */
    suggest?: Suggestion<Msgs>[];
};

/**
 * Type defining position information for problem reports.
 * Can specify either node, position, or both.
 */
type LinterProblemReportPositions =
  | { node: any; position?: LinterPositionRange }
  | { node?: any; position: LinterPositionRange }
  | { node: any; position: LinterPositionRange };

/**
 * Report object passed to context.report() by rules.
 */
export type LinterProblemReport<Msgs = Record<string, string>> =
  WithRuleMessages<Msgs, LinterProblemReportFixes<Msgs> & LinterProblemReportPositions>;

/**
 * Base context available to all rules.
 */
export type LinterRuleBaseContext = {
    filePath?: string;
    cwd?: string;
    sourceCode: LinterSourceCode;
    platforms: number;
    platformsByProduct: PlatformsByProduct;
    getOffsetRangeForNode(node: any): LinterOffsetRange | null;
    debug?: ModuleDebug;
};

/**
 * Context object passed to rule create functions.
 */
export type LinterRuleContext<
    Elements extends readonly v.BaseSchema<any, any, any>[] = [],
    Msgs extends Record<string, string> = Record<string, string>,
> = LinterRuleBaseContext & {
    id: string;
    report: (problem: LinterProblemReport<Msgs>) => void;
    config: ConfigOf<Elements>;
};

/**
 * Map of CSS-like selectors to visitor functions.
 */
export type LinterRuleVisitors = { [selector: string]: Visitor };

/**
 * Function type for creating rule visitor functions.
 */
type LinterRuleCreatorFunction<
    Elements extends readonly v.BaseSchema<any, any, any>[] = [],
    Msgs extends Record<string, string> = Record<string, string>,
> = (context: LinterRuleContext<Elements, Msgs>) => LinterRuleVisitors;

/**
 * Type representing a complete linter rule.
 * Inherits base structure from LinterRuleMeta and overrides generic fields.
 */
export type LinterRule<
    Elements extends readonly v.BaseSchema<any, any, any>[] = [],
    Msgs extends Record<string, string> = Record<string, string>,
> = {
    meta: Omit<LinterRuleMeta, 'messages' | 'configSchema' | 'defaultConfig'> & {
        messages?: Msgs;
        configSchema?: TupleOf<Elements>;
        defaultConfig?: ConfigOf<Elements>;
    };
    create: LinterRuleCreatorFunction<Elements, Msgs>;
};

export function defineRule<
    const Elements extends readonly v.BaseSchema<any, any, any>[],
    const Msgs extends Record<string, string> = Record<string, string>,
>(
    rule: Omit<LinterRule<Elements, Msgs>, 'meta'> & {
        meta: Omit<LinterRule<Elements, Msgs>['meta'], 'configSchema'> & {
            configSchema: TupleOf<Elements>;
        };
    },
): LinterRule<Elements, Msgs>;

export function defineRule<
    const Msgs extends Record<string, string> = Record<string, string>,
>(
    rule: Omit<LinterRule<[], Msgs>, 'meta'> & {
        meta: Omit<LinterRule<[], Msgs>['meta'], 'configSchema'> & {
            configSchema?: undefined;
        };
    },
): LinterRule<[], Msgs>;

/**
 * Defines a linter rule with type-safe configuration and message handling.
 *
 * Attaches the config schema to rule metadata for runtime validation.
 *
 * @param rule The rule definition with meta and create function.
 *
 * @returns The complete rule with processed metadata.
 */
export function defineRule(rule: any): any {
    const configSchema = rule?.meta?.configSchema ?? DEFAULT_TUPLE_SCHEMA;
    return {
        ...rule,
        meta: {
            ...rule.meta,
            configSchema,
        },
    };
}

/**
 * Runtime schema for validating dynamically loaded rule modules.
 */
export const linterRuleSchema = v.object({
    meta: linterRuleMetaSchema,
    create: v.pipe(v.any(), v.check((x) => typeof x === 'function', 'create must be a function')),
});
