/**
 * Name of the file containing ignore patterns.
 */
export const IGNORE_FILE_NAME = '.aglintignore';

/**
 * File extensions that are recognized as filter lists.
 */
export const SUPPORTED_FILE_EXTENSIONS: ReadonlySet<string> = new Set([
    '.txt',
    '.adblock',
    '.adguard',
    '.ublock',
]);

/**
 * Default glob pattern for finding filter list files.
 * Matches all supported file extensions.
 */
export const DEFAULT_PATTERN = `**/*.{${Array.from(SUPPORTED_FILE_EXTENSIONS).map((e) => e.slice(1)).join(',')}}`;
