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
     * @param {string} rawRule - Raw rule
     * @returns {boolean} true/false
     */
    public static isHint(rawRule: string): boolean {
        return rawRule[0] == HINT_MARKER[0] && rawRule[1] == HINT_MARKER[1];
    }

    /**
     * Parses a hint rule.
     *
     * @param {string} rawRule - Raw rule
     * @returns {IHint[] | null} List of parsed hints or null if rule isn't a hint
     *
     * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#hints-1}
     */
    public static parse(rawRule: string): IHint | null {
        if (!HintParser.isHint(rawRule)) {
            return null;
        }

        const collectedMembers: IHintMember[] = [];

        let openingBracketIndex = -1;
        let collectedHintName = "";

        // Skip !+ or #+, so start from index 2
        for (let i = 2; i < rawRule.length; i++) {
            // Bracket opening
            if (rawRule[i] == HINT_PARAMS_OPEN) {
                if (collectedHintName.length == 0) {
                    throw new SyntaxError(
                        `Missing hint name, invalid opening bracket found at position ${i} in comment "${rawRule}"`
                    );
                } else if (openingBracketIndex != -1) {
                    throw new SyntaxError(
                        `Nesting hints isn't supported, invalid opening bracket found at position ${i} in comment "${rawRule}"`
                    );
                }
                openingBracketIndex = i;
            }

            // Bracket closing
            else if (rawRule[i] == HINT_PARAMS_CLOSE) {
                if (openingBracketIndex == -1) {
                    throw new SyntaxError(
                        `No opening bracket found for closing bracket at position ${i} in comment "${rawRule}"`
                    );
                }

                // Parameter list between ( and )
                const rawParams = rawRule.substring(openingBracketIndex + 1, i);

                collectedMembers.push({
                    name: collectedHintName,
                    params: rawParams.split(HINT_PARAMS_SEPARATOR).map((arg) => arg.trim()),
                });

                openingBracketIndex = -1;
                collectedHintName = "";
            }

            // Spaces between hints
            else if (openingBracketIndex == -1 && StringUtils.isWhitespace(rawRule[i])) {
                if (
                    collectedHintName &&
                    rawRule[i - 1] &&
                    rawRule[i - 1] != "+" &&
                    !StringUtils.isWhitespace(rawRule[i - 1])
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
                        (rawRule[i] >= "a" && rawRule[i] <= "z") ||
                        (rawRule[i] >= "A" && rawRule[i] <= "Z") ||
                        (rawRule[i] >= "0" && rawRule[i] <= "9") ||
                        rawRule[i] == "_"
                    ) {
                        collectedHintName += rawRule[i];
                    } else {
                        throw new SyntaxError(
                            `Invalid character ${rawRule[i]} in hint name at position ${i} in comment "${rawRule}"`
                        );
                    }
                }
            }
        }

        // Handle unclosed bracket
        if (openingBracketIndex != -1) {
            throw new SyntaxError(
                `Unclosed opening bracket at ${openingBracketIndex} in comment "${rawRule}"`
            );
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

    public static generate(ast: IHint): string {
        let result = HINT_MARKER + " ";

        result += ast.hints
            .map(({ name, params }) => {
                let subresult = name;

                if (params && params.length > 0) {
                    subresult +=
                        HINT_PARAMS_OPEN +
                        params.join(HINT_PARAMS_SEPARATOR + " ") +
                        HINT_PARAMS_CLOSE;
                }

                return subresult;
            })
            .join(" ");

        return result.trim();
    }
}
