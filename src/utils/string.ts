/**
 * String helpers
 */

import { EMPTY, ESCAPE_CHARACTER, SPACE, TAB } from "./constants";

export const SINGLE_QUOTE_MARKER = "'";
export const DOUBLE_QUOTE_MARKER = '"';
export const REGEX_MARKER = "/";

export class StringUtils {
    /**
     * Finds the first occurrence of a character that:
     * - isn't preceded by an escape character
     *
     * @param {string} pattern - Source pattern
     * @param {string} searchedCharacter - Searched character
     * @param {number} start - Start index
     * @param {string} escapeCharacter - Escape character, \ by default
     * @returns {number} Index or -1 if the character not found
     */
    public static findNextUnescapedCharacter(
        pattern: string,
        searchedCharacter: string,
        start = 0,
        escapeCharacter: string = ESCAPE_CHARACTER
    ): number {
        for (let i = start; i < pattern.length; i++) {
            // The searched character cannot be preceded by an escape
            if (pattern[i] == searchedCharacter && pattern[i - 1] != escapeCharacter) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Finds the last occurrence of a character that:
     * - isn't preceded by an escape character
     *
     * @param {string} pattern - Source pattern
     * @param {string} searchedCharacter - Searched character
     * @param {string} escapeCharacter - Escape character, \ by default
     * @returns {number} Index or -1 if the character not found
     */
    public static findLastUnescapedCharacter(
        pattern: string,
        searchedCharacter: string,
        escapeCharacter: string = ESCAPE_CHARACTER
    ): number {
        for (let i = pattern.length - 1; i >= 0; i--) {
            // The searched character cannot be preceded by an escape
            if (pattern[i] == searchedCharacter && pattern[i - 1] != escapeCharacter) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Finds the last occurrence of a character that:
     * - isn't preceded by an escape character
     * - isn't followed by the specified character
     *
     * @param {string} pattern - Source pattern
     * @param {string} searchedCharacter - Searched character
     * @param {string} notFollowedBy - Searched character not followed by this character
     * @param {string} escapeCharacter - Escape character, \ by default
     * @returns {number} Index or -1 if the character not found
     */
    public static findLastUnescapedCharacterThatNotFollowedBy(
        pattern: string,
        searchedCharacter: string,
        notFollowedBy: string,
        escapeCharacter: string = ESCAPE_CHARACTER
    ): number {
        for (let i = pattern.length - 1; i >= 0; i--) {
            // The searched character cannot be preceded by an escape
            if (
                pattern[i] == searchedCharacter &&
                pattern[i + 1] != notFollowedBy &&
                pattern[i - 1] != escapeCharacter
            ) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Finds the next occurrence of a character that:
     * - isn't part of any string literal ('literal' or "literal")
     * - isn't part of any RegExp expression (/regexp/)
     *
     * @param {string} pattern - Source pattern
     * @param {string} searchedCharacter - Searched character
     * @param {number} start - Start index
     * @returns {number} Index or -1 if the character not found
     */
    public static findUnescapedNonStringNonRegexChar(pattern: string, searchedCharacter: string, start = 0) {
        let open: string | null = null;

        for (let i = start; i < pattern.length; i++) {
            if (
                (pattern[i] == SINGLE_QUOTE_MARKER ||
                    pattern[i] == DOUBLE_QUOTE_MARKER ||
                    pattern[i] == REGEX_MARKER) &&
                pattern[i - 1] != ESCAPE_CHARACTER
            ) {
                if (open === pattern[i]) {
                    open = null;
                } else {
                    open = pattern[i];
                }
            } else if (open === null && pattern[i] == searchedCharacter && pattern[i - 1] != ESCAPE_CHARACTER) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Finds the next occurrence of a character that:
     * - isn't part of any string literal ('literal' or "literal")
     * - isn't preceded by an escape character
     *
     * @param {string} pattern - Source pattern
     * @param {string} searchedCharacter - Searched character
     * @param {number} start - Start index
     * @param {string} escapeCharacter - Escape character, \ by default
     * @returns {number} Index or -1 if the character not found
     */
    public static findNextUnquotedUnescapedCharacter(
        pattern: string,
        searchedCharacter: string,
        start = 0,
        escapeCharacter = ESCAPE_CHARACTER
    ) {
        let openQuote: string | null = null;

        for (let i = start; i < pattern.length; i++) {
            // Unescaped ' or "
            if (
                (pattern[i] == SINGLE_QUOTE_MARKER || pattern[i] == DOUBLE_QUOTE_MARKER) &&
                pattern[i - 1] != escapeCharacter
            ) {
                if (!openQuote) openQuote = pattern[i];
                else if (openQuote == pattern[i]) openQuote = null;
            }
            // Unescaped character
            else if (pattern[i] == searchedCharacter && pattern[i - 1] != escapeCharacter) {
                if (!openQuote) {
                    return i;
                }
            }
        }
        return -1;
    }

    /**
     * Splits the source pattern along characters that:
     * - isn't part of any string literal ('literal' or "literal")
     * - isn't preceded by an escape character
     *
     * @param {string} pattern - Source pattern
     * @param {string} delimeterCharacter - Delimeter character
     * @returns {string[]} Splitted string
     */
    public static splitStringByUnquotedUnescapedCharacter(pattern: string, delimeterCharacter: string): string[] {
        const parts: string[] = [];
        let delimeterIndex = -1;
        do {
            const prevDelimeterIndex = delimeterIndex;
            delimeterIndex = StringUtils.findNextUnquotedUnescapedCharacter(
                pattern,
                delimeterCharacter,
                delimeterIndex + 1
            );
            if (delimeterIndex != -1) {
                parts.push(pattern.substring(prevDelimeterIndex + 1, delimeterIndex));
            } else {
                parts.push(pattern.substring(prevDelimeterIndex + 1, pattern.length));
            }
        } while (delimeterIndex != -1);
        return parts;
    }

    /**
     * Splits the source pattern along characters that:
     * - isn't part of any string literal ('literal' or "literal")
     * - isn't part of any RegExp expression (/regexp/)
     * - isn't preceded by an escape character
     *
     * @param {string} pattern - Source pattern
     * @param {string} delimeterCharacter - Delimeter character
     * @returns {string[]} Splitted string
     */
    public static splitStringByUnescapedNonStringNonRegexChar(pattern: string, delimeterCharacter: string): string[] {
        const parts: string[] = [];
        let delimeterIndex = -1;
        do {
            const prevDelimeterIndex = delimeterIndex;
            delimeterIndex = StringUtils.findUnescapedNonStringNonRegexChar(
                pattern,
                delimeterCharacter,
                delimeterIndex + 1
            );
            if (delimeterIndex != -1) {
                parts.push(pattern.substring(prevDelimeterIndex + 1, delimeterIndex));
            } else {
                parts.push(pattern.substring(prevDelimeterIndex + 1, pattern.length));
            }
        } while (delimeterIndex != -1);
        return parts;
    }

    /**
     * Splits the source pattern along characters that:
     * - isn't preceded by an escape character
     *
     * @param {string} pattern - Source pattern
     * @param {string} delimeterCharacter - Delimeter character
     * @returns {string[]} Splitted string
     */
    public static splitStringByUnescapedCharacter(pattern: string, delimeterCharacter: string): string[] {
        const parts: string[] = [];
        let delimeterIndex = -1;
        do {
            const prevDelimeterIndex = delimeterIndex;
            delimeterIndex = StringUtils.findNextUnescapedCharacter(pattern, delimeterCharacter, delimeterIndex + 1);
            if (delimeterIndex != -1) {
                parts.push(pattern.substring(prevDelimeterIndex + 1, delimeterIndex));
            } else {
                parts.push(pattern.substring(prevDelimeterIndex + 1, pattern.length));
            }
        } while (delimeterIndex != -1);
        return parts;
    }

    /**
     *Checks if a character is whitespace.
     *
     * @param {string} character - Character to check
     * @returns {boolean} true/false
     */
    public static isWhitespace(character: string): boolean {
        return character == SPACE || character == TAB;
    }

    /**
     * Searches for the first non-whitespace character in the source pattern.
     *
     * @param {string} pattern - Source pattern
     * @param {number} start - Start index
     * @returns {number} Index or -1 if the character not found
     */
    public static findFirstNonWhitespaceCharacter(pattern: string, start = 0): number {
        for (let i = start; i < pattern.length; i++) {
            if (!StringUtils.isWhitespace(pattern[i])) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Searches for the last non-whitespace character in the source pattern.
     *
     * @param {string} pattern - Source pattern
     * @returns {number} Index or -1 if the character not found
     */
    public static findLastNonWhitespaceCharacter(pattern: string): number {
        for (let i = pattern.length - 1; i >= 0; i--) {
            if (!StringUtils.isWhitespace(pattern[i])) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Checks whether a string is a RegExp pattern.
     *
     * @param {string} pattern - Pattern to check
     * @returns {boolean} true/false
     */
    public static isRegexPattern(pattern: string): boolean {
        const trimmedPattern = pattern.trim();
        const lastIndex = trimmedPattern.length - 1;
        if (trimmedPattern.length > 2 && trimmedPattern[0] == REGEX_MARKER) {
            const last = StringUtils.findNextUnescapedCharacter(trimmedPattern, REGEX_MARKER, 1);
            return last == lastIndex;
        }
        return false;
    }

    /**
     * Escapes a specified character in the string.
     *
     * @param {string} pattern - Input string
     * @param {string} character - Character to escape
     * @param {string} escapeCharacter - Escape character (optional)
     * @returns {boolean} true/false
     */
    public static escapeCharacter(pattern: string, character: string, escapeCharacter = ESCAPE_CHARACTER): string {
        let result = EMPTY;

        for (let i = 0; i < pattern.length; i++) {
            if (pattern[i] == character && pattern[i - 1] != escapeCharacter) {
                result += escapeCharacter;
            }
            result += pattern[i];
        }

        return result;
    }
}
