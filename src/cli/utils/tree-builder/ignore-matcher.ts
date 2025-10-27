import ignore, { type Ignore } from 'ignore';

import { type PathAdapter } from '../path-adapter';

import { type IgnoreChainEntry } from './types';

/**
 * Builds an ignore matcher from an ignore chain.
 * Handles hierarchical .aglintignore files with proper scoping.
 */
export class IgnoreMatcher {
    /**
     * Array of matchers, each containing a directory and its corresponding ignore instance.
     */
    private matchers: Array<{ directory: string; ig: Ignore }> = [];

    /**
     * Creates a new ignore matcher.
     *
     * @param pathAdapter Path adapter for path operations.
     * @param root Root directory path.
     * @param ignoreChain Array of ignore chain entries.
     */
    constructor(
        private pathAdapter: PathAdapter,
        private root: string,
        ignoreChain: IgnoreChainEntry[],
    ) {
        // Build matchers from chain (reverse order - farthest to closest)
        for (let i = ignoreChain.length - 1; i >= 0; i -= 1) {
            const entry = ignoreChain[i]!;
            const ig = ignore();
            ig.add(entry.patterns);
            this.matchers.push({
                directory: entry.directory,
                ig,
            });
        }
    }

    /**
     * Checks if a path should be ignored.
     *
     * @param targetPath Absolute path to check.
     *
     * @returns True if the path should be ignored.
     */
    public isIgnored(targetPath: string): boolean {
        const absPath = this.pathAdapter.resolve(targetPath);

        // Check each matcher from farthest to closest
        for (const { directory, ig } of this.matchers) {
            // Only apply this matcher if path is under its directory
            if (!absPath.startsWith(`${directory}/`) && absPath !== directory) {
                continue;
            }

            // Get relative path from the matcher's directory
            const relativePath = this.pathAdapter.relative(directory, absPath);

            // Check if ignored
            if (ig.ignores(relativePath)) {
                return true;
            }
        }

        return false;
    }
}
