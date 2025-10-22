/**
 * Represents a file to be linted.
 */
export type LinterFileProps = {
    /**
     * The content of the file.
     */
    content: string;

    /**
     * The path to the file.
     */
    filePath?: string;

    /**
     * The current working directory.
     */
    cwd?: string;
};
