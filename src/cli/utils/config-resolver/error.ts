/**
 * Error thrown when config file validation fails.
 *
 * Extends the standard Error with file path and property path information
 * to help users identify where the configuration error occurred.
 *
 * @example
 * ```typescript
 * throw new InvalidConfigError(
 *   'Invalid config',
 *   '/path/to/config.json',
 *   'rules.some-rule'
 * );
 * ```
 */
export class InvalidConfigError extends Error {
    /**
     * Creates a new invalid config error.
     *
     * @param message Description of the config error.
     * @param filePath Path to the config file that has the error.
     * @param propertyPath Optional dot-separated path to the property that caused the error (e.g., 'rules.some-rule').
     */
    constructor(
        message: string,
        public readonly filePath: string,
        public readonly propertyPath?: string,
    ) {
        const location = propertyPath ? ` at "${propertyPath}"` : '';
        super(`Invalid config in "${filePath}"${location}: ${message}`);
        this.name = 'InvalidConfigError';
    }
}
