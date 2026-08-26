import crypto from 'node:crypto';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { hash as hashObject } from 'ohash';
import * as v from 'valibot';

import { version } from '../../package.json';
import { type LinterConfig } from '../linter/config';
import { type LinterResult, linterResultSchema } from '../linter/linter';

import { getLinterConfigHash } from './utils/config-hash';
import { toPosix } from './utils/to-posix';

/**
 * Default cache file name.
 */
export const CACHE_FILE_NAME = '.aglintcache';

/**
 * Cache strategy for determining when to invalidate cache.
 */
export enum LinterCacheStrategy {
    /**
     * Cache is invalidated when file metadata (mtime, size) changes.
     */
    Metadata = 'metadata',

    /**
     * Cache is invalidated when file content hash changes.
     */
    Content = 'content',
}

/**
 * Parameters for validating cached data.
 * Uses discriminated union to ensure correct parameters based on strategy.
 */
export type CacheDataValidatorParams =
    | {
        strategy: LinterCacheStrategy.Metadata;
        mtime: number;
        size: number;
    }
    | {
        strategy: LinterCacheStrategy.Content;
        fileContent: string;
    };

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

/**
 * Cached data for a single file.
 */
export type CacheFileData = v.InferOutput<typeof cacheFileDataSchema>;

const cacheFileSchema = v.object({
    linterVersion: v.string(),
    cacheVersion: v.string(),
    files: v.record(v.string(), cacheFileDataSchema),
});

type LinterCacheFile = v.InferOutput<typeof cacheFileSchema>;

/**
 * Computes a hash of file content using BLAKE2b-512.
 *
 * @param content File content to hash.
 *
 * @returns Hex-encoded hash string.
 */
export const getFileHash = (content: string): string => {
    return crypto.createHash('blake2b512').update(content).digest('hex');
};

/**
 * Manages caching of linter results to improve performance on subsequent runs.
 *
 * Supports two caching strategies:
 * - Metadata: Fast but less accurate, based on file mtime and size
 * - Content: Slower but accurate, based on file content hash.
 */
export class LintResultCache {
    /**
     * Cache file format version.
     */
    private static readonly CACHE_VERSION = '1';

    /**
     * Current working directory.
     */
    private readonly cwd: string;

    /**
     * Path to the cache file.
     */
    private readonly cacheFilePath: string;

    /**
     * In-memory cache data.
     */
    private readonly data: LinterCacheFile;

    /**
     * Cache for linter config hashes to avoid recomputing.
     */
    private static linterConfigHashCache = new WeakMap<LinterConfig, string>();

    /**
     * Private constructor. Use `create()` to instantiate.
     *
     * @param cwd Current working directory.
     * @param cacheFilePath Path to the cache file.
     * @param data In-memory cache data.
     */
    private constructor(cwd: string, cacheFilePath: string, data: LinterCacheFile) {
        this.cwd = cwd;
        this.cacheFilePath = cacheFilePath;
        this.data = data;
    }

    /**
     * Computes or retrieves cached hash of linter configuration.
     * Wraps the utility function with a WeakMap cache for performance.
     *
     * @param config Linter configuration to hash.
     *
     * @returns Hash string.
     */
    private static getCachedConfigHash(config: LinterConfig): string {
        if (LintResultCache.linterConfigHashCache.has(config)) {
            return LintResultCache.linterConfigHashCache.get(config)!;
        }

        const hash = getLinterConfigHash(config);
        LintResultCache.linterConfigHashCache.set(config, hash);

        return hash;
    }

    /**
     * Resolves the cache file path based on whether the provided parameter is
     * a directory or looks like a directory (ends with path separator).
     * If it's a directory, creates a unique cache filename using hash of cwd.
     * Similar to ESLint's getCacheFile function.
     *
     * @param cwd Current working directory.
     * @param cacheFilePath The cache file path (can be relative or absolute).
     *
     * @returns The resolved absolute path to the cache file.
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
         * based on the hash of the cwd.
         *
         * @returns The cache filename for a directory.
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

    /**
     * Creates an empty cache file structure.
     *
     * @returns Empty cache file with current version information.
     */
    private static createEmptyCacheFile(): LinterCacheFile {
        return {
            linterVersion: version,
            cacheVersion: LintResultCache.CACHE_VERSION,
            files: {},
        };
    }

    /**
     * Creates a new cache instance by loading from disk or creating empty.
     *
     * @param cwd Current working directory.
     * @param cacheFilePath Path to cache file.
     *
     * @returns A new LintResultCache instance.
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
     * Gets cached data for a file.
     *
     * Note: Returns data without validation. Validation is delegated to the worker
     * to avoid double I/O - the executor doesn't need to read file content just
     * for cache validation when the worker will read it anyway for linting.
     *
     * @param filePath Absolute file path.
     * @param linterConfig Linter configuration.
     *
     * @returns Cached data (without validation), undefined if not in cache or config mismatch.
     */
    public getCacheData(filePath: string, linterConfig: LinterConfig): CacheFileData | undefined {
        const cached = this.data.files[filePath];

        if (!cached) {
            return undefined;
        }

        const configHash = LintResultCache.getCachedConfigHash(linterConfig);

        // Config must always match
        if (cached.linterConfigHash !== configHash) {
            return undefined;
        }

        // Return cached data without validation
        // Worker will validate based on strategy (mtime/size or content hash)
        return cached;
    }

    /**
     * Validates cached data based on the cache strategy.
     *
     * This method is called by the worker to validate cache before using it.
     * Validation is done in the worker (not executor) to avoid double I/O:
     * - For metadata strategy: Compare mtime/size (already from scanner).
     * - For content strategy: Read file once for both validation and linting.
     *
     * @param cachedData The cached data to validate.
     * @param validatorParams Validation parameters with strategy and required data.
     *
     * @returns True if cache is valid, false otherwise.
     */
    public static validateCacheData(
        cachedData: CacheFileData,
        validatorParams: CacheDataValidatorParams,
    ): boolean {
        if (validatorParams.strategy === LinterCacheStrategy.Metadata) {
            // For metadata strategy, validate mtime/size
            return cachedData.meta.mtime === validatorParams.mtime
                && cachedData.meta.size === validatorParams.size;
        }

        if (validatorParams.strategy === LinterCacheStrategy.Content) {
            // For content strategy, validate file content hash
            const currentHash = getFileHash(validatorParams.fileContent);
            return cachedData.contentHash === currentHash;
        }

        return false;
    }

    /**
     * Sets cached result for a file.
     *
     * @param filePath Absolute file path.
     * @param mtime File modification time.
     * @param size File size.
     * @param linterConfig Linter configuration.
     * @param result Linter result.
     * @param contentHash Optional content hash for content-based caching.
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
            linterConfigHash: LintResultCache.getCachedConfigHash(linterConfig),
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
     * Gets the raw cache data.
     *
     * Useful for passing cache data to worker threads in parallel mode.
     *
     * @returns Complete cache file data.
     */
    public getData(): LinterCacheFile {
        return this.data;
    }
}
