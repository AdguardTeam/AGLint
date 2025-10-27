import {
    mkdir,
    rm,
    stat,
    writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AdblockSyntax } from '@adguard/agtree';
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
} from 'vitest';

import { getFileHash, LinterCacheStrategy, LintResultCache } from '../../src/cli/cache';
import { type LinterResult } from '../../src/linter/linter';
import { LinterRuleSeverity } from '../../src/linter/rule';

describe('cache', () => {
    let testDir: string;

    beforeAll(async () => {
        testDir = join(tmpdir(), `aglint-cache-test-${Date.now()}`);
        await mkdir(testDir, { recursive: true });
    });

    afterAll(async () => {
        await rm(testDir, { recursive: true, force: true });
    });

    describe('getFileHash', () => {
        test('should generate hash for content', () => {
            const content = '||example.com^';
            const hash = getFileHash(content);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash.length).toBeGreaterThan(0);
        });

        test('should generate consistent hash for same content', () => {
            const content = '||example.com^';
            const hash1 = getFileHash(content);
            const hash2 = getFileHash(content);

            expect(hash1).toBe(hash2);
        });

        test('should generate different hashes for different content', () => {
            const content1 = '||example.com^';
            const content2 = '||different.com^';

            const hash1 = getFileHash(content1);
            const hash2 = getFileHash(content2);

            expect(hash1).not.toBe(hash2);
        });

        test('should handle empty string', () => {
            const hash = getFileHash('');

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
        });

        test('should handle unicode content', () => {
            const content = '||你好世界.com^';
            const hash = getFileHash(content);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
        });

        test('should handle large content', () => {
            const content = 'a'.repeat(10000);
            const hash = getFileHash(content);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
        });
    });

    describe('LintResultCache', () => {
        let cacheDir: string;

        beforeEach(async () => {
            cacheDir = join(testDir, `cache-${Date.now()}`);
            await mkdir(cacheDir, { recursive: true });
        });

        const createMockResult = (): LinterResult => ({
            problems: [],
            errorCount: 0,
            warningCount: 0,
            fatalErrorCount: 0,
        });

        describe('create', () => {
            test('should create empty cache when file does not exist', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');

                expect(cache).toBeDefined();
                expect(cache.getData().files).toEqual({});
            });

            test('should load existing cache file', async () => {
                const cacheFilePath = join(cacheDir, '.aglintcache');
                const cacheData = {
                    linterVersion: '1.0.0',
                    cacheVersion: '1',
                    files: {
                        '/test/file.txt': {
                            meta: { mtime: 1000, size: 100 },
                            linterConfigHash: 'hash123',
                            linterResult: createMockResult(),
                        },
                    },
                };

                await writeFile(cacheFilePath, JSON.stringify(cacheData));

                const cache = await LintResultCache.create(cacheDir, '.aglintcache');

                expect(cache.getData().files).toHaveProperty('/test/file.txt');
            });

            test('should handle relative cache file path', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');

                expect(cache).toBeDefined();
            });

            test('should handle absolute cache file path', async () => {
                const absolutePath = join(cacheDir, '.aglintcache');
                const cache = await LintResultCache.create(cacheDir, absolutePath);

                expect(cache).toBeDefined();
            });

            test('should create cache in directory with trailing slash', async () => {
                const cache = await LintResultCache.create(cacheDir, '.cache/');

                expect(cache).toBeDefined();
            });

            test('should reset cache on version mismatch', async () => {
                const cacheFilePath = join(cacheDir, '.aglintcache');
                const cacheData = {
                    linterVersion: '1.0.0',
                    cacheVersion: '999', // Invalid version
                    files: {
                        '/test/file.txt': {
                            meta: { mtime: 1000, size: 100 },
                            linterConfigHash: 'hash123',
                            linterResult: createMockResult(),
                        },
                    },
                };

                await writeFile(cacheFilePath, JSON.stringify(cacheData));

                const cache = await LintResultCache.create(cacheDir, '.aglintcache');

                // Should create empty cache due to version mismatch
                expect(cache.getData().files).toEqual({});
            });

            test('should handle corrupted cache file', async () => {
                const cacheFilePath = join(cacheDir, '.aglintcache');
                await writeFile(cacheFilePath, 'invalid json {');

                const cache = await LintResultCache.create(cacheDir, '.aglintcache');

                // Should create empty cache
                expect(cache.getData().files).toEqual({});
            });

            test('should create unique cache file in directory', async () => {
                const cacheSubDir = join(cacheDir, 'cache-subdir');
                await mkdir(cacheSubDir, { recursive: true });

                const cache = await LintResultCache.create(cacheDir, cacheSubDir);

                expect(cache).toBeDefined();
            });
        });

        describe('getCachedResult', () => {
            test('should return undefined for non-existent file', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');

                const result = cache.getCachedResult(
                    '/test/file.txt',
                    1000,
                    100,
                    { syntax: [AdblockSyntax.Common], rules: {} },
                    LinterCacheStrategy.Metadata,
                );

                expect(result).toBeUndefined();
            });

            test('should return cached result with metadata strategy', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config = { syntax: [AdblockSyntax.Common], rules: {} };
                const mockResult = createMockResult();

                cache.setCachedResult('/test/file.txt', 1000, 100, config, mockResult);

                const result = cache.getCachedResult(
                    '/test/file.txt',
                    1000,
                    100,
                    config,
                    LinterCacheStrategy.Metadata,
                );

                expect(result).toBeDefined();
                expect(result?.linterResult).toEqual(mockResult);
            });

            test('should invalidate cache on mtime change with metadata strategy', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config = { syntax: [AdblockSyntax.Common], rules: {} };

                cache.setCachedResult('/test/file.txt', 1000, 100, config, createMockResult());

                const result = cache.getCachedResult(
                    '/test/file.txt',
                    2000, // Different mtime
                    100,
                    config,
                    LinterCacheStrategy.Metadata,
                );

                expect(result).toBeUndefined();
            });

            test('should invalidate cache on size change with metadata strategy', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config = { syntax: [AdblockSyntax.Common], rules: {} };

                cache.setCachedResult('/test/file.txt', 1000, 100, config, createMockResult());

                const result = cache.getCachedResult(
                    '/test/file.txt',
                    1000,
                    200, // Different size
                    config,
                    LinterCacheStrategy.Metadata,
                );

                expect(result).toBeUndefined();
            });

            test('should invalidate cache on config change', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config1 = { syntax: [AdblockSyntax.Common], rules: {} };
                const config2 = { syntax: [AdblockSyntax.Adg], rules: {} };

                cache.setCachedResult('/test/file.txt', 1000, 100, config1, createMockResult());

                const result = cache.getCachedResult(
                    '/test/file.txt',
                    1000,
                    100,
                    config2, // Different config
                    LinterCacheStrategy.Metadata,
                );

                expect(result).toBeUndefined();
            });

            test('should return cached result with content strategy', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config = { syntax: [AdblockSyntax.Common], rules: {} };
                const mockResult = createMockResult();
                const contentHash = 'hash123';

                cache.setCachedResult('/test/file.txt', 1000, 100, config, mockResult, contentHash);

                const result = cache.getCachedResult(
                    '/test/file.txt',
                    1000,
                    100,
                    config,
                    LinterCacheStrategy.Content,
                );

                expect(result).toBeDefined();
                expect(result?.contentHash).toBe(contentHash);
            });

            test('should allow mtime/size mismatch with content strategy', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config = { syntax: [AdblockSyntax.Common], rules: {} };

                cache.setCachedResult('/test/file.txt', 1000, 100, config, createMockResult(), 'hash123');

                // Content strategy doesn't check mtime/size, only config
                const result = cache.getCachedResult(
                    '/test/file.txt',
                    2000, // Different mtime
                    200, // Different size
                    config,
                    LinterCacheStrategy.Content,
                );

                expect(result).toBeDefined();
            });
        });

        describe('setCachedResult', () => {
            test('should store result in cache', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config = { syntax: [AdblockSyntax.Common], rules: {} };
                const mockResult = createMockResult();

                cache.setCachedResult('/test/file.txt', 1000, 100, config, mockResult);

                const data = cache.getData();
                expect(data.files).toHaveProperty('/test/file.txt');
                expect(data.files['/test/file.txt']?.meta.mtime).toBe(1000);
                expect(data.files['/test/file.txt']?.meta.size).toBe(100);
            });

            test('should store content hash when provided', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config = { syntax: [AdblockSyntax.Common], rules: {} };
                const contentHash = 'hash123';

                cache.setCachedResult('/test/file.txt', 1000, 100, config, createMockResult(), contentHash);

                const data = cache.getData();
                expect(data.files['/test/file.txt']?.contentHash).toBe(contentHash);
            });

            test('should overwrite existing cache entry', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config = { syntax: [AdblockSyntax.Common], rules: {} };

                cache.setCachedResult('/test/file.txt', 1000, 100, config, createMockResult());
                cache.setCachedResult('/test/file.txt', 2000, 200, config, createMockResult());

                const data = cache.getData();
                expect(data.files['/test/file.txt']?.meta.mtime).toBe(2000);
                expect(data.files['/test/file.txt']?.meta.size).toBe(200);
            });

            test('should store results for multiple files', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config = { syntax: [AdblockSyntax.Common], rules: {} };

                cache.setCachedResult('/test/file1.txt', 1000, 100, config, createMockResult());
                cache.setCachedResult('/test/file2.txt', 2000, 200, config, createMockResult());

                const data = cache.getData();
                expect(Object.keys(data.files)).toHaveLength(2);
            });

            test('should cache config hash efficiently', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config = { syntax: [AdblockSyntax.Common], rules: {} };

                // Set multiple times with same config
                cache.setCachedResult('/test/file1.txt', 1000, 100, config, createMockResult());
                cache.setCachedResult('/test/file2.txt', 2000, 200, config, createMockResult());

                const data = cache.getData();
                // Both should have the same config hash
                expect(data.files['/test/file1.txt']?.linterConfigHash).toBe(
                    data.files['/test/file2.txt']?.linterConfigHash,
                );
            });
        });

        describe('save', () => {
            test('should save cache to disk', async () => {
                const cacheFilePath = join(cacheDir, '.aglintcache');
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config = { syntax: [AdblockSyntax.Common], rules: {} };

                cache.setCachedResult('/test/file.txt', 1000, 100, config, createMockResult());

                await cache.save();

                const stats = await stat(cacheFilePath);
                expect(stats.isFile()).toBe(true);
            });

            test('should persist and reload cache', async () => {
                const cacheFilePath = '.aglintcache';
                const config = { syntax: [AdblockSyntax.Common], rules: {} };

                // Create and save cache
                const cache1 = await LintResultCache.create(cacheDir, cacheFilePath);
                cache1.setCachedResult('/test/file.txt', 1000, 100, config, createMockResult());
                await cache1.save();

                // Load cache again
                const cache2 = await LintResultCache.create(cacheDir, cacheFilePath);
                const result = cache2.getCachedResult(
                    '/test/file.txt',
                    1000,
                    100,
                    config,
                    LinterCacheStrategy.Metadata,
                );

                expect(result).toBeDefined();
            });
        });

        describe('getData', () => {
            test('should return cache data', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');

                const data = cache.getData();

                expect(data).toHaveProperty('linterVersion');
                expect(data).toHaveProperty('cacheVersion');
                expect(data).toHaveProperty('files');
            });

            test('should return data with correct version', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');

                const data = cache.getData();

                expect(data.cacheVersion).toBe('1');
            });
        });

        describe('integration', () => {
            test('should handle complete workflow', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config = { syntax: [AdblockSyntax.Common], rules: { 'rule-1': LinterRuleSeverity.Error } };
                const mockResult = createMockResult();

                // Set result
                cache.setCachedResult('/test/file.txt', 1000, 100, config, mockResult);

                // Get result
                const result = cache.getCachedResult(
                    '/test/file.txt',
                    1000,
                    100,
                    config,
                    LinterCacheStrategy.Metadata,
                );

                expect(result).toBeDefined();

                // Save
                await cache.save();

                // Reload
                const cache2 = await LintResultCache.create(cacheDir, '.aglintcache');
                const result2 = cache2.getCachedResult(
                    '/test/file.txt',
                    1000,
                    100,
                    config,
                    LinterCacheStrategy.Metadata,
                );

                expect(result2).toBeDefined();
                // After reload, schema validation may strip optional fields
                // Just verify the core fields are preserved
                expect(result2?.linterResult.problems).toEqual(mockResult.problems);
                expect(result2?.linterResult.errorCount).toBe(mockResult.errorCount);
                expect(result2?.linterResult.warningCount).toBe(mockResult.warningCount);
                expect(result2?.linterResult.fatalErrorCount).toBe(mockResult.fatalErrorCount);
            });

            test('should work with both cache strategies', async () => {
                const cache = await LintResultCache.create(cacheDir, '.aglintcache');
                const config = { syntax: [AdblockSyntax.Common], rules: {} };
                const contentHash = getFileHash('||example.com^');

                cache.setCachedResult('/test/file.txt', 1000, 100, config, createMockResult(), contentHash);

                // Metadata strategy
                const result1 = cache.getCachedResult(
                    '/test/file.txt',
                    1000,
                    100,
                    config,
                    LinterCacheStrategy.Metadata,
                );
                expect(result1).toBeDefined();

                // Content strategy
                const result2 = cache.getCachedResult(
                    '/test/file.txt',
                    2000, // Different mtime, should still work with content strategy
                    100,
                    config,
                    LinterCacheStrategy.Content,
                );
                expect(result2).toBeDefined();
            });
        });
    });
});
