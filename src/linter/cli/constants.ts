export const CONFIG_FILE = 'aglint.config';
export const RC_CONFIG_FILE = '.aglintrc';

export const EXT_JSON = '.json';
export const EXT_YAML = '.yaml';
export const EXT_YML = '.yml';

/**
 * Possible names of the config file
 */
export const CONFIG_FILE_NAMES = [
    // aglint.config stuff
    CONFIG_FILE + EXT_JSON,
    CONFIG_FILE + EXT_YAML,
    CONFIG_FILE + EXT_YML,

    // .aglintrc stuff
    RC_CONFIG_FILE,
    RC_CONFIG_FILE + EXT_JSON,
    RC_CONFIG_FILE + EXT_YAML,
    RC_CONFIG_FILE + EXT_YML,
];

/**
 * Name of the ignore file
 */
export const IGNORE_FILE_NAME = '.aglintignore';

/**
 * Supported file extensions for lintable files. Text is the most important one, but we also
 * support other possible extensions, which may occur in some cases.
 */
export const SUPPORTED_EXTENSIONS = [
    '.txt',
    '.adblock',
    '.adguard',
    '.ublock',
];

/**
 * Problematic paths that should be ignored by default. This is essential to provide a good
 * experience for the user.
 */
export const PROBLEMATIC_PATHS = [
    'node_modules',
    '.git',
    '.hg',
    '.svn',
    '.DS_Store',
    'Thumbs.db',
];
