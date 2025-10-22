import crypto from 'node:crypto';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { hash as hashObject } from 'ohash';
import * as v from 'valibot';

import { version } from '../../package.json';
import { type LinterConfig } from '../linter/config';
import { type LinterResult, linterResultSchema } from '../linter/linter';
import { toPosix } from '../utils/to-posix';

export const CACHE_FILE_NAME = '.aglintcache';

export enum LinterCacheStrategy {
    Content = 'content',
    Metadata = 'metadata',
}

const cacheFileMetaSchema = v.object({
    mtime: v.number(),
    size: v.number(),
});

const cacheFileDataSchema = v.object({
    meta: cacheFileMetaSchema,
    contentHash: v.optional(v.string()),
    linterConfigHash: v.string(),
    linterResult: linterResultSchema,
});

export type CacheFileData = v.InferOutput<typeof cacheFileDataSchema>;

const cacheFileSchema = v.object({
    linterVersion: v.string(),
    cacheVersion: v.string(),
    files: v.record(v.string(), cacheFileDataSchema),
});

type LinterCacheFile = v.InferOutput<typeof cacheFileSchema>;

export const getFileHash = (content: string): string => {
    return crypto.createHash('blake2b512').update(content).digest('hex');
};

export class LintResultCache {
    private static readonly CACHE_VERSION = '1';

    private readonly cwd: string;

    private readonly cacheFilePath: string;

    private readonly data: LinterCacheFile;

    private static linterConfigHashCache = new WeakMap<LinterConfig, string>();

    private constructor(cwd: string, cacheFilePath: string, data: LinterCacheFile) {
        this.cwd = cwd;
        this.cacheFilePath = cacheFilePath;
        this.data = data;
    }

    private static getLinterConfigHash = (config: LinterConfig): string => {
        if (LintResultCache.linterConfigHashCache.has(config)) {
            return LintResultCache.linterConfigHashCache.get(config)!;
        }

        const hash = hashObject(config);
        LintResultCache.linterConfigHashCache.set(config, hash);

        return hash;
    };

    /**
     * Resolves the cache file path based on whether the provided parameter is
     * a directory or looks like a directory (ends with path separator).
     * If it's a directory, creates a unique cache filename using hash of cwd.
     * Similar to ESLint's getCacheFile function.
     *
     * @param cwd Current working directory
     * @param cacheFilePath The cache file path (can be relative or absolute)
     *
     * @returns The resolved absolute path to the cache file
     */
    private static resolveAbsoluteCachePath = async (
        cwd: string,
        cacheFilePath: string,
    ): Promise<string> => {
        // Resolve relative to cwd
        const resolvedCacheFile = path.isAbsolute(cacheFilePath)
            ? cacheFilePath
            : path.resolve(cwd, cacheFilePath);

        const posixCacheFilePath = toPosix(cacheFilePath);

        // Check if it looks like a directory (ends with path separator)
        const looksLikeADirectory = posixCacheFilePath.endsWith('/');

        /**
         * Return the cache filename for a directory by creating a unique name
         * based on the hash of the cwd
         */
        const getCacheFileForDirectory = (): string => {
            const cwdHash = hashObject(cwd);
            return path.join(resolvedCacheFile, `.cache_${cwdHash}`);
        };

        // Try to stat the path to see if it exists and what type it is
        try {
            const stats = await stat(resolvedCacheFile);

            /*
             * If the file exists and is a directory, or if the original path
             * looked like a directory (had trailing separator that path.resolve removed),
             * create a unique cache file inside the directory
             */
            if (stats.isDirectory() || looksLikeADirectory) {
                return getCacheFileForDirectory();
            }

            // It's a file, use it as-is
            return resolvedCacheFile;
        } catch {
            /*
             * File/directory doesn't exist yet.
             * Infer if it's meant to be a directory based on trailing separator.
             */
            if (looksLikeADirectory) {
                return getCacheFileForDirectory();
            }

            // Treat as a file path
            return resolvedCacheFile;
        }
    };

    private static createEmptyCacheFile(): LinterCacheFile {
        return {
            linterVersion: version,
            cacheVersion: LintResultCache.CACHE_VERSION,
            files: {},
        };
    }

    /**
     * Creates a new cache instance by loading from disk or creating empty.
     * @param cwd Current working directory
     * @param cacheFilePath Path to cache file
     * @returns A new LintResultCache instance
     */
    public static async create(cwd: string, cacheFilePath: string): Promise<LintResultCache> {
        const absoluteCachePath = await LintResultCache.resolveAbsoluteCachePath(cwd, cacheFilePath);

        let data: LinterCacheFile;
        try {
            const content = await readFile(absoluteCachePath, 'utf8');
            data = v.parse(cacheFileSchema, JSON.parse(content));

            if (data.cacheVersion !== LintResultCache.CACHE_VERSION) {
                throw new Error(
                    `Cache file version mismatch: expected ${LintResultCache.CACHE_VERSION}, got ${data.cacheVersion}`,
                );
            }
        } catch {
            data = LintResultCache.createEmptyCacheFile();
        }

        return new LintResultCache(cwd, cacheFilePath, data);
    }

    /**
     * Gets cached result for a file if valid.
     *
     * @param filePath Absolute file path
     * @param mtime File modification time
     * @param size File size
     * @param linterConfig Linter configuration
     * @param strategy Cache strategy to use
     *
     * @returns Cached data if valid, undefined otherwise
     */
    public getCachedResult(
        filePath: string,
        mtime: number,
        size: number,
        linterConfig: LinterConfig,
        strategy: LinterCacheStrategy,
    ): CacheFileData | undefined {
        const cached = this.data.files[filePath];

        if (!cached) {
            return undefined;
        }

        const configHash = LintResultCache.getLinterConfigHash(linterConfig);

        // Check metadata-based cache
        if (strategy === LinterCacheStrategy.Metadata) {
            if (
                cached.meta.mtime === mtime
                && cached.meta.size === size
                && cached.linterConfigHash === configHash
            ) {
                return cached;
            }
        }

        // For content-based caching, return if config matches (content hash checked in worker)
        if (strategy === LinterCacheStrategy.Content && cached.linterConfigHash === configHash) {
            return cached;
        }

        return undefined;
    }

    /**
     * Sets cached result for a file.
     *
     * @param filePath Absolute file path
     * @param mtime File modification time
     * @param size File size
     * @param linterConfig Linter configuration
     * @param result Linter result
     * @param contentHash Optional content hash for content-based caching
     */
    public setCachedResult(
        filePath: string,
        mtime: number,
        size: number,
        linterConfig: LinterConfig,
        result: LinterResult,
        contentHash?: string,
    ): void {
        this.data.files[filePath] = {
            meta: { mtime, size },
            linterConfigHash: LintResultCache.getLinterConfigHash(linterConfig),
            linterResult: result,
            ...(contentHash && { contentHash }),
        };
    }

    /**
     * Saves the cache to disk.
     */
    public async save(): Promise<void> {
        const absoluteCachePath = await LintResultCache.resolveAbsoluteCachePath(this.cwd, this.cacheFilePath);
        await writeFile(absoluteCachePath, JSON.stringify(this.data));
    }

    /**
     * Gets the raw cache data (for passing to workers in parallel mode).
     */
    public getData(): LinterCacheFile {
        return this.data;
    }
}
