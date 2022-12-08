import { LinterContext } from ".";

/** Represents linter rule severity */
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

/** Represents linter rule type */
export enum LinterRuleType {
    Problem,
    Suggestion,
    Layout,
}

/** Represents linter rule metadata */
export interface LinterRuleMeta {
    /** Rule type */
    type: LinterRuleType;

    /** Rule severity */
    severity: LinterRuleSeverity;

    // TODO: Severity + Additional parameters

    /** Configuration schema of the rule (optional) */
    schema?: object;

    /** It describes whether the issue detected by the rule can be fixed automatically or not */
    fixable?: boolean;
}

/** The configuration of the rule can be severity itself, or an array whose first element is severity */
export type LinterRuleConfig = LinterRuleSeverity | [LinterRuleSeverity, ...unknown[]];

/** It represents what events a linter rule can handle */
export interface LinterRuleEvents {
    /** Called on startup before any file is processed */
    onStart?: (context: LinterContext) => void;

    /** Called after all files has been processed */
    onEnd?: (context: LinterContext) => void;

    /** Called before analyzing a file */
    onStartFilterList?: (context: LinterContext) => void;

    /** Called after analyzing a file */
    onEndFilterList?: (context: LinterContext) => void;

    /** Called to analyze a single rule */
    onRule?: (context: LinterContext) => void;
}

/** Represents an AGLint rule */
export interface LinterRule {
    /** Basic data of the rule (metadata) */
    meta: LinterRuleMeta;

    /** Events belonging to the rule */
    events: LinterRuleEvents;
}
