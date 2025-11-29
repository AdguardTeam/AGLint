import isGlob from 'is-glob';

import { SUPPORTED_FILE_EXTENSIONS } from '../../constants';
import { type FileSystemAdapter } from '../fs-adapter';
import { type PathAdapter } from '../path-adapter';

import { NoFilesForPattern } from './errors/no-files-for-pattern';
import { type PatternMatchOptions, type PatternMatchResult } from './types';

/**
 * Default patterns to ignore during file matching.
 */
export const DEFAULT_IGNORE_PATTERNS: readonly string[] = [
    '**/node_modules/**',
    '**/.git/**',
    '**/.hg/**',
    '**/.svn/**',
    '**/.DS_Store',
    '**/Thumbs.db',
];

/**
 * Matches files based on patterns (files, directories, or globs).
 *
 * This function:
 * 1. Expands directory patterns to globs
 * 2. Validates that file patterns exist
 * 3. Matches glob patterns
 * 4. Applies default ignore patterns (e.g., node_modules)
 * 5. Throws error if any pattern matches nothing.
 *
 * @param patterns Array of file paths, directory paths, or glob patterns.
 * @param fs File system adapter.
 * @param pathAdapter Path adapter for path operations.
 * @param options Pattern matching options.
 *
 * @returns Promise resolving to match result with files and pattern map.
 *
 * @throws {NoFilesForPattern} If any pattern matches no files.
 */
export async function matchPatterns(
    patterns: string[],
    fs: FileSystemAdapter,
    pathAdapter: PathAdapter,
    options: PatternMatchOptions,
): Promise<PatternMatchResult> {
    const {
        cwd,
        defaultIgnorePatterns = DEFAULT_IGNORE_PATTERNS,
        followSymlinks = false,
        dot = true,
        debug,
    } = options;

    if (debug) {
        debug.log(`Matching ${patterns.length} pattern(s): ${patterns.join(', ')}`);
    }

    const absCwd = pathAdapter.toPosix(pathAdapter.resolve(cwd));
    const patternMap = new Map<string, string[]>();
    const expandedPatterns: string[] = [];

    if (debug) {
        debug.log(`Working directory: ${absCwd}`);
    }

    // Process each pattern and expand as needed
    for (const pattern of patterns) {
        const normalizedPattern = pathAdapter.toPosix(pattern);

        if (isGlob(normalizedPattern)) {
            // Glob pattern - use as-is
            if (debug) {
                debug.log(`Pattern "${pattern}" is a glob`);
            }
            expandedPatterns.push(normalizedPattern);
            patternMap.set(pattern, []);
        } else {
            // File or directory path - resolve and check
            const absPath = pathAdapter.toPosix(pathAdapter.resolve(absCwd, normalizedPattern));

            try {
                // eslint-disable-next-line no-await-in-loop
                const stats = await fs.stat(absPath);

                if (stats.isFile) {
                    // Direct file reference
                    if (debug) {
                        debug.log(`Pattern "${pattern}" is a file: ${absPath}`);
                    }
                    expandedPatterns.push(absPath);
                    patternMap.set(pattern, []);
                } else if (stats.isDirectory) {
                    // Directory - expand to glob pattern with supported file extensions
                    const extensions = Array.from(SUPPORTED_FILE_EXTENSIONS).map((e) => e.slice(1)).join(',');
                    const dirGlob = `${absPath.replace(/\/+$/, '')}/**/*.{${extensions}}`;
                    if (debug) {
                        debug.log(`Pattern "${pattern}" is a directory, expanding to: ${dirGlob}`);
                    }
                    expandedPatterns.push(dirGlob);
                    patternMap.set(pattern, []);
                } else {
                    // Not a file or directory
                    throw new NoFilesForPattern(pattern);
                }
            } catch (error) {
                // Path doesn't exist - throw immediately
                throw new NoFilesForPattern(pattern);
            }
        }
    }

    // Match all patterns with glob
    if (debug) {
        debug.log(`Running glob with ${expandedPatterns.length} expanded pattern(s)`);
    }
    const matchedFiles = await fs.glob(expandedPatterns, {
        cwd: absCwd,
        dot,
        onlyFiles: true,
        followSymlinks,
        absolute: true,
        ignore: [...defaultIgnorePatterns],
    });
    if (debug) {
        debug.log(`Glob matched ${matchedFiles.length} file(s)`);
    }

    // Build pattern map - determine which files came from which pattern
    for (let i = 0; i < patterns.length; i += 1) {
        const originalPattern = patterns[i]!;
        const expandedPattern = expandedPatterns[i]!;
        const normalizedPattern = pathAdapter.toPosix(originalPattern);

        if (isGlob(normalizedPattern)) {
            // For glob patterns, re-match to get specific files
            // eslint-disable-next-line no-await-in-loop
            const globMatches = await fs.glob([expandedPattern], {
                cwd: absCwd,
                dot,
                onlyFiles: true,
                followSymlinks,
                absolute: true,
                ignore: [...defaultIgnorePatterns],
            });
            patternMap.set(originalPattern, globMatches);
        } else {
            // For file/directory patterns, filter matched files
            const absPath = pathAdapter.toPosix(pathAdapter.resolve(absCwd, normalizedPattern));
            const matches = matchedFiles.filter((file) => {
                if (expandedPattern === absPath) {
                    // Direct file
                    return file === absPath;
                }
                // Directory - check if file is under this directory
                return file.startsWith(`${absPath}/`);
            });
            patternMap.set(originalPattern, matches);
        }
    }

    // Validate that each pattern matched at least one file
    for (const [pattern, matches] of patternMap.entries()) {
        if (matches.length === 0) {
            throw new NoFilesForPattern(pattern);
        }
        if (debug) {
            debug.log(`Pattern "${pattern}" matched ${matches.length} file(s)`);
        }
    }

    return {
        files: matchedFiles,
        patternMap,
    };
}
