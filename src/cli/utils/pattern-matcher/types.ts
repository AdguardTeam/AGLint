import { type ModuleDebugger } from '../debug';

/**
 * Result of pattern matching.
 */
export interface PatternMatchResult {
    /**
     * Absolute paths of all matched files.
     */
    files: string[];

    /**
     * Map of original pattern to matched files.
     * Useful for error reporting.
     */
    patternMap: Map<string, string[]>;
}

/**
 * Options for pattern matching.
 */
export interface PatternMatchOptions {
    /**
     * Current working directory for resolving relative patterns.
     */
    cwd: string;

    /**
     * Default patterns to exclude (e.g., node_modules, .git).
     */
    defaultIgnorePatterns?: string[];

    /**
     * Follow symbolic links when expanding directories.
     */
    followSymlinks?: boolean;

    /**
     * Include dotfiles in glob matches.
     */
    dot?: boolean;

    /**
     * Optional module debugger for logging.
     */
    debug?: ModuleDebugger;
}
