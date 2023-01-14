/**
 * Possible names of the config file
 */
export const CONFIG_FILE_NAMES = ["aglint.config.json", "aglint.config.yaml", "aglint.config.yml"];

/**
 * Name of the ignore file
 */
export const IGNORE_FILE_NAME = ".aglintignore";

/**
 * Supported file extensions for lintable files
 */
export const SUPPORTED_EXTENSIONS = [".txt", ".adblock", ".adguard", ".ublock"];

/**
 * Problematic paths that should be ignored by default
 */
export const PROBLEMATIC_PATHS = ["node_modules", ".git", ".hg", ".svn", ".DS_Store", "Thumbs.db"];
