import * as v from 'valibot';

import { type AnyLinterResult } from './fixer';
import { type LinterSuggestion, linterSuggestionSchema } from './linter-problem';
import { type LinterFixCommand, linterFixCommandSchema } from './source-code/fix-generator';

/**
 * Checks if a linter result has any errors (including fatal errors).
 *
 * @param result The linter result to check.
 *
 * @returns True if the result has errors, false otherwise.
 */
export const hasErrors = (result: AnyLinterResult): boolean => {
    return result.errorCount > 0 || result.fatalErrorCount > 0;
};

/**
 * Asserts that a value is a valid LinterFixCommand.
 * Throws a ValiError if the value doesn't match the schema.
 *
 * @param value The value to validate.
 *
 * @returns The validated LinterFixCommand.
 *
 * @throws If the value is not a valid LinterFixCommand.
 *
 * @example
 * ```typescript
 * const command = assertLinterFixCommand(unknownValue);
 * // command is now typed as LinterFixCommand
 * ```
 */
export const assertLinterFixCommand = (value: unknown): LinterFixCommand => {
    return v.parse(linterFixCommandSchema, value);
};

/**
 * Type guard to check if a value is a LinterFixCommand.
 * Returns true if valid, false otherwise (does not throw).
 *
 * @param value The value to check.
 *
 * @returns True if the value is a valid LinterFixCommand, false otherwise.
 *
 * @example
 * ```typescript
 * if (isLinterFixCommand(unknownValue)) {
 *     // unknownValue is now typed as LinterFixCommand
 * }
 * ```
 */
export const isLinterFixCommand = (value: unknown): value is LinterFixCommand => {
    return v.safeParse(linterFixCommandSchema, value).success;
};

/**
 * Asserts that a value is a valid array of LinterSuggestion.
 * Throws a ValiError if the value doesn't match the schema.
 *
 * @param value The value to validate.
 *
 * @returns The validated array of LinterSuggestion.
 *
 * @throws If the value is not a valid LinterSuggestion array.
 *
 * @example
 * ```typescript
 * const suggestions = assertLinterSuggestions(unknownValue);
 * // suggestions is now typed as LinterSuggestion[]
 * ```
 */
export const assertLinterSuggestions = (value: unknown): LinterSuggestion[] => {
    return v.parse(v.array(linterSuggestionSchema), value);
};

/**
 * Type guard to check if a value is an array of LinterSuggestion.
 * Returns true if valid, false otherwise (does not throw).
 *
 * @param value The value to check.
 *
 * @returns True if the value is a valid LinterSuggestion array, false otherwise.
 *
 * @example
 * ```typescript
 * if (isLinterSuggestions(unknownValue)) {
 *     // unknownValue is now typed as LinterSuggestion[]
 * }
 * ```
 */
export const isLinterSuggestions = (value: unknown): value is LinterSuggestion[] => {
    return v.safeParse(v.array(linterSuggestionSchema), value).success;
};
