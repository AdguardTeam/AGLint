import { type LinterConfigFile } from '../../config-file/config-file';

/**
 * Directory node in the linter tree.
 */
export interface DirectoryNode {
    /**
     * Absolute POSIX path to this directory.
     */
    path: string;

    /**
     * Parent directory node (undefined for root).
     */
    parent?: DirectoryNode;

    /**
     * Child directory nodes.
     */
    children: Map<string, DirectoryNode>;

    /**
     * Files directly in this directory.
     */
    files: Set<string>;

    /**
     * Path to .aglintignore file in this directory (if exists).
     */
    ignoreFile?: string;

    /**
     * Paths to all config files found in this directory.
     */
    configFiles: string[];
}

/**
 * Ignore chain entry representing a .aglintignore file.
 */
export interface IgnoreChainEntry {
    /**
     * Absolute path to the .aglintignore file.
     */
    path: string;

    /**
     * Directory containing this ignore file.
     */
    directory: string;

    /**
     * Parsed ignore patterns from the file.
     */
    patterns: string[];
}

/**
 * Config chain entry representing a config file.
 */
export interface ConfigChainEntry {
    /**
     * Absolute path to the config file.
     */
    path: string;

    /**
     * Directory containing this config file.
     */
    directory: string;

    /**
     * Merged config from this file and all parent configs.
     */
    config: LinterConfigFile;

    /**
     * Whether this config has root: true.
     */
    isRoot: boolean;
}

/**
 * Options for building the linter tree.
 */
export interface LinterTreeOptions {
    /**
     * Root directory (usually cwd).
     */
    root: string;

    /**
     * Valid config file names to look for.
     */
    configFileNames: ReadonlySet<string>;

    /**
     * Ignore file name (e.g., .aglintignore).
     */
    ignoreFileName: string;
}
