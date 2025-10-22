type ErrorWithMessage = {
    message: string;
};

/**
 * Checks if error has message.
 *
 * @param error Error object.
 *
 * @returns If param is error.
 */
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
    return (
        typeof error === 'object'
        && error !== null
        && 'message' in error
        && typeof (error as Record<string, unknown>).message === 'string'
    );
}

/**
 * Converts error to the error with message.
 *
 * @param maybeError Possible error.
 *
 * @returns Error with message.
 */
function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
    if (isErrorWithMessage(maybeError)) {
        return maybeError;
    }

    try {
        return new Error(JSON.stringify(maybeError));
    } catch {
        // fallback in case there's an error stringifying the maybeError
        // like with circular references for example.
        return new Error(String(maybeError));
    }
}

/**
 * Converts error object to error with message. This method might be helpful to handle thrown errors.
 *
 * @param error Error object.
 *
 * @returns Message of the error.
 */
export function getErrorMessage(error: unknown): string {
    return toErrorWithMessage(error).message;
}

/**
 * Formats error to the string.
 *
 * @param error Error to format.
 *
 * @returns Formatted error.
 */
export function getFormattedError(error: unknown): string {
    const lines: string[] = [];

    if (error instanceof Error) {
        const { message, stack } = error;

        lines.push(message || 'No error message provided');
        lines.push('');

        // Very basic stack trace formatting
        lines.push(
            ...(stack || '').split('\n').map((line) => `  ${line}`),
        );
    } else {
        // Convert any unknown error to string
        lines.push(String(error));
    }

    return lines.join('\n');
}
