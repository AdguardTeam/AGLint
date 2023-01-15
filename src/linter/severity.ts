import { Struct, define } from "superstruct";

/**
 * Represents the possible severities
 */
export const SEVERITY = Object.freeze({
    off: 0,
    warn: 1,
    error: 2,
    fatal: 3,
});

/**
 * Names of the possible severities
 */
export const SEVERITY_NAMES = Object.freeze(Object.keys(SEVERITY));

/**
 * Values of the possible severities
 */
export const SEVERITY_VALUES = Object.freeze(Object.values(SEVERITY));

/**
 * Type for the possible severities
 */
export type AnySeverity = keyof typeof SEVERITY | typeof SEVERITY[keyof typeof SEVERITY];

/**
 * Always returns the severity value. Typically used to get the severity value from a string.
 *
 * @param value The value to get the severity value from
 * @returns The severity value
 */
export function getSeverity(value: AnySeverity): typeof SEVERITY[keyof typeof SEVERITY] {
    if (typeof value === "string") {
        return SEVERITY[value];
    } else {
        return value;
    }
}

/**
 * Checks whether the given value is a valid severity
 *
 * @param value The value to check
 * @returns Whether the value is a valid severity
 */
export function isSeverity(value: unknown): value is AnySeverity {
    if (typeof value === "string") {
        return SEVERITY_NAMES.includes(value);
    } else if (typeof value === "number") {
        return (SEVERITY_VALUES as number[]).includes(value);
    }

    return false;
}

/**
 * Superstruct type definition for the linter rule severity
 *
 * @returns Defined struct
 * @see {@link https://github.com/ianstormtaylor/superstruct/blob/main/src/structs/types.ts}
 */
export function severity(): Struct<AnySeverity, null> {
    return define("severity", (value) => {
        if (typeof value === "string") {
            return (
                SEVERITY_NAMES.includes(value) ||
                `Expected a valid severity string (${SEVERITY_NAMES.join(", ")}), but received ${value}`
            );
        } else if (typeof value === "number") {
            return (
                (SEVERITY_VALUES as number[]).includes(value) ||
                `Expected a valid severity number, but received ${value}`
            );
        } else {
            return `Expected a string or number, but received ${typeof value}`;
        }
    });
}
