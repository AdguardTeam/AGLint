/**
 * Pre-processor directives
 *
 * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#pre-processor-directives}
 * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#pre-parsing-directives}
 */

import { AdblockSyntax } from "../../utils/adblockers";
import { StringUtils } from "../../utils/string";
import { RuleCategories } from "../common";
import { CommentRuleType, IComment } from "./common";

const PREPROCESSOR_MARKER = "!#";
const PREPROCESSOR_SEPARATOR = " ";

export interface IPreProcessor extends IComment {
    category: RuleCategories.Comment;
    type: CommentRuleType.PreProcessor;

    /** Name of the directive */
    name: string;

    /** Params (optional) */
    params?: string;
}

export class PreProcessorParser {
    /**
     * Determines whether the rule is a pre-processor rule.
     *
     * @param {string} raw - Raw rule
     * @returns {boolean} true/false
     */
    public static isPreProcessor(raw: string): boolean {
        const trimmed = raw.trim();

        // The following (typically occurring) rule is not a pre-processor comment: !#####
        return trimmed.startsWith(PREPROCESSOR_MARKER) && trimmed[2] != "#";
    }

    /**
     * Parses a raw rule as a pre-processor comment.
     *
     * @param {string} raw - Raw rule
     * @returns {IPreProcessor | null}
     * Pre-processor comment AST or null (if the raw rule cannot be parsed as a pre-processor comment)
     */
    public static parse(raw: string): IPreProcessor | null {
        const trimmed = raw.trim();

        if (!PreProcessorParser.isPreProcessor(raw)) {
            return null;
        }

        const result: IPreProcessor = {
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.PreProcessor,
            name: "",
        };

        const spaceIndex = StringUtils.findNextUnescapedCharacter(trimmed, PREPROCESSOR_SEPARATOR, 2);

        if (spaceIndex == -1) {
            result.name = trimmed.substring(2);
        } else {
            result.name = trimmed.substring(2, spaceIndex);
            result.params = trimmed.substring(spaceIndex + 1);
        }

        return result;
    }

    /**
     * Converts a pre-processor comment AST to a string.
     *
     * @param {IPreProcessor} ast - Pre-processor comment AST
     * @returns {string} Raw string
     */
    public static generate(ast: IPreProcessor): string {
        let result = PREPROCESSOR_MARKER;

        result += ast.name;
        if (ast.params) {
            result += PREPROCESSOR_SEPARATOR;
            result += ast.params;
        }

        return result;
    }
}
