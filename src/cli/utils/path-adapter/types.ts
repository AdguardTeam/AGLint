/**
 * Path adapter interface for cross-platform path operations.
 * Abstracts platform-specific path handling (Node.js, browser, VS Code, etc.).
 */
export interface PathAdapter {
    /**
     * Resolve path segments into an absolute path.
     *
     * @param pathSegments Path segments to resolve.
     *
     * @returns Absolute path.
     */
    resolve(...pathSegments: string[]): string;

    /**
     * Join path segments.
     *
     * @param pathSegments Path segments to join.
     *
     * @returns Joined path.
     */
    join(...pathSegments: string[]): string;

    /**
     * Get the directory name of a path.
     *
     * @param p Path to get directory from.
     *
     * @returns Directory path.
     */
    dirname(p: string): string;

    /**
     * Get the base name of a path.
     *
     * @param p Path to get basename from.
     * @param ext Optional extension to remove.
     *
     * @returns Base name.
     */
    basename(p: string, ext?: string): string;

    /**
     * Get the extension of a path.
     *
     * @param p Path to get extension from.
     *
     * @returns Extension including the dot (e.g., '.txt').
     */
    extname(p: string): string;

    /**
     * Parse a path into components.
     *
     * @param p Path to parse.
     *
     * @returns Parsed path components.
     */
    parse(p: string): ParsedPath;

    /**
     * Get relative path from 'from' to 'to'.
     *
     * @param from From path.
     * @param to To path.
     *
     * @returns Relative path.
     */
    relative(from: string, to: string): string;

    /**
     * Check if path is absolute.
     *
     * @param p Path to check.
     *
     * @returns True if absolute.
     */
    isAbsolute(p: string): boolean;

    /**
     * Normalize a path (resolve '..' and '.', remove duplicate separators).
     *
     * @param p Path to normalize.
     *
     * @returns Normalized path.
     */
    normalize(p: string): string;

    /**
     * Convert path to POSIX format (forward slashes).
     *
     * @param p Path to convert.
     *
     * @returns POSIX path.
     */
    toPosix(p: string): string;

    /**
     * Path separator for this platform.
     */
    readonly sep: string;

    /**
     * Path delimiter for this platform (e.g., ':' on Unix, ';' on Windows).
     */
    readonly delimiter: string;
}

/**
 * Parsed path components.
 */
export interface ParsedPath {
    /**
     * Root of the path (e.g., '/' or 'C:\\').
     */
    root: string;

    /**
     * Directory path.
     */
    dir: string;

    /**
     * File name including extension.
     */
    base: string;

    /**
     * File extension including dot.
     */
    ext: string;

    /**
     * File name without extension.
     */
    name: string;
}
