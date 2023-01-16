/**
 * Possible names of the config file
 */
export const CONFIG_FILE_NAMES = [
    // aglint.config stuff
    "aglint.config.json",
    "aglint.config.yaml",
    "aglint.config.yml",

    // .aglintrc stuff
    ".aglintrc",
    ".aglintrc.json",
    ".aglintrc.yaml",
    ".aglintrc.yml",
];

/**
 * Name of the ignore file
 */
export const IGNORE_FILE_NAME = ".aglintignore";

/**
 * Supported file extensions for lintable files. Text is the most important one, but we also
 * support other possible extensions, which may occur in some cases.
 */
export const SUPPORTED_EXTENSIONS = [".txt", ".adblock", ".adguard", ".ublock"];

/**
 * Problematic paths that should be ignored by default. This is essential to provide a good
 * experience for the user.
 */
export const PROBLEMATIC_PATHS = ["node_modules", ".git", ".hg", ".svn", ".DS_Store", "Thumbs.db"];
