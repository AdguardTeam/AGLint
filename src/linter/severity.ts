import { Struct, define } from "superstruct";

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

export const SEVERITY_VALUES = Object.values(LinterRuleSeverity);

export const SEVERITY_NAMES = ["off", "warn", "error", "fatal"];

/**
 * Superstruct type definition for the linter rule severity
 *
 * @returns Defined struct
 * @see {@link https://github.com/ianstormtaylor/superstruct/blob/main/src/structs/types.ts}
 */
export function severity(): Struct<LinterRuleSeverity, null> {
    return define("severity", (value) => {
        if (typeof value === "string") {
            return (
                SEVERITY_NAMES.includes(value) ||
                `Expected a valid severity string (${SEVERITY_NAMES.join(", ")}), but received ${value}`
            );
        } else if (typeof value === "number") {
            return SEVERITY_VALUES.includes(value) || `Expected a valid severity number, but received ${value}`;
        } else {
            return `Expected a string or number, but received ${typeof value}`;
        }
    });
}
