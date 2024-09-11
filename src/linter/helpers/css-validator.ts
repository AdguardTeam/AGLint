import { lexer, property as getPropertyDescriptor, type Declaration } from '@adguard/ecss-tree';

import { isCssTreeSyntaxError } from './css-errors';
import { isString } from '../../utils/type-guards';
import { getCssTreeStartAndEndOffsetsFromObject } from './css-loc-extractor';

/**
 * Interface for CSS validator error.
 */
interface CssValidatorError {
    /**
     * Error message.
     */
    message: string;

    /**
     * Start offset of the error. Relative to the specified node.
     */
    start?: number;

    /**
     * End offset of the error. Relative to the specified node.
     */
    end?: number;
}

/**
 * Helper function to validate CSS declaration.
 * Idea from https://github.com/csstree/validator/blob/38e7319d7b049c190f04665df77c836646f3b35e/lib/validate.js#L99-L121
 *
 * @param declarationNode - CSS declaration node to validate.
 *
 * @returns Array of syntax errors.
 */
export const validateDeclaration = (declarationNode: Declaration): CssValidatorError[] => {
    const errors: CssValidatorError[] = [];

    const { property, value } = declarationNode;

    // Ignore custom properties, like `--foo`
    if (getPropertyDescriptor(property).custom) {
        return errors;
    }

    let possibleError: unknown;

    // TODO: Improve CSSTree typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    possibleError = (lexer as any).checkPropertyName(property);

    if (isCssTreeSyntaxError(possibleError)) {
        errors.push({
            message: possibleError.message,
            start: declarationNode.loc?.start.offset,
            end: declarationNode.loc?.end.offset,
        });
    } else {
        possibleError = lexer.matchProperty(property, value).error;

        if (isCssTreeSyntaxError(possibleError)) {
            let message = `Invalid value for '${property}' property`;

            if ('syntax' in possibleError && isString(possibleError.syntax)) {
                message += `, mismatch with syntax ${possibleError.syntax}`;
            }

            let start: number | undefined;
            let end: number | undefined;

            const possibleErrorOffsets = getCssTreeStartAndEndOffsetsFromObject(possibleError);

            if (!possibleErrorOffsets) {
                start = declarationNode.loc?.start.offset;
                end = declarationNode.loc?.end.offset;
            } else {
                [start, end] = possibleErrorOffsets;
            }

            errors.push({
                message,
                start,
                end,
            });
        }
    }

    return errors;
};
