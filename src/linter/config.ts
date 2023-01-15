/**
 * Linter configuration
 */

import { boolean, object, optional, record, string } from "superstruct";
import { LinterRuleConfig, linterRuleConfigSchema } from "./rule";

/**
 * Represents linter configuration
 */
export interface LinterConfig {
    /**
     * Whether to allow inline configuration or not
     *
     * @example
     * ```adblock
     * ! aglint-disable-next-line
     * ```
     */
    allowInlineConfig?: boolean;

    /**
     * A map of rule names to their configuration
     */
    rules?: { [key: string]: LinterRuleConfig };
}

/**
 * Superstruct schema for the linter rule config (used for validation)
 */
export const linterConfigSchema = object({
    allowInlineConfig: optional(boolean()),
    rules: optional(record(string(), linterRuleConfigSchema)),
});

/**
 * Default linter configuration
 */
export const defaultLinterConfig: LinterConfig = {
    allowInlineConfig: true,
};
