/**
 * AdGuard Hints
 *
 * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#hints}
 */

import { AdblockSyntax } from "../../utils/adblockers";
import { EMPTY, SPACE, UNDERSCORE } from "../../utils/constants";
import { StringUtils } from "../../utils/string";
import { RuleCategory } from "../categories";
import { CommentRuleType } from "./types";
import { Comment } from ".";

const HINT_MARKER = "!+";
const HINT_MARKER_LEN = HINT_MARKER.length;
const HINT_PARAMS_OPEN = "(";
const HINT_PARAMS_CLOSE = ")";
const HINT_PARAMS_SEPARATOR = ",";

/**
 * Represents a hint member.
 *
 * @example
 * ```adblock
 * !+ PLATFORM(windows, mac)
 * ```
 * the name would be `PLATFORM` and the params would be `["windows", "mac"]`.
 */
export interface HintMember {
    /**
     * Hint name.
     *
     * @example
     * For `PLATFORM(windows, mac)` the name would be `PLATFORM`.
     */
    name: string;

    /**
     * Hint parameters.
     *
     * @example
     * For `PLATFORM(windows, mac)` the params would be `["windows", "mac"]`.
     */
    params: string[];
}

/**
 * Represents a hint comment rule.
 *
 * There can be several hints in a hint rule.
 *
 * @example
 * If the rule is
 * ```adblock
 * !+ NOT_OPTIMIZED PLATFORM(windows)
 * ```
 * then there are two hint members: `NOT_OPTIMIZED` and `PLATFORM`.
 */
export interface Hint extends Comment {
    category: RuleCategory.Comment;
    type: CommentRuleType.Hint;

    /**
     * Currently only AdGuard supports hints.
     */
    syntax: AdblockSyntax.Adg;

    /**
     * List of hints.
     */
    hints: HintMember[];
}

/**
 * `HintParser` is responsible for parsing AdGuard hints.
 *
 * @example
 * ```adblock
 * !+ NOT_OPTIMIZED PLATFORM(windows)
 * ```
 * the list will contain two hint members: `NOT_OPTIMIZED` and `PLATFORM`, and the params
 * for `PLATFORM` would be `["windows"]`.
 * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#hints}
 */
export class HintParser {
    /**
     * Determines whether the rule is a hint rule.
     *
     * @param raw - Raw rule
     * @returns `true` if the rule is a hint rule, `false` otherwise
     */
    public static isHint(raw: string): boolean {
        return raw.trim().startsWith(HINT_MARKER);
    }

    /**
     * Parses a raw rule as a hint comment.
     *
     * @param raw - Raw rule
     * @returns Hint AST or null (if the raw rule cannot be parsed as a hint comment)
     * @throws If the input matches the HINT pattern but syntactically invalid
     * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#hints-1}
     */
    public static parse(raw: string): Hint | null {
        const trimmed = raw.trim();

        if (!HintParser.isHint(trimmed)) {
            return null;
        }

        const collectedMembers: HintMember[] = [];

        let openingBracketIndex = -1;
        let collectedHintName = EMPTY;

        // Skip !+ or #+, so start from index 2
        for (let i = HINT_MARKER_LEN; i < trimmed.length; i++) {
            // Bracket opening
            if (trimmed[i] == HINT_PARAMS_OPEN) {
                if (collectedHintName.length == 0) {
                    throw new SyntaxError(
                        `Missing hint name, invalid opening bracket found at position ${i} in comment "${trimmed}"`
                    );
                } else if (openingBracketIndex != -1) {
                    throw new SyntaxError(
                        // eslint-disable-next-line max-len
                        `Nesting hints isn't supported, invalid opening bracket found at position ${i} in comment "${trimmed}"`
                    );
                }
                openingBracketIndex = i;
            }

            // Bracket closing
            else if (trimmed[i] == HINT_PARAMS_CLOSE) {
                if (openingBracketIndex == -1) {
                    throw new SyntaxError(
                        `No opening bracket found for closing bracket at position ${i} in comment "${trimmed}"`
                    );
                }

                // Parameter list between ( and )
                const rawParams = trimmed.substring(openingBracketIndex + 1, i);

                collectedMembers.push({
                    name: collectedHintName,
                    params: rawParams.split(HINT_PARAMS_SEPARATOR).map((arg) => arg.trim()),
                });

                openingBracketIndex = -1;
                collectedHintName = EMPTY;
            }

            // Spaces between hints
            else if (openingBracketIndex == -1 && StringUtils.isWhitespace(trimmed[i])) {
                if (
                    collectedHintName &&
                    trimmed[i - 1] &&
                    trimmed[i - 1] != "+" &&
                    !StringUtils.isWhitespace(trimmed[i - 1])
                ) {
                    // Store paramsless hints
                    collectedMembers.push({
                        name: collectedHintName,
                        params: [],
                    });

                    collectedHintName = EMPTY;
                }
            }

            // Anything else (typically hint name chars)
            else {
                if (openingBracketIndex == -1) {
                    // Restrict to a-z, A-Z, 0-9 and _
                    if (
                        (trimmed[i] >= "a" && trimmed[i] <= "z") ||
                        (trimmed[i] >= "A" && trimmed[i] <= "Z") ||
                        (trimmed[i] >= "0" && trimmed[i] <= "9") ||
                        trimmed[i] == UNDERSCORE
                    ) {
                        collectedHintName += trimmed[i];
                    } else {
                        throw new SyntaxError(
                            `Invalid character ${trimmed[i]} in hint name at position ${i} in comment "${trimmed}"`
                        );
                    }
                }
            }
        }

        // Handle unclosed bracket
        if (openingBracketIndex != -1) {
            throw new SyntaxError(`Unclosed opening bracket at ${openingBracketIndex} in comment "${trimmed}"`);
        }

        // Handle remaining single hint
        if (collectedHintName.length > 0) {
            collectedMembers.push({
                name: collectedHintName,
                params: [],
            });
        }

        return {
            category: RuleCategory.Comment,
            type: CommentRuleType.Hint,
            syntax: AdblockSyntax.Adg,
            hints: collectedMembers,
        };
    }

    /**
     * Converts a hint AST to a string.
     *
     * @param ast - Hint AST
     * @returns Raw string
     */
    public static generate(ast: Hint): string {
        let result = HINT_MARKER + SPACE;

        result += ast.hints
            .map(({ name, params }) => {
                let subresult = name;

                if (params && params.length > 0) {
                    subresult += HINT_PARAMS_OPEN;
                    subresult += params.join(HINT_PARAMS_SEPARATOR + SPACE);
                    subresult += HINT_PARAMS_CLOSE;
                }

                return subresult;
            })
            .join(SPACE);

        return result.trim();
    }
}
