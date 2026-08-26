import detectIndent from 'detect-indent';
import { detectNewline } from 'detect-newline';

import { NEWLINE } from '../common/constants';

/**
 * Formats JSON with the same style as the original content.
 * Detects and preserves indent, newline style, and final newline.
 *
 * @param obj Object to serialize.
 * @param originalContent Original file content to detect formatting from.
 *
 * @returns Formatted JSON string.
 */
export const formatJson = (obj: unknown, originalContent: string): string => {
    const indent = detectIndent(originalContent).indent ?? '  ';
    const newline = detectNewline(originalContent) ?? NEWLINE;
    const hasFinalNewline = originalContent.endsWith(newline);

    let formatted = JSON.stringify(obj, null, indent);

    // Replace newlines with detected style
    if (newline !== NEWLINE) {
        formatted = formatted.split(NEWLINE).join(newline);
    }

    // Add final newline if original had one
    if (hasFinalNewline) {
        formatted += newline;
    }

    return formatted;
};
