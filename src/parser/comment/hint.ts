/**
 * AdGuard Hints
 *
 * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#hints}
 */

import { AdblockSyntax } from "../../utils/adblockers";
import { StringUtils } from "../../utils/string";
import { RuleCategories } from "../common";
import { CommentRuleType, IComment } from "./common";

const HINT_MARKER = "!+";
const HINT_PARAMS_OPEN = "(";
const HINT_PARAMS_CLOSE = ")";
const HINT_PARAMS_SEPARATOR = ",";

export interface IHintMember {
    name: string;
    params: string[];
}

export interface IHint extends IComment {
    category: RuleCategories.Comment;
    type: CommentRuleType.Hint;
    syntax: AdblockSyntax.AdGuard;
    hints: IHintMember[];
}

export class HintParser {
    /**
     * Determines whether the rule is a hint rule.
     *
     * @param {string} raw - Raw rule
     * @returns {boolean} true/false
     */
    public static isHint(raw: string): boolean {
        return raw.trim().startsWith(HINT_MARKER);
    }

    /**
     * Parses a raw rule as a hint comment.
     *
     * @param {string} raw - Raw rule
     * @returns {IHint | null} Hint AST or null (if the raw rule cannot be parsed as a hint comment)
     * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#hints-1}
     */
    public static parse(raw: string): IHint | null {
        const trimmed = raw.trim();

        if (!HintParser.isHint(trimmed)) {
            return null;
        }

        const collectedMembers: IHintMember[] = [];

        let openingBracketIndex = -1;
        let collectedHintName = "";

        // Skip !+ or #+, so start from index 2
        for (let i = 2; i < trimmed.length; i++) {
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
                collectedHintName = "";
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

                    collectedHintName = "";
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
                        trimmed[i] == "_"
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
            syntax: AdblockSyntax.AdGuard,
            category: RuleCategories.Comment,
            type: CommentRuleType.Hint,
            hints: collectedMembers,
        };
    }

    /**
     * Converts a hint AST to a string.
     *
     * @param {IHint} ast - Hint AST
     * @returns {string} Raw string
     */
    public static generate(ast: IHint): string {
        let result = HINT_MARKER + " ";

        result += ast.hints
            .map(({ name, params }) => {
                let subresult = name;

                if (params && params.length > 0) {
                    subresult += HINT_PARAMS_OPEN + params.join(HINT_PARAMS_SEPARATOR + " ") + HINT_PARAMS_CLOSE;
                }

                return subresult;
            })
            .join(" ");

        return result.trim();
    }
}
