import { Struct, define, is, union } from "superstruct";
import { GenericRuleContext } from ".";
import { AnySeverity, severity } from "./severity";

/**
 * Type definition for the linter rule config, which can be:
 * - severity itself (number or string): `severity`
 * - one-element array with severity as the first element: `[severity]`
 * - n-element array with severity as the first element and other options as the rest: `[severity, ...options]`
 */
export type LinterRuleConfig = AnySeverity | LinterRuleConfigArray;

/**
 * Type definition for the linter rule config array, which can be:
 * - one-element array with severity as the first element: `[severity]`
 * - n-element array with severity as the first element and other options as the rest: `[severity, ...options]`
 */
export type LinterRuleConfigArray = [AnySeverity, ...unknown[]];

/**
 * Own Superstruct type definition for the linter rule config array
 *
 * @returns Defined struct
 * @see {@link https://github.com/ianstormtaylor/superstruct/blob/main/src/structs/types.ts}
 */
function configArray(): Struct<LinterRuleConfigArray, null> {
    return define("configArray", (value) => {
        if (Array.isArray(value)) {
            // First element should be severity
            if (is(value[0], severity())) {
                return true;
            } else {
                return `Expected a severity as first element, but received ${typeof value[0]}`;
            }
        } else {
            return `Expected an array, but received ${typeof value}`;
        }
    });
}

/**
 * Superstruct schema for the linter rule config (used for validation)
 *
 * Possible values:
 * - severity itself (number or string): `severity`
 * - one-element array with severity as the first element: `[severity]`
 * - n-element array with severity as the first element and other options as the rest: `[severity, ...options]`
 */
export const linterRuleConfigSchema = union([severity(), configArray()]);

/**
 * Represents the metadata of a linter rule configuration
 */
export interface LinterRuleConfigMeta {
    /**
     * Default configuration of the rule
     */
    default: unknown;

    /**
     * Superstruct schema for the rule configuration (used for validation)
     */
    schema: Struct;
}

/**
 * Represents the metadata of a linter rule
 */
export interface LinterRuleMeta {
    /**
     * Linter rule severity. It can be off, warn, error or fatal.
     */
    severity: AnySeverity;

    /**
     * Configuration metadata (if the rule has any configuration)
     */
    config?: LinterRuleConfigMeta;
}

/**
 * Represents what events a linter rule can handle
 */
export interface LinterRuleEvents {
    /**
     * Called before analyzing a filter list (before any rule is analyzed).
     * You can retrieve the filter list and other necessary information from the context.
     *
     * @param context - Linter context
     */
    onStartFilterList?: (context: GenericRuleContext) => void;

    /**
     * Called after analyzing a filter list (after all rules are analyzed).
     * You can retrieve the filter list and other necessary information from the context.
     *
     * @param context - Linter context
     */
    onEndFilterList?: (context: GenericRuleContext) => void;

    /**
     * Called when analyzing an adblock rule. This event is called for each rule, including comments.
     * You can retrieve the adblock rule and other necessary information from the context.
     *
     * @param context - Linter context
     */
    onRule?: (context: GenericRuleContext) => void;
}

/**
 * Represents an AGLint rule
 */
export interface LinterRule {
    /**
     * Basic data of the rule (metadata)
     */
    meta: LinterRuleMeta;

    /**
     * Events belonging to the rule
     */
    events: LinterRuleEvents;
}
