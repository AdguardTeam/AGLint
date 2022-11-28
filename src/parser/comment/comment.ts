import { StringUtils } from "../../utils/string";
import { CosmeticRuleSeparatorUtils } from "../../utils/cosmetic-rule-separator";
import { CommentMarker, CommentRuleType, Comment } from "./common";
import { AgentParser, Agent } from "./agent";
import { HintParser, Hint } from "./hint";
import { Metadata, MetadataParser } from "./metadata";
import { PreProcessor, PreProcessorParser } from "./preprocessor";
import { RuleCategory } from "../common";
import { AdblockSyntax } from "../../utils/adblockers";
import { ConfigCommentParser, ConfigComment } from "./inline-config";

/**
 * Represents a simple comment.
 *
 * Example rules:
 *   - ```adblock
 *     ! This is just a comment
 *     ```
 *   - ```adblock
 *     # This is just a comment
 *     ```
 *   - etc.
 */
export interface SimpleComment extends Comment {
    type: CommentRuleType.Comment;

    /** Comment marker: `!` or `#` */
    marker: CommentMarker;
    text: string;
}

/**
 * CommentParser is responsible for parsing any comment-like adblock rules.
 *
 * Example rules:
 *  - Agent comments:
 *      - ```adblock
 *        [AdGuard]
 *        ```
 *      - ```adblock
 *        [Adblock Plus 2.0]
 *        ```
 *      - etc.
 *  - AdGuard hints:
 *      - ```adblock
 *        !+ NOT_OPTIMIZED
 *        ```
 *      - ```adblock
 *        !+ NOT_OPTIMIZED PLATFORM(windows)
 *        ```
 *      - etc.
 *  - Pre-processor comments:
 *      - ```adblock
 *        !#if (adguard)
 *        ```
 *      - ```adblock
 *        !#endif
 *        ```
 *      - etc.
 *  - Metadata headers:
 *      - ```adblock
 *        ! Title: My List
 *        ```
 *      - ```adblock
 *        ! Version: 2.0.150
 *        ```
 *      - etc.
 *  - AGLint inline config comments:
 *      - ```adblock
 *        ! aglint-enable some-rule
 *        ```
 *      - ```adblock
 *        ! aglint-disable some-rule
 *        ```
 *      - etc.
 *  - Simple comments:
 *      - ```adblock
 *        ! This is just a comment
 *        ```
 *      - ```adblock
 *        # This is just a comment
 *        ```
 *      - etc.
 */
export class CommentParser {
    /**
     * Determines whether a rule is a regular comment.
     *
     * @param raw - Raw data
     * @returns true/false
     */
    public static isRegularComment(raw: string): boolean {
        return raw.trim()[0] == CommentMarker.Regular;
    }

    /**
     * Determines whether a rule is a comment.
     *
     * @param raw - Raw rule
     * @returns true/false
     */
    public static isComment(raw: string): boolean {
        const trimmed = raw.trim();

        // Regular comments
        if (CommentParser.isRegularComment(trimmed)) {
            return true;
        }

        // Hashmark based comments
        else if (trimmed[0] == CommentMarker.Hashmark) {
            const [start, end] = CosmeticRuleSeparatorUtils.find(trimmed);

            // No separator
            if (start == -1) {
                return true;
            } else {
                // No valid selector
                if (
                    !trimmed[end + 1] ||
                    StringUtils.isWhitespace(trimmed[end + 1]) ||
                    (trimmed[end + 1] == CommentMarker.Hashmark && trimmed[end + 2] == CommentMarker.Hashmark)
                ) {
                    return true;
                }
            }
        }

        // Agents
        return AgentParser.isAgent(trimmed);
    }

    /**
     * Parses a raw rule as comment.
     *
     * @param raw - Raw rule
     * @returns Comment AST or null (if the raw rule cannot be parsed as comment)
     */
    public static parse(raw: string): Comment | null {
        const trimmed = raw.trim();

        if (!CommentParser.isComment(trimmed)) {
            return null;
        }

        return (
            AgentParser.parse(trimmed) ||
            HintParser.parse(trimmed) ||
            PreProcessorParser.parse(trimmed) ||
            MetadataParser.parse(trimmed) ||
            ConfigCommentParser.parse(trimmed) ||
            <Comment>{
                category: RuleCategory.Comment,
                type: CommentRuleType.Comment,
                syntax: AdblockSyntax.Unknown,
                marker: trimmed[0],
                text: trimmed.substring(1),
            }
        );
    }

    /**
     * Converts a comment AST to a string.
     *
     * @param ast - Comment AST
     * @returns Raw string
     */
    public static generate(ast: Comment): string {
        switch (ast.type) {
            case CommentRuleType.Agent:
                return AgentParser.generate(<Agent>ast);
            case CommentRuleType.Hint:
                return HintParser.generate(<Hint>ast);
            case CommentRuleType.PreProcessor:
                return PreProcessorParser.generate(<PreProcessor>ast);
            case CommentRuleType.Metadata:
                return MetadataParser.generate(<Metadata>ast);
            case CommentRuleType.ConfigComment:
                return ConfigCommentParser.generate(<ConfigComment>ast);
            case CommentRuleType.Comment:
                return (<SimpleComment>ast).marker + (<SimpleComment>ast).text;
        }
    }
}
