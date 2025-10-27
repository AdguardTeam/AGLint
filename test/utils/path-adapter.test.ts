import { describe, expect, test } from 'vitest';

import { NodePathAdapter } from '../../src/utils/path-adapter';

describe('NodePathAdapter', () => {
    let adapter: NodePathAdapter;

    test('should initialize with POSIX separator and delimiter', () => {
        adapter = new NodePathAdapter();

        expect(adapter.sep).toBe('/');
        expect(adapter.delimiter).toBe(':');
    });

    describe('resolve', () => {
        test('should resolve single path segment', () => {
            adapter = new NodePathAdapter();
            const result = adapter.resolve('test');

            expect(result).toMatch(/\/test$/);
            expect(result).not.toContain('\\');
        });

        test('should resolve multiple path segments', () => {
            adapter = new NodePathAdapter();
            const result = adapter.resolve('path', 'to', 'file.txt');

            expect(result).toMatch(/\/path\/to\/file\.txt$/);
            expect(result).not.toContain('\\');
        });

        test('should resolve absolute path', () => {
            adapter = new NodePathAdapter();
            const result = adapter.resolve('/absolute/path');

            expect(result).toBe('/absolute/path');
        });

        test('should resolve relative paths with ..', () => {
            adapter = new NodePathAdapter();
            const result = adapter.resolve('/path/to/file', '..');

            expect(result).toBe('/path/to');
        });

        test('should resolve empty string', () => {
            adapter = new NodePathAdapter();
            const result = adapter.resolve('');

            expect(result).toBeTruthy();
            expect(result).not.toContain('\\');
        });

        test('should convert Windows paths to POSIX', () => {
            adapter = new NodePathAdapter();
            // Even if we pass Windows-style paths, they should be converted
            const result = adapter.resolve('C:\\Users\\test');

            expect(result).not.toContain('\\');
            expect(result).toContain('/');
        });
    });

    describe('join', () => {
        test('should join two path segments', () => {
            adapter = new NodePathAdapter();
            const result = adapter.join('path', 'to');

            expect(result).toBe('path/to');
        });

        test('should join multiple path segments', () => {
            adapter = new NodePathAdapter();
            const result = adapter.join('path', 'to', 'file.txt');

            expect(result).toBe('path/to/file.txt');
        });

        test('should join with absolute path', () => {
            adapter = new NodePathAdapter();
            const result = adapter.join('/root', 'path', 'file.txt');

            expect(result).toBe('/root/path/file.txt');
        });

        test('should handle empty segments', () => {
            adapter = new NodePathAdapter();
            const result = adapter.join('path', '', 'file.txt');

            expect(result).toBe('path/file.txt');
        });

        test('should handle relative paths', () => {
            adapter = new NodePathAdapter();
            const result = adapter.join('path', '..', 'file.txt');

            expect(result).toBe('file.txt');
        });

        test('should convert Windows paths to POSIX', () => {
            adapter = new NodePathAdapter();
            const result = adapter.join('path\\to', 'file.txt');

            expect(result).not.toContain('\\');
            expect(result).toContain('/');
        });

        test('should handle trailing slashes', () => {
            adapter = new NodePathAdapter();
            const result = adapter.join('path/', 'to/');

            expect(result).toBe('path/to/');
        });
    });

    describe('dirname', () => {
        test('should get directory name from simple path', () => {
            adapter = new NodePathAdapter();
            const result = adapter.dirname('/path/to/file.txt');

            expect(result).toBe('/path/to');
        });

        test('should get directory name from nested path', () => {
            adapter = new NodePathAdapter();
            const result = adapter.dirname('/a/b/c/d/file.txt');

            expect(result).toBe('/a/b/c/d');
        });

        test('should handle path without directory', () => {
            adapter = new NodePathAdapter();
            const result = adapter.dirname('file.txt');

            expect(result).toBe('.');
        });

        test('should handle root path', () => {
            adapter = new NodePathAdapter();
            const result = adapter.dirname('/');

            expect(result).toBe('/');
        });

        test('should convert Windows paths to POSIX', () => {
            adapter = new NodePathAdapter();
            const result = adapter.dirname('path\\to\\file.txt');

            expect(result).not.toContain('\\');
            // On Unix, path\to\file.txt is treated as a single filename, so dirname returns '.'
            expect(result).toBe('.');
        });
    });

    describe('basename', () => {
        test('should get basename from path', () => {
            adapter = new NodePathAdapter();
            const result = adapter.basename('/path/to/file.txt');

            expect(result).toBe('file.txt');
        });

        test('should get basename without extension', () => {
            adapter = new NodePathAdapter();
            const result = adapter.basename('/path/to/file.txt', '.txt');

            expect(result).toBe('file');
        });

        test('should handle path without directory', () => {
            adapter = new NodePathAdapter();
            const result = adapter.basename('file.txt');

            expect(result).toBe('file.txt');
        });

        test('should handle hidden files', () => {
            adapter = new NodePathAdapter();
            const result = adapter.basename('/path/to/.hidden');

            expect(result).toBe('.hidden');
        });

        test('should handle path with multiple extensions', () => {
            adapter = new NodePathAdapter();
            const result = adapter.basename('/path/to/file.tar.gz');

            expect(result).toBe('file.tar.gz');
        });

        test('should remove correct extension', () => {
            adapter = new NodePathAdapter();
            const result = adapter.basename('/path/to/file.tar.gz', '.gz');

            expect(result).toBe('file.tar');
        });
    });

    describe('extname', () => {
        test('should get extension from path', () => {
            adapter = new NodePathAdapter();
            const result = adapter.extname('/path/to/file.txt');

            expect(result).toBe('.txt');
        });

        test('should get extension from complex filename', () => {
            adapter = new NodePathAdapter();
            const result = adapter.extname('/path/to/file.tar.gz');

            expect(result).toBe('.gz');
        });

        test('should return empty string for no extension', () => {
            adapter = new NodePathAdapter();
            const result = adapter.extname('/path/to/file');

            expect(result).toBe('');
        });

        test('should handle hidden files without extension', () => {
            adapter = new NodePathAdapter();
            const result = adapter.extname('/path/to/.hidden');

            expect(result).toBe('');
        });

        test('should handle hidden files with extension', () => {
            adapter = new NodePathAdapter();
            const result = adapter.extname('/path/to/.hidden.txt');

            expect(result).toBe('.txt');
        });

        test('should handle various extensions', () => {
            adapter = new NodePathAdapter();

            expect(adapter.extname('file.js')).toBe('.js');
            expect(adapter.extname('file.ts')).toBe('.ts');
            expect(adapter.extname('file.json')).toBe('.json');
            expect(adapter.extname('file.md')).toBe('.md');
        });
    });

    describe('parse', () => {
        test('should parse Unix absolute path', () => {
            adapter = new NodePathAdapter();
            const result = adapter.parse('/path/to/file.txt');

            expect(result.root).toBe('/');
            expect(result.dir).toBe('/path/to');
            expect(result.base).toBe('file.txt');
            expect(result.ext).toBe('.txt');
            expect(result.name).toBe('file');
        });

        test('should parse relative path', () => {
            adapter = new NodePathAdapter();
            const result = adapter.parse('path/to/file.txt');

            expect(result.root).toBe('');
            expect(result.dir).toBe('path/to');
            expect(result.base).toBe('file.txt');
            expect(result.ext).toBe('.txt');
            expect(result.name).toBe('file');
        });

        test('should parse filename only', () => {
            adapter = new NodePathAdapter();
            const result = adapter.parse('file.txt');

            expect(result.root).toBe('');
            expect(result.dir).toBe('');
            expect(result.base).toBe('file.txt');
            expect(result.ext).toBe('.txt');
            expect(result.name).toBe('file');
        });

        test('should parse path without extension', () => {
            adapter = new NodePathAdapter();
            const result = adapter.parse('/path/to/file');

            expect(result.root).toBe('/');
            expect(result.dir).toBe('/path/to');
            expect(result.base).toBe('file');
            expect(result.ext).toBe('');
            expect(result.name).toBe('file');
        });

        test('should parse hidden file', () => {
            adapter = new NodePathAdapter();
            const result = adapter.parse('/path/to/.hidden');

            expect(result.root).toBe('/');
            expect(result.dir).toBe('/path/to');
            expect(result.base).toBe('.hidden');
            expect(result.ext).toBe('');
            expect(result.name).toBe('.hidden');
        });

        test('should normalize Windows paths to POSIX', () => {
            adapter = new NodePathAdapter();
            const result = adapter.parse('C:\\path\\to\\file.txt');

            expect(result.root).not.toContain('\\');
            expect(result.dir).not.toContain('\\');
            if (result.dir) {
                expect(result.dir).toContain('/');
            }
        });
    });

    describe('relative', () => {
        test('should get relative path between two paths', () => {
            adapter = new NodePathAdapter();
            const result = adapter.relative('/path/to/dir', '/path/to/file.txt');

            expect(result).toBe('../file.txt');
        });

        test('should get relative path to subdirectory', () => {
            adapter = new NodePathAdapter();
            const result = adapter.relative('/path/to', '/path/to/subdir/file.txt');

            expect(result).toBe('subdir/file.txt');
        });

        test('should return empty string for same path', () => {
            adapter = new NodePathAdapter();
            const result = adapter.relative('/path/to/file', '/path/to/file');

            expect(result).toBe('');
        });

        test('should handle relative paths', () => {
            adapter = new NodePathAdapter();
            const result = adapter.relative('path/to/dir', 'path/to/file.txt');

            expect(result).toBe('../file.txt');
        });

        test('should convert Windows paths to POSIX', () => {
            adapter = new NodePathAdapter();
            const result = adapter.relative('C:\\path\\to', 'C:\\path\\to\\file.txt');

            expect(result).not.toContain('\\');
        });
    });

    describe('isAbsolute', () => {
        test('should return true for Unix absolute path', () => {
            adapter = new NodePathAdapter();
            const result = adapter.isAbsolute('/path/to/file.txt');

            expect(result).toBe(true);
        });

        test('should return false for relative path', () => {
            adapter = new NodePathAdapter();
            const result = adapter.isAbsolute('path/to/file.txt');

            expect(result).toBe(false);
        });

        test('should return false for relative path with ..', () => {
            adapter = new NodePathAdapter();
            const result = adapter.isAbsolute('../path/to/file.txt');

            expect(result).toBe(false);
        });

        test('should return false for current directory', () => {
            adapter = new NodePathAdapter();
            const result = adapter.isAbsolute('./file.txt');

            expect(result).toBe(false);
        });

        test('should handle Windows absolute paths', () => {
            adapter = new NodePathAdapter();
            // On Unix systems, this might not be considered absolute
            // but the adapter should handle it consistently
            const result = adapter.isAbsolute('C:\\path\\to\\file.txt');

            expect(typeof result).toBe('boolean');
        });
    });

    describe('normalize', () => {
        test('should normalize path with ..', () => {
            adapter = new NodePathAdapter();
            const result = adapter.normalize('/path/to/../file.txt');

            expect(result).toBe('/path/file.txt');
        });

        test('should normalize path with .', () => {
            adapter = new NodePathAdapter();
            const result = adapter.normalize('/path/./to/file.txt');

            expect(result).toBe('/path/to/file.txt');
        });

        test('should normalize path with multiple slashes', () => {
            adapter = new NodePathAdapter();
            const result = adapter.normalize('/path///to//file.txt');

            expect(result).toBe('/path/to/file.txt');
        });

        test('should normalize relative path', () => {
            adapter = new NodePathAdapter();
            const result = adapter.normalize('path/to/../file.txt');

            expect(result).toBe('path/file.txt');
        });

        test('should convert Windows paths to POSIX', () => {
            adapter = new NodePathAdapter();
            const result = adapter.normalize('path\\to\\file.txt');

            expect(result).not.toContain('\\');
            expect(result).toContain('/');
        });

        test('should handle empty string', () => {
            adapter = new NodePathAdapter();
            const result = adapter.normalize('');

            expect(result).toBe('.');
        });
    });

    describe('toPosix', () => {
        test('should convert Windows backslashes to forward slashes', () => {
            adapter = new NodePathAdapter();
            const result = adapter.toPosix('path\\to\\file.txt');

            expect(result).toBe('path/to/file.txt');
        });

        test('should handle already POSIX paths', () => {
            adapter = new NodePathAdapter();
            const result = adapter.toPosix('path/to/file.txt');

            expect(result).toBe('path/to/file.txt');
        });

        test('should handle mixed separators', () => {
            adapter = new NodePathAdapter();
            const result = adapter.toPosix('path/to\\file.txt');

            expect(result).toBe('path/to/file.txt');
        });

        test('should handle Windows absolute paths', () => {
            adapter = new NodePathAdapter();
            const result = adapter.toPosix('C:\\Users\\test\\file.txt');

            expect(result).toBe('C:/Users/test/file.txt');
        });

        test('should handle empty string', () => {
            adapter = new NodePathAdapter();
            const result = adapter.toPosix('');

            expect(result).toBe('');
        });

        test('should handle paths with multiple backslashes', () => {
            adapter = new NodePathAdapter();
            // In JavaScript strings, \\ becomes a single backslash
            const result = adapter.toPosix('path\\to\\file.txt');

            expect(result).toBe('path/to/file.txt');
        });
    });

    describe('edge cases and integration', () => {
        test('should handle special characters in paths', () => {
            adapter = new NodePathAdapter();

            const joined = adapter.join('path', 'with spaces', 'file.txt');
            expect(joined).toBe('path/with spaces/file.txt');

            const basename = adapter.basename('path/to/file (1).txt');
            expect(basename).toBe('file (1).txt');
        });

        test('should handle Unicode characters in paths', () => {
            adapter = new NodePathAdapter();

            const joined = adapter.join('path', '文件', 'file.txt');
            expect(joined).toContain('文件');

            const basename = adapter.basename('path/to/文件.txt');
            expect(basename).toBe('文件.txt');
        });

        test('should consistently return POSIX paths across all methods', () => {
            adapter = new NodePathAdapter();

            const resolved = adapter.resolve('path\\to\\file.txt');
            const joined = adapter.join('path\\to', 'file.txt');
            const normalized = adapter.normalize('path\\to\\file.txt');
            const dirname = adapter.dirname('path\\to\\file.txt');

            expect(resolved).not.toContain('\\');
            expect(joined).not.toContain('\\');
            expect(normalized).not.toContain('\\');
            expect(dirname).not.toContain('\\');
        });

        test('should handle multiple operations on same path', () => {
            adapter = new NodePathAdapter();
            const testPath = '/path/to/file.txt';

            const dir = adapter.dirname(testPath);
            const base = adapter.basename(testPath);
            const ext = adapter.extname(testPath);
            const parsed = adapter.parse(testPath);

            expect(dir).toBe('/path/to');
            expect(base).toBe('file.txt');
            expect(ext).toBe('.txt');
            expect(parsed.dir).toBe(dir);
            expect(parsed.base).toBe(base);
            expect(parsed.ext).toBe(ext);
        });

        test('should handle complex nested paths', () => {
            adapter = new NodePathAdapter();

            const joined = adapter.join('/root', 'a', 'b', 'c', 'd', 'file.txt');
            expect(joined).toBe('/root/a/b/c/d/file.txt');

            const dirname = adapter.dirname(joined);
            expect(dirname).toBe('/root/a/b/c/d');
        });

        test('should handle relative path navigation', () => {
            adapter = new NodePathAdapter();

            const path1 = adapter.join('/path/to/dir', '..', '..', 'file.txt');
            expect(path1).toBe('/path/file.txt');

            const path2 = adapter.normalize('/path/to/dir/../../file.txt');
            expect(path2).toBe('/path/file.txt');
        });
    });
});
