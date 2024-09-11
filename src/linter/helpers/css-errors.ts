import { type SyntaxMatchError, type SyntaxReferenceError } from '@adguard/ecss-tree';

import { isNumber } from '../../utils/type-guards';

/**
 * Interface for errors with offset.
 */
interface ErrorWithOffset extends Error {
    offset: number;
}

/**
 * Check if the error is an instance of ErrorWithOffset.
 *
 * @param possibleError Possible error to check.
 *
 * @returns `true` if the error is an instance of ErrorWithOffset.
 */
export const isErrorContainingOffset = (possibleError: unknown): possibleError is ErrorWithOffset => {
    if (!(possibleError instanceof Error)) {
        return false;
    }

    return 'offset' in possibleError && isNumber(possibleError.offset);
};

/**
 * Check if the error is an instance of SyntaxError, SyntaxMatchError or SyntaxReferenceError.
 *
 * Based on https://github.com/csstree/validator/blob/38e7319d7b049c190f04665df77c836646f3b35e/lib/validate.js#L5-L17
 *
 * @param possibleError Error to check.
 *
 * @returns `true` if the error is an instance of SyntaxError, SyntaxMatchError or SyntaxReferenceError.
 */
export const isCssTreeSyntaxError = (
    possibleError: unknown,
): possibleError is SyntaxError | SyntaxMatchError | SyntaxReferenceError => {
    if (!possibleError || !(possibleError instanceof Error)) {
        return false;
    }

    if (!('name' in possibleError)) {
        return false;
    }

    return possibleError.name === 'SyntaxError'
        || possibleError.name === 'SyntaxMatchError'
        || possibleError.name === 'SyntaxReferenceError';
};
