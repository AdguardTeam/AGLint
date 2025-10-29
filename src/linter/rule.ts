// rule.ts
import { type AdblockSyntax } from '@adguard/agtree';
import * as v from 'valibot';

import { type LinterFixCommand, type LinterFixGenerator } from './source-code/fix-generator';
import { type LinterOffsetRange, type LinterPositionRange, type LinterSourceCode } from './source-code/source-code';
import { type Visitor } from './source-code/visitor-collection';

/* =========================
 * Severity
 * ========================= */

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

const linterRuleSeverityMap = {
    off: LinterRuleSeverity.Off,
    warn: LinterRuleSeverity.Warning,
    error: LinterRuleSeverity.Error,
} as const;

const linterRuleNumberSeveritySchema = v.enum(LinterRuleSeverity);

const linterRuleTextSeveritySchema = v.pipe(
    v.picklist([
        'off',
        'warn',
        'error',
    ] as const),
    v.transform((s) => linterRuleSeverityMap[s]),
);

const linterRuleSeveritySchema = v.union([
    linterRuleNumberSeveritySchema,
    linterRuleTextSeveritySchema,
]);

/**
 * Schema for validating rule configuration.
 * Can be a severity level or a tuple with severity and options.
 */
export const linterRuleConfigSchema = v.union([
    linterRuleSeveritySchema,
    v.looseTuple([
        linterRuleSeveritySchema,
    ]),
]);

/**
 * Type representing a rule configuration value.
 */
export type LinterRuleConfig = v.InferOutput<typeof linterRuleConfigSchema>;

/* =========================
 * Config schema helpers (Valibot → TS types)
 * ========================= */

type TupleOf<Elements extends readonly v.BaseSchema<any, any, any>[]> =
  v.TupleSchema<Elements, undefined>;

export type { TupleOf };

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
) => v.tuple(els) as TupleOf<Elements>;

/**
 * Default empty tuple schema for rules without configuration.
 */
export const DEFAULT_TUPLE_SCHEMA: TupleOf<[]> = v.tuple([]);

/**
 * Base configuration type for rules.
 */
export type LinterRuleBaseConfig = v.InferInput<typeof DEFAULT_TUPLE_SCHEMA>;

type ConfigOf<Elements extends readonly v.BaseSchema<any, any, any>[]> =
  v.InferOutput<TupleOf<Elements>>;

export type { ConfigOf };

/* =========================
 * Rule types / metadata
 * ========================= */

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

const linterRuleTypeSchema = v.enum(LinterRuleType);

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
    config: v.optional(linterRuleConfigSchema),
});

/**
 * Type representing a rule example.
 */
export type LinterRuleExample = v.InferOutput<typeof linterRuleExampleSchema>;

/**
 * Represents the documentation of a linter rule.
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
type LinterRuleDocs = v.InferOutput<typeof linterRuleDocsSchema>;

/**
 * Schema for rule message templates.
 */
export const linterRuleMessagesSchema = v.record(v.string(), v.string());

/**
 * Type for rule message templates mapping message IDs to template strings.
 */
export type LinterRuleMessages = v.InferOutput<typeof linterRuleMessagesSchema>;

/**
 * Schema for validating rule metadata.
 */
export const linterRuleMetaSchema = v.object({
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
     * No need to define it here, as it is runtime-attached in defineRule.
     */
    configSchema: v.optional(v.any()),

    /**
     * Default configuration for the rule.
     */
    defaultConfig: v.optional(v.any()),

    /**
     * The linter version in which this rule was added.
     */
    version: v.optional(v.string()),
});

/* =========================
 * Message typing (messages → messageId keys)
 * ========================= */

/**
 * Schema for message template data.
 */
export const linterMessageDataSchema = v.record(v.string(), v.unknown());

/**
 * Type for data passed to message templates.
 */
export type LinterMessageData = v.InferOutput<typeof linterMessageDataSchema>;

type MessageIdOf<Msgs> =
  Msgs extends Record<infer K extends string, string> ? K : never;

type WithRuleMessages<Msgs, T extends {} = {}> =
  | (T & { message: string; messageId?: never; data?: never })
  | (T & { message?: never; messageId: MessageIdOf<Msgs>; data?: LinterMessageData });

/**
 * Back-compat alias for code that still uses an unconstrained `messageId: string`.
 */
export type WithMessages<T extends {} = {}> = WithRuleMessages<Record<string, string>, T>;

/* =========================
 * Report / Suggestion / Fix types
 * ========================= */

type FixerFunction = (fixer: LinterFixGenerator) => LinterFixCommand | null;

type SuggestionBase = { fix: FixerFunction };

/**
 * Represents a suggestion for fixing a problem.
 */
export type Suggestion<Msgs = Record<string, string>> = WithRuleMessages<Msgs, SuggestionBase>;

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

type LinterProblemReportPositions =
  | { node: any; position?: LinterPositionRange }
  | { node?: any; position: LinterPositionRange }
  | { node: any; position: LinterPositionRange };

/**
 * Report object passed to context.report() by rules.
 */
export type LinterProblemReport<Msgs = Record<string, string>> =
  WithRuleMessages<Msgs, LinterProblemReportFixes<Msgs> & LinterProblemReportPositions>;

/* =========================
 * Rule context / visitors
 * ========================= */

/**
 * Base context available to all rules.
 */
export type LinterRuleBaseContext = {
    filePath?: string;
    cwd?: string;
    sourceCode: LinterSourceCode;
    syntax?: AdblockSyntax[];
    getOffsetRangeForNode(node: any): LinterOffsetRange | null;
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

type LinterRuleCreatorFunction<
    Elements extends readonly v.BaseSchema<any, any, any>[] = [],
    Msgs extends Record<string, string> = Record<string, string>,
> = (context: LinterRuleContext<Elements, Msgs>) => LinterRuleVisitors;

/**
 * Interface representing a complete linter rule.
 */
export interface LinterRule<
    Elements extends readonly v.BaseSchema<any, any, any>[] = [],
    Msgs extends Record<string, string> = Record<string, string>,
> {
    meta: {
        type: LinterRuleType;
        docs: LinterRuleDocs;
        hasSuggestions?: boolean;
        hasFix?: boolean;
        messages?: Msgs;
        configSchema?: TupleOf<Elements>;
        defaultConfig?: ConfigOf<Elements>;
        correctExamples?: LinterRuleExample[];
        incorrectExamples?: LinterRuleExample[];
        version?: string;
    };
    create: LinterRuleCreatorFunction<Elements, Msgs>;
}

/* =========================
 * defineRule (overloads keep DX nice)
 * ========================= */

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

/* =========================
 * (Optional) runtime schema for whole rule shape
 * – useful if you want to validate dynamic rule modules.
 * ========================= */

/**
 * Runtime schema for validating dynamically loaded rule modules.
 */
export const linterRuleSchema = v.object({
    meta: linterRuleMetaSchema,
    create: v.pipe(v.any(), v.check((x) => typeof x === 'function', 'create must be a function')),
});
