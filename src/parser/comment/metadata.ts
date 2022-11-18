/**
 * Metadata comments
 */

import { METADATA_HEADERS } from "../../converter/metadata";
import { AdblockSyntax } from "../../utils/adblockers";
import { SPACE } from "../../utils/constants";
import { RuleCategories } from "../common";
import { CommentMarker, CommentRuleType, IComment } from "./common";

const METADATA_SEPARATOR = ":";

/**
 * Represents a metadata comment rule. This is a special comment that specifies
 * the name and value of the metadata header.
 *
 * For example, in the case of
 * ```adblock
 * ! Title: My List
 * ```
 * the name of the header is `Title`, and the value is `My List`.
 */
export interface IMetadata extends IComment {
    category: RuleCategories.Comment;
    type: CommentRuleType.Metadata;
    marker: string;
    header: string;
    value: string;
}

/**
 * Metadata Parser is responsible for parsing metadata comments.
 *
 * @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#special-comments}
 */
export class MetadataParser {
    /**
     * Parses a raw rule as a metadata comment.
     *
     * @param {string} raw - Raw rule
     * @returns {IMetadata | null} Metadata comment AST or null (if the raw rule cannot be parsed as a metadata comment)
     */
    public static parse(raw: string): IMetadata | null {
        const trimmed = raw.trim();

        if (trimmed[0] == CommentMarker.Regular || trimmed[0] == CommentMarker.Hashmark) {
            const commentText = trimmed.substring(1);
            const separatorIndex = commentText.indexOf(METADATA_SEPARATOR);

            if (separatorIndex != -1) {
                const header = commentText.substring(0, separatorIndex).trim();
                const headerLower = header.toLocaleLowerCase();
                for (let i = 0; i < METADATA_HEADERS.length; i++) {
                    if (headerLower === METADATA_HEADERS[i].toLocaleLowerCase()) {
                        return {
                            category: RuleCategories.Comment,
                            type: CommentRuleType.Metadata,
                            syntax: AdblockSyntax.Unknown,
                            marker: trimmed[0],
                            header,
                            value: commentText.substring(separatorIndex + 1).trim(),
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Converts a metadata comment AST to a string.
     *
     * @param {IMetadata} ast - Metadata comment AST
     * @returns {string} Raw string
     */
    public static generate(ast: IMetadata): string {
        let result = ast.marker + SPACE;

        result += ast.header;
        result += METADATA_SEPARATOR + SPACE;
        result += ast.value;

        return result;
    }
}
