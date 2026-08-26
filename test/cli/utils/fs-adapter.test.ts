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

import { NodeFileSystemAdapter } from '../../../src/cli/utils/fs-adapter';

describe('NodeFileSystemAdapter', () => {
    let testDir: string;
    let adapter: NodeFileSystemAdapter;

    beforeAll(async () => {
        // Create a temporary test directory
        testDir = join(tmpdir(), `aglint-fs-adapter-test-${Date.now()}`);
        await mkdir(testDir, { recursive: true });

        // Create test file structure
        await writeFile(join(testDir, 'test.txt'), 'Hello, World!');
        await writeFile(join(testDir, 'data.json'), '{"key":"value"}');
        await writeFile(join(testDir, '.hidden'), 'hidden content');
        await writeFile(join(testDir, 'empty.txt'), '');

        // Create subdirectories
        await mkdir(join(testDir, 'subdir'), { recursive: true });
        await writeFile(join(testDir, 'subdir', 'nested.txt'), 'nested file');
        await writeFile(join(testDir, 'subdir', 'file1.js'), 'console.log(1);');
        await writeFile(join(testDir, 'subdir', 'file2.js'), 'console.log(2);');

        await mkdir(join(testDir, 'another'), { recursive: true });
        await writeFile(join(testDir, 'another', 'test.txt'), 'another test');

        // Create test files for pattern matching
        await writeFile(join(testDir, 'file1.ts'), 'typescript 1');
        await writeFile(join(testDir, 'file2.ts'), 'typescript 2');
        await writeFile(join(testDir, 'file3.js'), 'javascript 3');

        adapter = new NodeFileSystemAdapter();
    });

    afterAll(async () => {
        // Clean up test directory
        await rm(testDir, { recursive: true, force: true });
    });

    describe('readFile', () => {
        test('should read existing file content', async () => {
            const content = await adapter.readFile(join(testDir, 'test.txt'));
            expect(content).toBe('Hello, World!');
        });

        test('should read JSON file content', async () => {
            const content = await adapter.readFile(join(testDir, 'data.json'));
            expect(content).toBe('{"key":"value"}');
        });

        test('should read empty file', async () => {
            const content = await adapter.readFile(join(testDir, 'empty.txt'));
            expect(content).toBe('');
        });

        test('should read hidden file', async () => {
            const content = await adapter.readFile(join(testDir, '.hidden'));
            expect(content).toBe('hidden content');
        });

        test('should read nested file', async () => {
            const content = await adapter.readFile(join(testDir, 'subdir', 'nested.txt'));
            expect(content).toBe('nested file');
        });

        test('should throw error for non-existent file', async () => {
            await expect(
                adapter.readFile(join(testDir, 'nonexistent.txt')),
            ).rejects.toThrow();
        });

        test('should throw error when reading directory as file', async () => {
            await expect(
                adapter.readFile(join(testDir, 'subdir')),
            ).rejects.toThrow();
        });

        test('should handle special characters in filename', async () => {
            const specialFile = join(testDir, 'special (file).txt');
            await writeFile(specialFile, 'special content');
            const content = await adapter.readFile(specialFile);
            expect(content).toBe('special content');
        });
    });

    describe('stat', () => {
        test('should get stats for existing file', async () => {
            const stats = await adapter.stat(join(testDir, 'test.txt'));

            expect(stats.isFile).toBe(true);
            expect(stats.isDirectory).toBe(false);
            expect(stats.size).toBeGreaterThan(0);
            expect(stats.mtime).toBeGreaterThan(0);
        });

        test('should get stats for directory', async () => {
            const stats = await adapter.stat(join(testDir, 'subdir'));

            expect(stats.isFile).toBe(false);
            expect(stats.isDirectory).toBe(true);
            expect(stats.mtime).toBeGreaterThan(0);
        });

        test('should get correct file size', async () => {
            const stats = await adapter.stat(join(testDir, 'test.txt'));
            // "Hello, World!" is 13 bytes
            expect(stats.size).toBe(13);
        });

        test('should get size 0 for empty file', async () => {
            const stats = await adapter.stat(join(testDir, 'empty.txt'));
            expect(stats.size).toBe(0);
        });

        test('should get stats for hidden file', async () => {
            const stats = await adapter.stat(join(testDir, '.hidden'));

            expect(stats.isFile).toBe(true);
            expect(stats.size).toBeGreaterThan(0);
        });

        test('should throw error for non-existent path', async () => {
            await expect(
                adapter.stat(join(testDir, 'nonexistent.txt')),
            ).rejects.toThrow();
        });

        test('should have valid modification time', async () => {
            const stats = await adapter.stat(join(testDir, 'test.txt'));
            const now = Date.now();

            // File should have been created within the last minute
            expect(stats.mtime).toBeLessThanOrEqual(now);
            expect(stats.mtime).toBeGreaterThan(now - 60000);
        });
    });

    describe('exists', () => {
        test('should return true for existing file', async () => {
            const exists = await adapter.exists(join(testDir, 'test.txt'));
            expect(exists).toBe(true);
        });

        test('should return true for existing directory', async () => {
            const exists = await adapter.exists(join(testDir, 'subdir'));
            expect(exists).toBe(true);
        });

        test('should return false for non-existent file', async () => {
            const exists = await adapter.exists(join(testDir, 'nonexistent.txt'));
            expect(exists).toBe(false);
        });

        test('should return false for non-existent directory', async () => {
            const exists = await adapter.exists(join(testDir, 'nonexistent-dir'));
            expect(exists).toBe(false);
        });

        test('should return true for hidden file', async () => {
            const exists = await adapter.exists(join(testDir, '.hidden'));
            expect(exists).toBe(true);
        });

        test('should return true for empty file', async () => {
            const exists = await adapter.exists(join(testDir, 'empty.txt'));
            expect(exists).toBe(true);
        });

        test('should return true for nested file', async () => {
            const exists = await adapter.exists(join(testDir, 'subdir', 'nested.txt'));
            expect(exists).toBe(true);
        });

        test('should handle path with special characters', async () => {
            const specialFile = join(testDir, 'special (file).txt');
            const exists = await adapter.exists(specialFile);
            expect(exists).toBe(true);
        });
    });

    describe('glob', () => {
        test('should match all files with wildcard', async () => {
            const files = await adapter.glob(['*'], { cwd: testDir });

            expect(files.length).toBeGreaterThan(0);
            expect(files.some((f) => f.includes('test.txt'))).toBe(true);
            expect(files.some((f) => f.includes('data.json'))).toBe(true);
        });

        test('should match files by extension', async () => {
            const files = await adapter.glob(['*.txt'], { cwd: testDir });

            expect(files.length).toBeGreaterThan(0);
            expect(files.every((f) => f.endsWith('.txt'))).toBe(true);
        });

        test('should match TypeScript files', async () => {
            const files = await adapter.glob(['*.ts'], { cwd: testDir });

            expect(files.length).toBe(2);
            expect(files.some((f) => f.includes('file1.ts'))).toBe(true);
            expect(files.some((f) => f.includes('file2.ts'))).toBe(true);
        });

        test('should match JavaScript files', async () => {
            const files = await adapter.glob(['*.js'], { cwd: testDir });

            expect(files.length).toBeGreaterThan(0);
            expect(files.every((f) => f.endsWith('.js'))).toBe(true);
        });

        test('should match nested files with glob pattern', async () => {
            const files = await adapter.glob(['**/*.txt'], { cwd: testDir });

            expect(files.length).toBeGreaterThan(0);
            expect(files.some((f) => f.includes('nested.txt'))).toBe(true);
        });

        test('should match multiple patterns', async () => {
            const files = await adapter.glob(['*.ts', '*.js'], { cwd: testDir });

            expect(files.length).toBeGreaterThan(0);
            expect(files.some((f) => f.endsWith('.ts'))).toBe(true);
            expect(files.some((f) => f.endsWith('.js'))).toBe(true);
        });

        test('should exclude dotfiles by default', async () => {
            const files = await adapter.glob(['*'], { cwd: testDir });

            expect(files.some((f) => f.includes('.hidden'))).toBe(false);
        });

        test('should include dotfiles when dot option is true', async () => {
            const files = await adapter.glob(['*'], { cwd: testDir, dot: true });

            expect(files.some((f) => f.includes('.hidden'))).toBe(true);
        });

        test('should return absolute paths by default', async () => {
            const files = await adapter.glob(['*.txt'], { cwd: testDir });

            expect(files.length).toBeGreaterThan(0);
            files.forEach((file) => {
                expect(file).toMatch(/^[/\\]/);
            });
        });

        test('should support ignore patterns', async () => {
            const files = await adapter.glob(['*.txt'], {
                cwd: testDir,
                ignore: ['**/empty.txt'],
            });

            expect(files.some((f) => f.includes('empty.txt'))).toBe(false);
            expect(files.some((f) => f.includes('test.txt'))).toBe(true);
        });

        test('should match files in specific subdirectory', async () => {
            const files = await adapter.glob(['subdir/*.js'], { cwd: testDir });

            expect(files.length).toBe(2);
            expect(files.every((f) => f.includes('subdir'))).toBe(true);
        });

        test('should return empty array for non-matching pattern', async () => {
            const files = await adapter.glob(['*.xyz'], { cwd: testDir });

            expect(files).toEqual([]);
        });

        test('should handle complex glob patterns', async () => {
            const files = await adapter.glob(['**/file[12].js'], { cwd: testDir });

            expect(files.length).toBe(2);
            expect(files.some((f) => f.includes('file1.js'))).toBe(true);
            expect(files.some((f) => f.includes('file2.js'))).toBe(true);
        });

        test('should only return files by default (onlyFiles option)', async () => {
            const files = await adapter.glob(['**/*'], { cwd: testDir });

            // Should not include directories
            expect(files.every((f) => !f.endsWith('subdir'))).toBe(true);
        });

        test('should handle empty pattern array', async () => {
            const files = await adapter.glob([], { cwd: testDir });

            expect(files).toEqual([]);
        });

        test('should work with negation patterns', async () => {
            const files = await adapter.glob(['*.txt', '!empty.txt'], { cwd: testDir });

            expect(files.some((f) => f.includes('empty.txt'))).toBe(false);
            expect(files.some((f) => f.includes('test.txt'))).toBe(true);
        });

        test('should return unique files (no duplicates)', async () => {
            const files = await adapter.glob(['*.txt', 'test.txt'], { cwd: testDir });

            const testFiles = files.filter((f) => f.includes('test.txt'));
            expect(testFiles.length).toBe(1);
        });
    });

    describe('edge cases and integration', () => {
        test('should handle operations on the same file', async () => {
            const testFile = join(testDir, 'test.txt');

            const exists = await adapter.exists(testFile);
            const content = await adapter.readFile(testFile);
            const stats = await adapter.stat(testFile);

            expect(exists).toBe(true);
            expect(content).toBe('Hello, World!');
            expect(stats.isFile).toBe(true);
            expect(stats.size).toBe(content.length);
        });

        test('should handle rapid sequential operations', async () => {
            const promises = [];
            for (let i = 0; i < 10; i += 1) {
                promises.push(adapter.exists(join(testDir, 'test.txt')));
            }

            const results = await Promise.all(promises);
            expect(results.every((r) => r === true)).toBe(true);
        });

        test('should handle operations on multiple files', async () => {
            const files = [
                join(testDir, 'test.txt'),
                join(testDir, 'data.json'),
                join(testDir, 'empty.txt'),
            ];

            const contents = await Promise.all(
                files.map((f) => adapter.readFile(f)),
            );

            expect(contents).toHaveLength(3);
            expect(contents[0]).toBe('Hello, World!');
            expect(contents[1]).toBe('{"key":"value"}');
            expect(contents[2]).toBe('');
        });

        test('should handle glob with multiple ignore patterns', async () => {
            const files = await adapter.glob(['**/*.txt'], {
                cwd: testDir,
                ignore: ['**/empty.txt', '**/nested.txt'],
            });

            expect(files.some((f) => f.includes('empty.txt'))).toBe(false);
            expect(files.some((f) => f.includes('nested.txt'))).toBe(false);
            expect(files.some((f) => f.includes('test.txt'))).toBe(true);
        });

        test('should work with deeply nested paths', async () => {
            const deepPath = join(testDir, 'subdir', 'nested.txt');

            const exists = await adapter.exists(deepPath);
            const content = await adapter.readFile(deepPath);
            const stats = await adapter.stat(deepPath);

            expect(exists).toBe(true);
            expect(content).toBe('nested file');
            expect(stats.isFile).toBe(true);
        });
    });
});
