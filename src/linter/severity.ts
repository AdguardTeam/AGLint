import { literal, union } from "superstruct";

/**
 * Represents linter rule severity
 */
export enum LinterRuleSeverity {
    /** Rule turned off */
    Off = 0,

    /** Warning */
    Warn = 1,

    /** Error */
    Error = 2,

    /** Fatal error (parsing error, for example) */
    Fatal = 3,
}

/**
 * Superstruct schema for the linter rule severity (used for validation)
 */
export const severitySchema = union([
    // Numeric values
    literal(LinterRuleSeverity.Off),
    literal(LinterRuleSeverity.Warn),
    literal(LinterRuleSeverity.Error),
    literal(LinterRuleSeverity.Fatal),

    // String values
    literal("off"),
    literal("warn"),
    literal("error"),
    literal("fatal"),
]);
