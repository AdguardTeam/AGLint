/**
 * Pre-processor directives
 *
 * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#pre-processor-directives}
 * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#pre-parsing-directives}
 */

import { AdblockSyntax } from '../../utils/adblockers';
import { EMPTY, HASHMARK } from '../../utils/constants';
import { StringUtils } from '../../utils/string';
import { CommentRuleType } from './types';
import { Comment } from './common';
import { RuleCategory } from '../common';

const PREPROCESSOR_MARKER = '!#';
const PREPROCESSOR_MARKER_LEN = PREPROCESSOR_MARKER.length;
const PREPROCESSOR_SEPARATOR = ' ';

/**
 * Represents a preprocessor comment.
 *
 * @example
 * For example, if the comment is
 * ```adblock
 * !#if (adguard)
 * ```
 * then the directive's name is `if` and its value is `(adguard)`.
 *
 * In such a case, the parameters must be submitted for further parsing and validation, as this parser only handles
 * the general syntax.
 */
export interface PreProcessor extends Comment {
    category: RuleCategory.Comment;
    type: CommentRuleType.PreProcessor;

    /**
     * Name of the directive
     */
    name: string;

    /**
     * Params (optional)
     */
    params?: string;
}

/**
 * `PreProcessorParser` is responsible for parsing preprocessor rules.
 * Pre-processor comments are special comments that are used to control the behavior of the filter list processor.
 * Please note that this parser only handles general syntax for now, and does not validate the parameters at
 * the parsing stage.
 *
 * @example
 * If your rule is
 * ```adblock
 * !#if (adguard)
 * ```
 * then the directive's name is `if` and its value is `(adguard)`, but the parameter list
 * is not parsed / validated further.
 * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#pre-processor-directives}
 * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#pre-parsing-directives}
 */
export class PreProcessorParser {
    /**
     * Determines whether the rule is a pre-processor rule.
     *
     * @param raw - Raw rule
     * @returns `true` if the rule is a pre-processor rule, `false` otherwise
     */
    public static isPreProcessor(raw: string): boolean {
        const trimmed = raw.trim();

        // The following (typically occurring) rule is not a pre-processor comment: !#####
        return trimmed.startsWith(PREPROCESSOR_MARKER) && trimmed[PREPROCESSOR_MARKER_LEN] !== HASHMARK;
    }

    /**
     * Parses a raw rule as a pre-processor comment.
     *
     * @param raw - Raw rule
     * @returns
     * Pre-processor comment AST or null (if the raw rule cannot be parsed as a pre-processor comment)
     */
    public static parse(raw: string): PreProcessor | null {
        const trimmed = raw.trim();

        if (!PreProcessorParser.isPreProcessor(trimmed)) {
            return null;
        }

        const result: PreProcessor = {
            category: RuleCategory.Comment,
            type: CommentRuleType.PreProcessor,
            syntax: AdblockSyntax.Common,
            name: EMPTY,
        };

        const spaceIndex = StringUtils.findNextNotBracketedUnescapedCharacter(
            trimmed,
            PREPROCESSOR_SEPARATOR,
            PREPROCESSOR_MARKER_LEN,
        );

        if (spaceIndex === -1) {
            result.name = trimmed.substring(PREPROCESSOR_MARKER_LEN);
        } else {
            result.name = trimmed.substring(PREPROCESSOR_MARKER_LEN, spaceIndex);
            result.params = trimmed.substring(spaceIndex + 1).trim();
        }

        return result;
    }

    /**
     * Converts a pre-processor comment AST to a string.
     *
     * @param ast - Pre-processor comment AST
     * @returns Raw string
     */
    public static generate(ast: PreProcessor): string {
        let result = PREPROCESSOR_MARKER;

        result += ast.name;
        if (ast.params) {
            result += PREPROCESSOR_SEPARATOR;
            result += ast.params;
        }

        return result;
    }
}
