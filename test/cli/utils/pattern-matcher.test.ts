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
import { NodePathAdapter } from '../../../src/cli/utils/path-adapter';
import { DEFAULT_IGNORE_PATTERNS, matchPatterns, NoFilesForPattern } from '../../../src/cli/utils/pattern-matcher';

describe('pattern-matcher', () => {
    let testDir: string;
    let fs: NodeFileSystemAdapter;
    let pathAdapter: NodePathAdapter;

    beforeAll(async () => {
        // Create a temporary test directory
        testDir = join(tmpdir(), `aglint-pattern-matcher-test-${Date.now()}`);
        await mkdir(testDir, { recursive: true });

        // Create comprehensive test file structure
        await writeFile(join(testDir, 'file1.txt'), 'content 1');
        await writeFile(join(testDir, 'file2.txt'), 'content 2');
        await writeFile(join(testDir, 'script.js'), 'console.log();');
        await writeFile(join(testDir, 'data.json'), '{}');
        await writeFile(join(testDir, '.hidden'), 'hidden');

        // Create subdirectories with files
        await mkdir(join(testDir, 'src'), { recursive: true });
        await writeFile(join(testDir, 'src', 'index.ts'), 'typescript');
        await writeFile(join(testDir, 'src', 'utils.ts'), 'utils');
        await writeFile(join(testDir, 'src', 'test.js'), 'test');

        await mkdir(join(testDir, 'docs'), { recursive: true });
        await writeFile(join(testDir, 'docs', 'readme.md'), 'readme');
        await writeFile(join(testDir, 'docs', 'guide.md'), 'guide');

        await mkdir(join(testDir, 'node_modules'), { recursive: true });
        await writeFile(join(testDir, 'node_modules', 'package.json'), '{}');

        await mkdir(join(testDir, 'nested', 'deep', 'path'), { recursive: true });
        await writeFile(join(testDir, 'nested', 'file.txt'), 'nested');
        await writeFile(join(testDir, 'nested', 'deep', 'file.txt'), 'deep');
        await writeFile(join(testDir, 'nested', 'deep', 'path', 'file.txt'), 'path');

        fs = new NodeFileSystemAdapter();
        pathAdapter = new NodePathAdapter();
    });

    afterAll(async () => {
        // Clean up test directory
        await rm(testDir, { recursive: true, force: true });
    });

    describe('DEFAULT_IGNORE_PATTERNS', () => {
        test('should export default ignore patterns', () => {
            expect(DEFAULT_IGNORE_PATTERNS).toBeDefined();
            expect(Array.isArray(DEFAULT_IGNORE_PATTERNS)).toBe(true);
            expect(DEFAULT_IGNORE_PATTERNS.length).toBeGreaterThan(0);
        });

        test('should include common ignore patterns', () => {
            expect(DEFAULT_IGNORE_PATTERNS).toContain('**/node_modules/**');
            expect(DEFAULT_IGNORE_PATTERNS).toContain('**/.git/**');
            expect(DEFAULT_IGNORE_PATTERNS).toContain('**/.DS_Store');
        });
    });

    describe('NoFilesForPattern error', () => {
        test('should create error with pattern', () => {
            const error = new NoFilesForPattern('*.xyz');

            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('NoFilesForPattern');
            expect(error.pattern).toBe('*.xyz');
            expect(error.message).toBe('No files matched pattern: "*.xyz"');
        });
    });

    describe('matchPatterns - file patterns', () => {
        test('should match single file by absolute path', async () => {
            const filePath = join(testDir, 'file1.txt');
            const result = await matchPatterns(
                [filePath],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files).toHaveLength(1);
            expect(result.files[0]).toContain('file1.txt');
            expect(result.patternMap.size).toBe(1);
            expect(result.patternMap.get(filePath)).toHaveLength(1);
        });

        test('should match single file by relative path', async () => {
            const result = await matchPatterns(
                ['file1.txt'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files).toHaveLength(1);
            expect(result.files[0]).toContain('file1.txt');
            expect(result.patternMap.get('file1.txt')).toHaveLength(1);
        });

        test('should match multiple files', async () => {
            const result = await matchPatterns(
                ['file1.txt', 'file2.txt'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files).toHaveLength(2);
            expect(result.files.some((f) => f.includes('file1.txt'))).toBe(true);
            expect(result.files.some((f) => f.includes('file2.txt'))).toBe(true);
        });

        test('should throw error for non-existent file', async () => {
            await expect(
                matchPatterns(['nonexistent.txt'], fs, pathAdapter, { cwd: testDir }),
            ).rejects.toThrow(NoFilesForPattern);
        });

        test('should throw error with correct pattern name', async () => {
            try {
                await matchPatterns(['missing.txt'], fs, pathAdapter, { cwd: testDir });
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(NoFilesForPattern);
                expect((error as NoFilesForPattern).pattern).toBe('missing.txt');
            }
        });
    });

    describe('matchPatterns - directory patterns', () => {
        test('should expand directory to all files', async () => {
            const result = await matchPatterns(
                ['src'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files.length).toBeGreaterThan(0);
            expect(result.files.every((f) => f.includes('/src/'))).toBe(true);
            expect(result.patternMap.get('src')?.length).toBeGreaterThan(0);
        });

        test('should match files in nested directory', async () => {
            const result = await matchPatterns(
                ['nested/deep'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files.length).toBeGreaterThan(0);
            expect(result.files.every((f) => f.includes('/nested/deep/'))).toBe(true);
        });

        test('should exclude node_modules by default', async () => {
            const result = await matchPatterns(
                ['.'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files.some((f) => f.includes('node_modules'))).toBe(false);
        });

        test('should throw error for non-existent directory', async () => {
            await expect(
                matchPatterns(['nonexistent-dir'], fs, pathAdapter, { cwd: testDir }),
            ).rejects.toThrow(NoFilesForPattern);
        });
    });

    describe('matchPatterns - glob patterns', () => {
        test('should match files with wildcard', async () => {
            const result = await matchPatterns(
                ['*.txt'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files.length).toBeGreaterThan(0);
            expect(result.files.every((f) => f.endsWith('.txt'))).toBe(true);
        });

        test('should match TypeScript files', async () => {
            const result = await matchPatterns(
                ['**/*.ts'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files.length).toBeGreaterThan(0);
            expect(result.files.every((f) => f.endsWith('.ts'))).toBe(true);
            expect(result.files.some((f) => f.includes('src/index.ts'))).toBe(true);
        });

        test('should match Markdown files', async () => {
            const result = await matchPatterns(
                ['**/*.md'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files.length).toBeGreaterThan(0);
            expect(result.files.every((f) => f.endsWith('.md'))).toBe(true);
        });

        test('should match files in specific subdirectory', async () => {
            const result = await matchPatterns(
                ['src/*.ts'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files.length).toBeGreaterThan(0);
            expect(result.files.every((f) => f.includes('/src/') && f.endsWith('.ts'))).toBe(true);
        });

        test('should match with multiple glob patterns', async () => {
            const result = await matchPatterns(
                ['*.txt', '*.js'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files.length).toBeGreaterThan(0);
            expect(result.files.some((f) => f.endsWith('.txt'))).toBe(true);
            expect(result.files.some((f) => f.endsWith('.js'))).toBe(true);
        });

        test('should throw error for glob with no matches', async () => {
            await expect(
                matchPatterns(['*.xyz'], fs, pathAdapter, { cwd: testDir }),
            ).rejects.toThrow(NoFilesForPattern);
        });

        test('should handle complex glob patterns', async () => {
            const result = await matchPatterns(
                ['**/nested/**/*.txt'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files.length).toBeGreaterThan(0);
            expect(result.files.every((f) => f.includes('/nested/') && f.endsWith('.txt'))).toBe(true);
        });
    });

    describe('matchPatterns - mixed patterns', () => {
        test('should handle mix of files and glob patterns', async () => {
            const result = await matchPatterns(
                ['file1.txt', '*.js', '**/*.ts'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files.length).toBeGreaterThan(0);
            expect(result.patternMap.size).toBe(3);
            expect(result.patternMap.get('file1.txt')?.length).toBe(1);
            expect(result.patternMap.get('*.js')?.length).toBeGreaterThan(0);
            expect(result.patternMap.get('**/*.ts')?.length).toBeGreaterThan(0);
        });

        test('should return unique files from fast-glob', async () => {
            const result = await matchPatterns(
                ['**/*.txt', '**/*.js'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            // fast-glob should return unique files
            const uniqueFiles = new Set(result.files);
            expect(result.files.length).toBe(uniqueFiles.size);
            expect(result.files.length).toBeGreaterThan(0);
        });
    });

    describe('matchPatterns - options', () => {
        test('should respect dot option for hidden files', async () => {
            const resultWithDot = await matchPatterns(
                ['*'],
                fs,
                pathAdapter,
                { cwd: testDir, dot: true },
            );

            const resultWithoutDot = await matchPatterns(
                ['*'],
                fs,
                pathAdapter,
                { cwd: testDir, dot: false },
            );

            expect(resultWithDot.files.some((f) => f.includes('.hidden'))).toBe(true);
            expect(resultWithoutDot.files.some((f) => f.includes('.hidden'))).toBe(false);
        });

        test('should support custom ignore patterns', async () => {
            const result = await matchPatterns(
                ['**/*.txt'],
                fs,
                pathAdapter,
                {
                    cwd: testDir,
                    defaultIgnorePatterns: ['**/nested/**'],
                },
            );

            expect(result.files.some((f) => f.includes('/nested/'))).toBe(false);
            expect(result.files.some((f) => !f.includes('/nested/') && f.endsWith('.txt'))).toBe(true);
        });

        test('should support empty ignore patterns', async () => {
            const result = await matchPatterns(
                ['**/*'],
                fs,
                pathAdapter,
                {
                    cwd: testDir,
                    defaultIgnorePatterns: [],
                },
            );

            // Should include node_modules since we disabled default ignores
            expect(result.files.some((f) => f.includes('node_modules'))).toBe(true);
        });
    });

    describe('matchPatterns - pattern map', () => {
        test('should map each pattern to its matched files', async () => {
            const result = await matchPatterns(
                ['file1.txt', '*.json', '**/*.ts'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.patternMap.size).toBe(3);

            const file1Matches = result.patternMap.get('file1.txt');
            expect(file1Matches).toBeDefined();
            expect(file1Matches?.length).toBe(1);
            expect(file1Matches?.[0]).toContain('file1.txt');

            const jsonMatches = result.patternMap.get('*.json');
            expect(jsonMatches).toBeDefined();
            expect(jsonMatches?.every((f) => f.endsWith('.json'))).toBe(true);

            const tsMatches = result.patternMap.get('**/*.ts');
            expect(tsMatches).toBeDefined();
            expect(tsMatches?.every((f) => f.endsWith('.ts'))).toBe(true);
        });

        test('should track which pattern matched which file', async () => {
            const result = await matchPatterns(
                ['**/*.ts', 'src'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            const tsMatches = result.patternMap.get('**/*.ts')!;
            const srcMatches = result.patternMap.get('src')!;

            // Both should match TypeScript files in src
            expect(tsMatches.some((f) => f.includes('/src/') && f.endsWith('.ts'))).toBe(true);
            expect(srcMatches.some((f) => f.includes('/src/') && f.endsWith('.ts'))).toBe(true);
        });
    });

    describe('matchPatterns - edge cases', () => {
        test('should handle empty pattern array', async () => {
            const result = await matchPatterns(
                [],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files).toHaveLength(0);
            expect(result.patternMap.size).toBe(0);
        });

        test('should handle current directory pattern', async () => {
            const result = await matchPatterns(
                ['.'],
                fs,
                pathAdapter,
                { cwd: join(testDir, 'nested') },
            );

            expect(result.files.length).toBeGreaterThan(0);
            expect(result.files.every((f) => f.includes('/nested/'))).toBe(true);
        });

        test('should handle deeply nested paths', async () => {
            const result = await matchPatterns(
                ['nested/deep/path/file.txt'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files).toHaveLength(1);
            expect(result.files[0]).toContain('nested/deep/path/file.txt');
        });

        test('should normalize paths consistently', async () => {
            const result1 = await matchPatterns(
                ['./file1.txt'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            const result2 = await matchPatterns(
                ['file1.txt'],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result1.files[0]).toBe(result2.files[0]);
        });

        test('should handle absolute paths correctly', async () => {
            const absPath = join(testDir, 'file1.txt');
            const result = await matchPatterns(
                [absPath],
                fs,
                pathAdapter,
                { cwd: testDir },
            );

            expect(result.files).toHaveLength(1);
            expect(result.files[0]).toContain('file1.txt');
        });
    });

    describe('matchPatterns - error scenarios', () => {
        test('should throw for pattern matching empty directory', async () => {
            const emptyDir = join(testDir, 'empty-dir');
            await mkdir(emptyDir, { recursive: true });

            await expect(
                matchPatterns(['empty-dir'], fs, pathAdapter, { cwd: testDir }),
            ).rejects.toThrow(NoFilesForPattern);
        });

        test('should throw error for each non-matching pattern', async () => {
            try {
                await matchPatterns(
                    ['file1.txt', 'nonexistent.txt'],
                    fs,
                    pathAdapter,
                    { cwd: testDir },
                );
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(NoFilesForPattern);
                expect((error as NoFilesForPattern).pattern).toBe('nonexistent.txt');
            }
        });

        test('should validate all patterns even if some match', async () => {
            const patterns = ['file1.txt', '*.xyz', 'src'];

            await expect(
                matchPatterns(patterns, fs, pathAdapter, { cwd: testDir }),
            ).rejects.toThrow(NoFilesForPattern);
        });
    });
});
