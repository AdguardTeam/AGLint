/**
 * AGLint configuration comments. Inspired by ESLint inline configuration comments:
 *
 * @see {@link https://eslint.org/docs/latest/user-guide/configuring/rules#using-configuration-comments}
 */

import { AdblockSyntax } from "../../utils/adblockers";
import { COMMA, EMPTY, SPACE } from "../../utils/constants";
import { RuleCategory } from "../categories";
import { CommentRuleType } from "./types";
import { CommentMarker } from "./marker";
import { Comment } from ".";
import JSON5 from "json5";

const AGLINT_COMMAND_PREFIX = "aglint";
const PARAMS_SEPARATOR = COMMA;
const CONFIG_COMMENT_MARKER = "--";

/**
 * Represents an inline configuration comment.
 *
 * For example, if the comment is
 * ```adblock
 * ! aglint-disable some-rule another-rule
 * ```
 * then the command is `aglint-disable` and its params is `["some-rule", "another-rule"]`.
 */
export interface ConfigComment extends Comment {
    category: RuleCategory.Comment;
    type: CommentRuleType.ConfigComment;

    /** Comment marker: `!` or `#` */
    marker: CommentMarker;

    /** Command, for example: `aglint` */
    command: string;

    /** Params: can be a rule configuration object or a list of rule names */
    params?: object | string[];

    /** Config comment, for example: `! aglint-enable -- this is the comment` */
    comment?: string;
}

/**
 * ConfigCommentParser is responsible for parsing inline AGLint configuration rules.
 *
 * Inspired by ESLint inline configuration comments.
 *
 * @see {@link https://eslint.org/docs/latest/user-guide/configuring/rules#using-configuration-comments}
 */
export class ConfigCommentParser {
    /**
     * Determines whether the rule is an inline configuration comment rule.
     *
     * @param raw - Raw rule
     * @returns true/false
     */
    public static isConfigComment(raw: string): boolean {
        const trimmed = raw.trim();

        if (trimmed[0] == CommentMarker.Regular || trimmed[0] == CommentMarker.Hashmark) {
            // Skip comment marker and trim comment text (it is necessary because of "!     something")
            const text = raw.slice(1).trim();

            // The code below is "not pretty", but it runs fast, which is necessary, since it will run on EVERY comment
            // The essence of the indicator is that the control comment always starts with the "aglint" prefix
            return (
                (text[0] == "a" || text[0] == "A") &&
                (text[1] == "g" || text[1] == "G") &&
                (text[2] == "l" || text[2] == "L") &&
                (text[3] == "i" || text[3] == "I") &&
                (text[4] == "n" || text[4] == "N") &&
                (text[5] == "t" || text[5] == "T")
            );
        }

        return false;
    }

    /**
     * Parses a raw rule as an inline configuration comment.
     *
     * @param raw - Raw rule
     * @returns
     * Inline configuration comment AST or null (if the raw rule cannot be parsed as configuration comment)
     */
    public static parse(raw: string): ConfigComment | null {
        const trimmed = raw.trim();

        if (!ConfigCommentParser.isConfigComment(trimmed)) {
            return null;
        }

        let text = raw.slice(1).trim();
        let comment: string | undefined;

        // Remove comment part, for example: "! aglint rule1: "off" -- this is a comment"
        // Correct rules doesn't includes "--" inside
        const commentPos = text.indexOf(CONFIG_COMMENT_MARKER);
        if (commentPos != -1) {
            comment = text.substring(commentPos + 2).trim();
            text = text.substring(0, commentPos).trim();
        }

        // Prepare result
        const result: ConfigComment = {
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Unknown,
            marker: raw[0] as CommentMarker,
            command: text,
        };

        if (comment) {
            result.comment = comment;
        }

        let rawParams: string | undefined;

        // Get the AGLint command and its parameters. For example, if the following config comment is given:
        // ! aglint-disable something
        // then the command is "aglint-disable" and the parameter is "something".
        const firstSpaceIndex = text.indexOf(SPACE);
        if (firstSpaceIndex != -1) {
            result.command = text.substring(0, firstSpaceIndex).trim().toLocaleLowerCase();
            rawParams = text.substring(firstSpaceIndex + 1).trim();
        }

        // If the command is simply "aglint", then it is a special case whose parameter is a rule configuration object
        if (result.command === AGLINT_COMMAND_PREFIX) {
            if (!rawParams || rawParams.length == 0) {
                throw new SyntaxError("Missing configuration object");
            }

            // Delegate to JSON parser (JSON5 also supports unquoted properties)
            // TODO: Is some structure validation required at this point? This is currently just a general object
            result.params = JSON5.parse(`{ ${rawParams} }`);
        } else if (rawParams) {
            result.params = rawParams.split(PARAMS_SEPARATOR).map((param) => param.trim());
        }

        return result;
    }

    /**
     * Converts an inline configuration comment AST to a string.
     *
     * @param ast - Inline configuration comment AST
     * @returns Raw string
     */
    public static generate(ast: ConfigComment): string {
        let result = EMPTY;

        result += ast.marker;
        result += SPACE;
        result += ast.command;

        if (ast.params) {
            result += SPACE;
            if (Array.isArray(ast.params)) {
                result += ast.params.join(PARAMS_SEPARATOR + SPACE);
            } else {
                result += JSON.stringify(ast.params).slice(1, -1).trim();
            }
        }

        if (ast.comment) {
            result += SPACE;
            result += CONFIG_COMMENT_MARKER;
            result += SPACE;
            result += ast.comment;
        }

        return result;
    }
}
