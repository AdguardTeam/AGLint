/**
 * Error thrown when no files match a given pattern.
 */
export class NoFilesForPattern extends Error {
    /**
     * The pattern that matched no files.
     */
    public readonly pattern: string;

    /**
     * Creates a new NoFilesForPattern instance.
     *
     * @param pattern The pattern that matched no files.
     */
    constructor(pattern: string) {
        super(`No files matched pattern: "${pattern}"`);
        this.name = 'NoFilesForPattern';
        this.pattern = pattern;
    }
}
