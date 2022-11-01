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
     * @param {string} raw - Raw rule
     * @returns {boolean}
     */
    public static isPreProcessor(raw: string): boolean {
        const trimmed = raw.trim();

        return (
            trimmed[0] == PREPROCESSOR_MARKER[0] &&
            trimmed[1] == PREPROCESSOR_MARKER[1] &&
            trimmed[2] != PREPROCESSOR_MARKER[1]
        );
    }

    /**
     * @param {string} raw - Raw rule
     * @returns {IPreProcessor | null}
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

        const spaceIndex = StringUtils.findNextUnescapedCharacter(
            trimmed,
            PREPROCESSOR_SEPARATOR,
            2
        );

        if (spaceIndex == -1) {
            result.name = trimmed.substring(2);
        } else {
            result.name = trimmed.substring(2, spaceIndex);
            result.params = trimmed.substring(spaceIndex + 1);
        }

        return result;
    }

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
