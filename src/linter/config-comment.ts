import { type CommentRule } from '@adguard/agtree';
import levn from 'levn';

/**
 * A string value with its source offsets.
 */
export type ParsedConfigCommentValue = {
    value: string;
    start: number;
    end: number;
};

/**
 * Parsed `! Aglint` configuration object.
 */
export type ParsedConfigCommentConfigNode = {
    type: 'ConfigNode';
    value: object;
    start: number;
    end: number;
};

/**
 * Parsed list of rule names for `! Aglint-disable`-style commands.
 */
export type ParsedConfigCommentParameterList = {
    type: 'ParameterList';
    children: ParsedConfigCommentValue[];
    start: number;
    end: number;
};

/**
 * Result of parsing an inline AGLint configuration comment.
 */
export type ParsedConfigComment = {
    command: ParsedConfigCommentValue;
    params?: ParsedConfigCommentConfigNode | ParsedConfigCommentParameterList;
    comment?: ParsedConfigCommentValue;
};

/**
 * Checks whether a character is a horizontal whitespace character.
 *
 * @param char Character to check.
 *
 * @returns True for space and tab.
 */
const isSpace = (char: string | undefined): boolean => char === ' ' || char === '\t';

/**
 * Finds the next space or tab in the text.
 *
 * @param text Text to search.
 * @param start Search start offset.
 *
 * @returns Offset of the next space/tab, or the text length.
 */
const findNextSpace = (text: string, start: number): number => {
    for (let i = start; i < text.length; i += 1) {
        if (isSpace(text[i])) {
            return i;
        }
    }

    return text.length;
};

/**
 * Trims trailing spaces/tabs from a slice end offset.
 *
 * @param text Text to inspect.
 * @param end Exclusive slice end.
 *
 * @returns Trimmed exclusive end offset.
 */
const trimEnd = (text: string, end: number): number => {
    let i = end;

    while (i > 0 && isSpace(text[i - 1])) {
        i -= 1;
    }

    return i;
};

/**
 * Parses an inline AGLint configuration comment.
 *
 * AGTree v5 no longer produces `ConfigCommentRule` nodes, so AGLint parses its
 * own command language from a plain `CommentRule`. The syntax mirrors the
 * legacy AGTree parser: `! Aglint ...`, `! Aglint-disable ...`,
 * `! Aglint-enable ...`, `! Aglint-disable-next-line ...`, with an optional
 * trailing comment after `--`..
 *
 * @param node Comment rule produced by AGTree.
 *
 * @returns Parsed comment, or null if the comment is not an AGLint command.
 *
 * @throws Error for malformed or empty configuration objects.
 */
export const parseConfigComment = (node: CommentRule): ParsedConfigComment | null => {
    const text = node.text.value;
    const base = node.text.start ?? 0;

    if (!text.toLowerCase().startsWith('aglint')) {
        return null;
    }

    const commandEnd = findNextSpace(text, 0);
    const command: ParsedConfigCommentValue = {
        value: text.slice(0, commandEnd),
        start: base,
        end: base + commandEnd,
    };

    let offset = commandEnd;

    while (offset < text.length && isSpace(text[offset])) {
        offset += 1;
    }

    const commentStart = text.indexOf('--', offset);
    const paramsEnd = commentStart === -1 ? trimEnd(text, text.length) : trimEnd(text, commentStart);

    let comment: ParsedConfigCommentValue | undefined;

    if (commentStart !== -1) {
        comment = {
            value: text.slice(commentStart),
            start: base + commentStart,
            end: base + text.length,
        };
    }

    let params: ParsedConfigComment['params'];

    if (command.value === 'aglint') {
        const value = levn.parse('Object', text.slice(offset, paramsEnd)) as object;

        if (Object.keys(value).length === 0) {
            throw new Error('Empty AGLint config');
        }

        params = {
            type: 'ConfigNode',
            value,
            start: base + offset,
            end: base + paramsEnd,
        };
    } else if (offset < paramsEnd) {
        const paramsText = text.slice(offset, paramsEnd);
        const children: ParsedConfigCommentValue[] = [];
        let itemStart = 0;

        for (let i = 0; i <= paramsText.length; i += 1) {
            if (i === paramsText.length || paramsText[i] === ',') {
                let start = itemStart;
                let end = i;

                while (start < end && isSpace(paramsText[start])) {
                    start += 1;
                }

                while (end > start && isSpace(paramsText[end - 1])) {
                    end -= 1;
                }

                if (start < end) {
                    children.push({
                        value: paramsText.slice(start, end),
                        start: base + offset + start,
                        end: base + offset + end,
                    });
                }

                itemStart = i + 1;
            }
        }

        params = {
            type: 'ParameterList',
            children,
            start: base + offset,
            end: base + paramsEnd,
        };
    }

    return { command, params, comment };
};
