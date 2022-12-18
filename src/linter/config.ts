/**
 * Linter configuration
 */

import { LinterRuleConfig } from "./rule";

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
 * Default linter configuration
 */
export const defaultLinterConfig: LinterConfig = {
    allowInlineConfig: true,
};
