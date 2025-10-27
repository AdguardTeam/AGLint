import { type AdblockSyntax } from '@adguard/agtree';
import * as v from 'valibot';

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

export const linterRuleConfigSchema = v.union([
    linterRuleSeveritySchema,
    v.looseTuple([
        linterRuleSeveritySchema,
    ]),
]);

export type LinterRuleConfig = v.InferOutput<typeof linterRuleConfigSchema>;

type TupleOf<Elements extends readonly v.BaseSchema<any, any, any>[]> = v.TupleSchema<Elements, undefined>;

type DefaultElements = [];

export const DEFAULT_TUPLE_SCHEMA: TupleOf<[]> = v.tuple([]);

export type LinterRuleBaseConfig = v.InferInput<typeof DEFAULT_TUPLE_SCHEMA>;

/**
 * Represents the type of a linter rule.
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
});

type LinterRuleDocs = v.InferOutput<typeof linterRuleDocsSchema>;

export const linterRuleMessagesSchema = v.record(v.string(), v.string());

type LinterRuleMessages = v.InferOutput<typeof linterRuleMessagesSchema>;

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
});

/**
 * Schema for validating a complete linter rule.
 */
export const linterRuleSchema = v.object({
    /**
     * The metadata of the rule.
     */
    meta: linterRuleMetaSchema,

    /**
     * The create function of the rule.
     */
    create: v.pipe(
        v.any(),
        v.check((value) => typeof value === 'function', 'create must be a function'),
    ),
});

/**
 * Represents the metadata of a linter rule.
 */
export interface LinterRuleMeta<
    Elements extends readonly v.BaseSchema<any, any, any>[] = DefaultElements,
> {
    /**
     * The type of the rule.
     */
    type: LinterRuleType;

    /**
     * The documentation of the rule.
     */
    docs: LinterRuleDocs;

    /**
     * Whether the rule has suggestions.
     */
    hasSuggestions?: boolean;

    /**
     * Whether the rule has a fix.
     */
    hasFix?: boolean;

    /**
     * The messages of the rule.
     */
    messages?: LinterRuleMessages;

    /**
     * The configuration schema of the rule.
     */
    configSchema?: TupleOf<Elements>;
}

export const linterMessageDataSchema = v.record(v.string(), v.unknown());

export type LinterMessageData = v.InferOutput<typeof linterMessageDataSchema>;

export type WithMessages<T extends {} = {}> = T & {
    message: string;
    messageId?: never;
    data?: never;
} | T & {
    message?: never;
    messageId: string;
    data?: LinterMessageData;
};

// eslint-disable-next-line max-len
type FixerFunction = (fixer: LinterFixGenerator) => LinterFixCommand | null;

type LinterProblemReportFixes = {
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
    suggest?: Suggestion[];
};

type LinterProblemReportPositions = {
    /**
     * Node that caused the problem. If provided, the linter will use its offsets to determine the problem location.
     */
    node: any;

    /**
     * The location of the problem.
     */
    position?: LinterPositionRange;
} | {
    /**
     * Node that caused the problem. If provided, the linter will use its offsets to determine the problem location.
     */
    node?: any;

    /**
     * The location of the problem.
     */
    position: LinterPositionRange;
} | {
    /**
     * Node that caused the problem. If provided, the linter will use its offsets to determine the problem location.
     */
    node: any;

    /**
     * The location of the problem.
     */
    position: LinterPositionRange;
};

export type LinterProblemReport = WithMessages<LinterProblemReportFixes & LinterProblemReportPositions>;

type SuggestionBase = {
    fix: FixerFunction;
};

type Suggestion = WithMessages<SuggestionBase>;

type ConfigOf<Elements extends readonly v.BaseSchema<any, any, any>[]> =
  v.InferOutput<TupleOf<Elements>>;

export type LinterRuleBaseContext = {
    filePath?: string;
    cwd?: string;
    sourceCode: LinterSourceCode;
    syntax?: AdblockSyntax[];
    getOffsetRangeForNode(node: any): LinterOffsetRange | null;
};

export type LinterRuleContext<
    Elements extends readonly v.BaseSchema<any, any, any>[] = DefaultElements,
> = LinterRuleBaseContext & {
    id: string;
    report: (problem: LinterProblemReport) => void;
    config: ConfigOf<Elements>;
};

export type LinterRuleVisitors = {
    [key: string]: Visitor;
};

type LinterRuleCreatorFunction<
    Elements extends readonly v.BaseSchema<any, any, any>[] = DefaultElements,
> = (context: LinterRuleContext<Elements>) => LinterRuleVisitors;

/**
 * Represents an AGLint rule.
 */
export interface LinterRule<
    Elements extends readonly v.BaseSchema<any, any, any>[] = DefaultElements,
> {
    meta: LinterRuleMeta<Elements>;
    create: LinterRuleCreatorFunction<Elements>;
}

export function defineRule<
    const Elements extends readonly v.BaseSchema<any, any, any>[],
>(
    rule: Omit<LinterRule<Elements>, 'meta'> & {
        meta: Omit<LinterRule<Elements>['meta'], 'configSchema'> & {
            configSchema: TupleOf<Elements>;
        };
    },
): LinterRule<Elements>;

export function defineRule(
    rule: Omit<LinterRule<DefaultElements>, 'meta'> & {
        meta: Omit<LinterRule<DefaultElements>['meta'], 'configSchema'> & {
            configSchema?: undefined;
        };
    },
): LinterRule<DefaultElements>;

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
