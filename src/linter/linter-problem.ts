import * as v from 'valibot';

import { linterMessageDataSchema, LinterRuleSeverity, LinterRuleType } from './rule';
import { linterFixCommandSchema } from './source-code/fix-generator';
import { linterPositionRangeSchema } from './source-code/source-code';

export const linterSuggestionSchema = v.object({
    fix: linterFixCommandSchema,
    message: v.string(),
    messageId: v.optional(v.string()),
    data: v.optional(linterMessageDataSchema),
});

export type LinterSuggestion = v.InferOutput<typeof linterSuggestionSchema>;

export const linterProblemSchema = v.object({
    /**
     * The category of this problem.
     */
    category: v.optional(v.enum(LinterRuleType)),
    /**
     * Name of the linter rule that generated this problem.
     */
    ruleId: v.optional(v.string()),
    /**
     * The message of this problem.
     */
    message: v.string(),
    /**
     * The message ID of this problem.
     */
    messageId: v.optional(v.string()),
    /**
     * The data of this problem.
     */
    data: v.optional(linterMessageDataSchema),
    /**
     * The severity of this problem.
     */
    severity: v.enum(LinterRuleSeverity),
    /**
     * Whether this problem is fatal.
     * This value can be set only by the linter core for fatal errors,
     * like parse errors.
     */
    fatal: v.optional(v.boolean()),
    /**
     * The location of the problem.
     */
    position: linterPositionRangeSchema,
    /**
     * Fix command that can be applied to fix this problem.
     */
    fix: v.optional(linterFixCommandSchema),
    /**
     * Suggestions that can be applied to fix this problem.
     */
    suggestions: v.optional(v.array(linterSuggestionSchema)),
});

/**
 * Represents a problem given by the linter.
 */
export type LinterProblem = v.InferOutput<typeof linterProblemSchema>;
