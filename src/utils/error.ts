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
 * @param options Options for formatting.
 * @param options.colors Whether to include colors in the output.
 *
 * @returns Formatted error.
 */
export async function getFormattedError(
    error: unknown,
    options: { colors?: boolean } = {},
): Promise<string> {
    const { colors = false } = options;

    // Dynamically import chalk to avoid issues with ESM
    const chalk = colors ? (await import('chalk')).default : undefined;

    const lines: string[] = [];

    if (error instanceof Error) {
        const { name, message, stack } = error;

        if (stack) {
            // Parse stack trace to avoid duplicating the message
            const stackLines = stack.split('\n');

            // First line usually contains the error name and message
            const firstLine = stackLines[0] ?? 'Unknown error';
            if (colors && chalk) {
                lines.push(chalk.red.bold(firstLine));
            } else {
                lines.push(firstLine);
            }

            // Add stack trace lines (skip the first line as it's already added)
            const traceLines = stackLines.slice(1).filter((traceLine) => traceLine.trim());
            if (traceLines.length > 0) {
                lines.push('');
                for (const traceLine of traceLines) {
                    const trimmed = traceLine.trim();
                    if (colors && chalk) {
                        // Highlight file paths and line numbers
                        const formatted = trimmed.replace(
                            /\((.+):(\d+):(\d+)\)/g,
                            (_, file, lineNum, colNum) => {
                                const fileColored = chalk.cyan(file);
                                const lineColored = chalk.yellow(lineNum);
                                const colColored = chalk.yellow(colNum);
                                return chalk.gray(`(${fileColored}:${lineColored}:${colColored})`);
                            },
                        );
                        lines.push(chalk.gray(`  ${formatted}`));
                    } else {
                        lines.push(`  ${trimmed}`);
                    }
                }
            }
        } else {
            // No stack trace, format name and message manually
            const errorTitle = name && name !== 'Error' ? `${name}: ${message}` : message;
            if (colors && chalk) {
                lines.push(chalk.red.bold(errorTitle || 'No error message provided'));
            } else {
                lines.push(errorTitle || 'No error message provided');
            }
        }
    } else {
        // Convert any unknown error to string
        const errorString = String(error);
        if (colors && chalk) {
            lines.push(chalk.red(errorString));
        } else {
            lines.push(errorString);
        }
    }

    return lines.join('\n');
}
