/**
 * Metadata comments
 */

import { METADATA_HEADERS } from "../../converter/metadata";
import { AdblockSyntax } from "../../utils/adblockers";
import { RuleCategories } from "../common";
import { CommentMarker, CommentRuleType, IComment } from "./common";

const METADATA_SEPARATOR = ":";

export interface IMetadata extends IComment {
    category: RuleCategories.Comment;
    type: CommentRuleType.Metadata;
    marker: string;
    header: string;
    value: string;
}

export class MetadataParser {
    /**
     * @param {string} raw - Raw rule
     * @returns {IPreProcessor | null}
     */
    public static parse(raw: string): IMetadata | null {
        const trimmed = raw.trim();

        if (raw[0] == CommentMarker.Regular || raw[0] == CommentMarker.Hashmark) {
            const commentText = trimmed.substring(1);
            const separatorIndex = commentText.indexOf(METADATA_SEPARATOR);

            if (separatorIndex != -1) {
                const header = commentText.substring(0, separatorIndex).trim();
                const headerLower = header.toLocaleLowerCase();
                for (let i = 0; i < METADATA_HEADERS.length; i++) {
                    if (headerLower === METADATA_HEADERS[i].toLocaleLowerCase()) {
                        return {
                            category: RuleCategories.Comment,
                            syntax: AdblockSyntax.Unknown,
                            type: CommentRuleType.Metadata,
                            marker: raw[0],
                            header,
                            value: commentText.substring(separatorIndex + 1).trim(),
                        };
                    }
                }
            }
        }

        return null;
    }

    public static generate(ast: IMetadata): string {
        let result = ast.marker + " ";

        result += ast.header;
        result += METADATA_SEPARATOR + " ";
        result += ast.value;

        return result;
    }
}
