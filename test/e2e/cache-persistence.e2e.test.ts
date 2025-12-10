/**
 * E2E tests for cache persistence.
 *
 * These tests verify that cache works correctly end-to-end without modifying files.
 * Tests use real file system but clean up after themselves.
 */

import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
} from 'vitest';

import { LintResultCache } from '../../src/cli/cache';

describe('Cache Persistence E2E', () => {
    let testDir: string;

    beforeEach(async () => {
        testDir = join(tmpdir(), `aglint-cache-e2e-${Date.now()}`);
        await mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true });
    });

    test('should persist cache to disk and reload with metadata strategy', async () => {
        // Create cache and add data
        const cache1 = await LintResultCache.create(testDir, '.aglintcache');

        cache1.setCachedResult(
            '/project/file1.txt',
            1000,
            100,
            { platforms: [], rules: {} },
            {
                problems: [],
                warningCount: 0,
                errorCount: 0,
                fatalErrorCount: 0,
            },
        );

        cache1.setCachedResult(
            '/project/file2.txt',
            2000,
            200,
            { platforms: [], rules: {} },
            {
                problems: [],
                warningCount: 1,
                errorCount: 0,
                fatalErrorCount: 0,
            },
        );

        // Save to disk
        await cache1.save();

        // Reload from disk
        const cache2 = await LintResultCache.create(testDir, '.aglintcache');
        const data = cache2.getData();

        // Verify data was persisted
        expect(data.files['/project/file1.txt']).toBeDefined();
        expect(data.files['/project/file1.txt']?.meta.mtime).toBe(1000);
        expect(data.files['/project/file1.txt']?.meta.size).toBe(100);

        expect(data.files['/project/file2.txt']).toBeDefined();
        expect(data.files['/project/file2.txt']?.meta.mtime).toBe(2000);
        expect(data.files['/project/file2.txt']?.linterResult.warningCount).toBe(1);
    });

    test('should persist cache with content hashes', async () => {
        const cache1 = await LintResultCache.create(testDir, '.aglintcache');

        cache1.setCachedResult(
            '/project/file.txt',
            1000,
            100,
            { platforms: [], rules: {} },
            {
                problems: [],
                warningCount: 0,
                errorCount: 0,
                fatalErrorCount: 0,
            },
            'hash123', // Content hash
        );

        await cache1.save();

        // Reload
        const cache2 = await LintResultCache.create(testDir, '.aglintcache');
        const data = cache2.getData();

        expect(data.files['/project/file.txt']?.contentHash).toBe('hash123');
    });

    test('should handle multiple save/load cycles', async () => {
        // Cycle 1
        const cache1 = await LintResultCache.create(testDir, '.aglintcache');
        cache1.setCachedResult(
            '/project/file1.txt',
            1000,
            100,
            { platforms: [], rules: {} },
            {
                problems: [], warningCount: 0, errorCount: 0, fatalErrorCount: 0,
            },
        );
        await cache1.save();

        // Cycle 2 - Add more data
        const cache2 = await LintResultCache.create(testDir, '.aglintcache');
        cache2.setCachedResult(
            '/project/file2.txt',
            2000,
            200,
            { platforms: [], rules: {} },
            {
                problems: [], warningCount: 0, errorCount: 0, fatalErrorCount: 0,
            },
        );
        await cache2.save();

        // Cycle 3 - Verify both files
        const cache3 = await LintResultCache.create(testDir, '.aglintcache');
        const data = cache3.getData();

        expect(Object.keys(data.files)).toHaveLength(2);
        expect(data.files['/project/file1.txt']).toBeDefined();
        expect(data.files['/project/file2.txt']).toBeDefined();
    });

    test('should validate cached data with metadata strategy', async () => {
        const cache = await LintResultCache.create(testDir, '.aglintcache');

        cache.setCachedResult(
            '/project/file.txt',
            1000,
            100,
            { platforms: [], rules: {} },
            {
                problems: [], warningCount: 0, errorCount: 0, fatalErrorCount: 0,
            },
        );

        // Retrieve with same metadata
        const validResult = cache.getCacheData('/project/file.txt', { platforms: [], rules: {} });
        expect(validResult).toBeDefined();

        // Invalid with different config
        const invalidResult = cache.getCacheData('/project/file.txt', { platforms: ['windows'], rules: {} });
        expect(invalidResult).toBeUndefined();
    });

    test('should not write to original files', async () => {
        const cache = await LintResultCache.create(testDir, '.aglintcache');

        // Add cache entry for a file
        cache.setCachedResult(
            '/project/original.txt',
            1000,
            100,
            { platforms: [], rules: {} },
            {
                problems: [], warningCount: 0, errorCount: 0, fatalErrorCount: 0,
            },
        );

        await cache.save();

        // Verify only cache file exists in test directory
        const fs = await import('node:fs/promises');
        const files = await fs.readdir(testDir);

        expect(files).toEqual(['.aglintcache']);
        // Original file path (/project/original.txt) should not be created
    });

    test('should handle large cache files', async () => {
        const cache = await LintResultCache.create(testDir, '.aglintcache');

        // Add many cache entries
        for (let i = 0; i < 100; i += 1) {
            cache.setCachedResult(
                `/project/file${i}.txt`,
                1000 + i,
                100 + i,
                { platforms: [], rules: {} },
                {
                    problems: [], warningCount: i % 2, errorCount: 0, fatalErrorCount: 0,
                },
            );
        }

        await cache.save();

        // Reload and verify
        const cache2 = await LintResultCache.create(testDir, '.aglintcache');
        const data = cache2.getData();

        expect(Object.keys(data.files)).toHaveLength(100);
        expect(data.files['/project/file99.txt']?.meta.mtime).toBe(1099);
    });
});
