export const IGNORE_FILE_NAME = '.aglintignore';

export const SUPPORTED_FILE_EXTENSIONS: ReadonlySet<string> = new Set([
    '.txt',
    '.adblock',
    '.adguard',
    '.ublock',
]);

export const DEFAULT_PATTERN = `**/*.{${Array.from(SUPPORTED_FILE_EXTENSIONS).map((e) => e.slice(1)).join(',')}}`;
