import {
    type Declaration,
    type DeclarationPlain,
    property as getPropertyDescriptor,
    lexer,
} from '@adguard/ecss-tree';

import { isString } from '../type-guards';

import { isCssTreeSyntaxError, isCssTreeSyntaxMatchError } from './css-errors';

/**
 * Interface for CSS validator error.
 */
interface CssValidatorError {
    /**
     * Error message.
     */
    message: string;

    /**
     * Start offset of the error.
     */
    start?: number;

    /**
     * End offset of the error.
     */
    end?: number;
}

/**
 * Helper function to validate CSS declaration.
 * Idea from https://github.com/csstree/validator/blob/38e7319d7b049c190f04665df77c836646f3b35e/lib/validate.js#L99-L121.
 *
 * @param declarationNode CSS declaration node to validate.
 *
 * @returns Array of syntax errors.
 */
export const validateDeclaration = (declarationNode: Declaration | DeclarationPlain): CssValidatorError[] => {
    const errors: CssValidatorError[] = [];

    const { property, value } = declarationNode;

    // Ignore custom properties, like `--foo`
    if (getPropertyDescriptor(property).custom) {
        return errors;
    }

    let possibleError: unknown;

    possibleError = lexer.checkPropertyName(property);

    if (isCssTreeSyntaxError(possibleError)) {
        errors.push({
            message: possibleError.message,
            start: declarationNode.loc?.start.offset,
            end: declarationNode.loc?.end.offset,
        });

        return errors;
    }

    possibleError = lexer.matchProperty(property, value).error;

    if (isCssTreeSyntaxError(possibleError)) {
        let message = `Invalid value for '${property}' property`;

        if ('syntax' in possibleError && isString(possibleError.syntax)) {
            message += `, mismatch with syntax ${possibleError.syntax}`;
        }

        let start: number | undefined;
        let end: number | undefined;

        if (isCssTreeSyntaxMatchError(possibleError)) {
            start = possibleError.loc.start.offset;
            end = possibleError.loc.end.offset;
        } else {
            start = declarationNode.loc?.start.offset;
            end = declarationNode.loc?.end.offset;
        }

        errors.push({
            message,
            start,
            end,
        });
    }

    return errors;
};
