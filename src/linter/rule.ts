import { Struct } from "superstruct";
import { GenericRuleContext } from ".";

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
 * The configuration of the rule can be severity itself, or an array whose first element is severity
 */
export type LinterRuleConfig = LinterRuleSeverity | [LinterRuleSeverity, ...unknown[]];

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
    severity: LinterRuleSeverity;

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
