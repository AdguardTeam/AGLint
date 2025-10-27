/* eslint-disable no-await-in-loop */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
    afterAll,
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import { fileExists } from '../../../src/cli/utils/file-exists';

describe('fileExists', () => {
    const testDir = join(tmpdir(), 'aglint-file-exists-test');
    const testFile = join(testDir, 'test-file.txt');
    const testSubDir = join(testDir, 'subdir');
    const testFileInSubDir = join(testSubDir, 'nested-file.txt');
    const nonExistentFile = join(testDir, 'non-existent-file.txt');
    const nonExistentDir = join(testDir, 'non-existent-dir');

    beforeAll(async () => {
        // Create test directory structure
        await mkdir(testDir, { recursive: true });
        await mkdir(testSubDir, { recursive: true });

        // Create test files
        await writeFile(testFile, 'test content');
        await writeFile(testFileInSubDir, 'nested test content');
    });

    afterAll(async () => {
        // Clean up test directory
        await rm(testDir, { recursive: true, force: true });
    });

    describe('existing files', () => {
        test('should return true for existing file', async () => {
            const result = await fileExists(testFile);
            expect(result).toBe(true);
        });

        test('should return true for existing file in subdirectory', async () => {
            const result = await fileExists(testFileInSubDir);
            expect(result).toBe(true);
        });

        test('should return true for existing directory', async () => {
            const result = await fileExists(testDir);
            expect(result).toBe(true);
        });

        test('should return true for existing subdirectory', async () => {
            const result = await fileExists(testSubDir);
            expect(result).toBe(true);
        });
    });

    describe('non-existent files', () => {
        test('should return false for non-existent file', async () => {
            const result = await fileExists(nonExistentFile);
            expect(result).toBe(false);
        });

        test('should return false for non-existent directory', async () => {
            const result = await fileExists(nonExistentDir);
            expect(result).toBe(false);
        });

        test('should return false for file in non-existent directory', async () => {
            const result = await fileExists(join(nonExistentDir, 'file.txt'));
            expect(result).toBe(false);
        });
    });

    describe('edge cases', () => {
        test('should handle empty string path', async () => {
            const result = await fileExists('');
            expect(result).toBe(false);
        });

        test('should handle relative paths', async () => {
            // Test with package.json which should exist in project root
            const result = await fileExists('./package.json');
            expect(result).toBe(true);
        });

        test('should handle paths with special characters', async () => {
            const specialFile = join(testDir, 'file with spaces & symbols!@#.txt');
            await writeFile(specialFile, 'special content');

            const result = await fileExists(specialFile);
            expect(result).toBe(true);
        });

        test('should handle unicode file names', async () => {
            const unicodeFile = join(testDir, 'файл-тест-🚀.txt');
            await writeFile(unicodeFile, 'unicode content');

            const result = await fileExists(unicodeFile);
            expect(result).toBe(true);
        });

        test('should handle very long paths', async () => {
            const longDirName = 'a'.repeat(50);
            const longDir = join(testDir, longDirName);
            const longFile = join(longDir, 'file.txt');

            await mkdir(longDir, { recursive: true });
            await writeFile(longFile, 'long path content');

            const result = await fileExists(longFile);
            expect(result).toBe(true);
        });
    });

    describe('different file types', () => {
        test('should work with different file extensions', async () => {
            const extensions = ['.js', '.ts', '.json', '.md', '.txt', '.log'];

            for (const ext of extensions) {
                const file = join(testDir, `test${ext}`);
                await writeFile(file, `content for ${ext}`);

                const result = await fileExists(file);
                expect(result).toBe(true);
            }
        });

        test('should work with files without extensions', async () => {
            const noExtFile = join(testDir, 'no-extension-file');
            await writeFile(noExtFile, 'no extension content');

            const result = await fileExists(noExtFile);
            expect(result).toBe(true);
        });

        test('should work with hidden files', async () => {
            const hiddenFile = join(testDir, '.hidden-file');
            await writeFile(hiddenFile, 'hidden content');

            const result = await fileExists(hiddenFile);
            expect(result).toBe(true);
        });
    });

    describe('path variations', () => {
        test('should handle absolute paths', async () => {
            const result = await fileExists(testFile);
            expect(result).toBe(true);
        });

        test('should handle paths with . and .. components', async () => {
            const dotPath = join(testDir, '.', 'test-file.txt');
            const result = await fileExists(dotPath);
            expect(result).toBe(true);
        });
    });

    describe('performance', () => {
        test('should complete quickly for existing files', async () => {
            const start = Date.now();
            await fileExists(testFile);
            const duration = Date.now() - start;

            // Should complete within reasonable time (100ms is generous)
            expect(duration).toBeLessThan(100);
        });

        test('should complete quickly for non-existent files', async () => {
            const start = Date.now();
            await fileExists(nonExistentFile);
            const duration = Date.now() - start;

            // Should complete within reasonable time
            expect(duration).toBeLessThan(100);
        });

        test('should handle multiple concurrent calls', async () => {
            const promises = Array.from({ length: 10 }, (_, i) => fileExists(i % 2 === 0 ? testFile : nonExistentFile));

            const results = await Promise.all(promises);

            // Should get alternating true/false results
            expect(results).toHaveLength(10);
            results.forEach((result, i) => {
                expect(result).toBe(i % 2 === 0);
            });
        });
    });
});
