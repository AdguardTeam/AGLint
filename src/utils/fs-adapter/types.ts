/**
 * File system statistics.
 */
export interface FileStats {
    /**
     * Whether this is a file.
     */
    isFile: boolean;

    /**
     * Whether this is a directory.
     */
    isDirectory: boolean;

    /**
     * File size in bytes.
     */
    size: number;

    /**
     * Last modification time in milliseconds since epoch.
     */
    mtime: number;
}

/**
 * Glob pattern matching options.
 */
export interface GlobOptions {
    /**
     * Current working directory for relative patterns.
     */
    cwd: string;

    /**
     * Include dotfiles.
     */
    dot?: boolean;

    /**
     * Only match files (not directories).
     */
    onlyFiles?: boolean;

    /**
     * Follow symbolic links.
     */
    followSymlinks?: boolean;

    /**
     * Return absolute paths.
     */
    absolute?: boolean;

    /**
     * Ignore patterns to exclude.
     */
    ignore?: string[];
}

/**
 * File change event types.
 */
export enum FileChangeType {
    Created = 'created',
    Modified = 'modified',
    Deleted = 'deleted',
}

/**
 * File change event.
 */
export interface FileChangeEvent {
    /**
     * Type of change.
     */
    type: FileChangeType;

    /**
     * Absolute path to the changed file.
     */
    path: string;
}

/**
 * Disposable resource (e.g., file watcher).
 */
export interface Disposable {
    /**
     * Dispose the resource.
     */
    dispose(): void;
}

/**
 * File system adapter interface for cross-platform compatibility.
 * Implementations can target Node.js, VS Code, browser, etc.
 */
export interface FileSystemAdapter {
    /**
     * Read a file as UTF-8 text.
     *
     * @param path Absolute path to the file
     * @returns Promise resolving to file content
     * @throws If file doesn't exist or can't be read
     */
    readFile(path: string): Promise<string>;

    /**
     * Get file or directory statistics.
     *
     * @param path Absolute path to the file or directory
     * @returns Promise resolving to file stats
     * @throws If path doesn't exist
     */
    stat(path: string): Promise<FileStats>;

    /**
     * Check if a file or directory exists.
     *
     * @param path Absolute path to check
     * @returns Promise resolving to true if exists
     */
    exists(path: string): Promise<boolean>;

    /**
     * Match files using glob patterns.
     *
     * @param patterns Glob patterns to match
     * @param options Glob options
     * @returns Promise resolving to array of matched file paths
     */
    glob(patterns: string[], options: GlobOptions): Promise<string[]>;

    /**
     * Watch a file or directory for changes (optional).
     *
     * @param path Absolute path to watch
     * @param callback Callback for file changes
     * @returns Disposable to stop watching
     */
    watch?(path: string, callback: (event: FileChangeEvent) => void): Disposable;
}
