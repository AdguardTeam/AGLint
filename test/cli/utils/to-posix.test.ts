import { describe, expect, test } from 'vitest';

import { toPosix } from '../../../src/cli/utils/to-posix';

describe('toPosix', () => {
    describe('Windows paths', () => {
        test('should convert single backslash to forward slash', () => {
            expect(toPosix('folder\\file.txt')).toBe('folder/file.txt');
        });

        test('should convert multiple backslashes to forward slashes', () => {
            expect(toPosix('C:\\Users\\John\\Documents\\file.txt')).toBe('C:/Users/John/Documents/file.txt');
        });

        test('should convert Windows drive path', () => {
            expect(toPosix('D:\\projects\\aglint\\src\\index.ts')).toBe('D:/projects/aglint/src/index.ts');
        });

        test('should convert UNC path', () => {
            expect(toPosix('\\\\server\\share\\folder\\file.txt')).toBe('//server/share/folder/file.txt');
        });

        test('should convert relative Windows path', () => {
            expect(toPosix('..\\parent\\file.txt')).toBe('../parent/file.txt');
            expect(toPosix('.\\current\\file.txt')).toBe('./current/file.txt');
        });
    });

    describe('POSIX paths', () => {
        test('should leave forward slashes unchanged', () => {
            expect(toPosix('/usr/local/bin/node')).toBe('/usr/local/bin/node');
        });

        test('should leave relative POSIX paths unchanged', () => {
            expect(toPosix('../parent/file.txt')).toBe('../parent/file.txt');
            expect(toPosix('./current/file.txt')).toBe('./current/file.txt');
        });

        test('should leave home directory paths unchanged', () => {
            expect(toPosix('~/Documents/file.txt')).toBe('~/Documents/file.txt');
        });
    });

    describe('mixed paths', () => {
        test('should convert mixed backslashes and forward slashes', () => {
            expect(toPosix('folder\\subfolder/file.txt')).toBe('folder/subfolder/file.txt');
            expect(toPosix('C:\\Users/John\\Documents/file.txt')).toBe('C:/Users/John/Documents/file.txt');
        });

        test('should handle consecutive mixed separators', () => {
            expect(toPosix('folder\\/\\subfolder')).toBe('folder///subfolder');
        });
    });

    describe('edge cases', () => {
        test('should handle empty string', () => {
            expect(toPosix('')).toBe('');
        });

        test('should handle single backslash', () => {
            expect(toPosix('\\')).toBe('/');
        });

        test('should handle single forward slash', () => {
            expect(toPosix('/')).toBe('/');
        });

        test('should handle only backslashes', () => {
            expect(toPosix('\\\\\\')).toBe('///');
        });

        test('should handle path with no separators', () => {
            expect(toPosix('filename.txt')).toBe('filename.txt');
        });

        test('should handle root paths', () => {
            expect(toPosix('C:\\')).toBe('C:/');
            expect(toPosix('/')).toBe('/');
        });
    });

    describe('special characters and spaces', () => {
        test('should handle paths with spaces', () => {
            expect(toPosix('C:\\Program Files\\My App\\file.txt')).toBe('C:/Program Files/My App/file.txt');
        });

        test('should handle paths with special characters', () => {
            expect(toPosix('folder\\file@name#test$.txt')).toBe('folder/file@name#test$.txt');
        });

        test('should handle paths with unicode characters', () => {
            expect(toPosix('フォルダ\\ファイル.txt')).toBe('フォルダ/ファイル.txt');
            expect(toPosix('папка\\файл.txt')).toBe('папка/файл.txt');
        });

        test('should handle paths with dots and dashes', () => {
            expect(toPosix('my-folder\\my.file-name.txt')).toBe('my-folder/my.file-name.txt');
        });
    });

    describe('real-world scenarios', () => {
        test('should handle typical project paths', () => {
            expect(toPosix('C:\\projects\\aglint\\src\\linter\\fixer.ts'))
                .toBe('C:/projects/aglint/src/linter/fixer.ts');
        });

        test('should handle node_modules paths', () => {
            expect(toPosix('C:\\project\\node_modules\\@types\\node\\index.d.ts'))
                .toBe('C:/project/node_modules/@types/node/index.d.ts');
        });

        test('should handle test file paths', () => {
            expect(toPosix('test\\linter\\fixer.test.ts')).toBe('test/linter/fixer.test.ts');
        });

        test('should handle build output paths', () => {
            expect(toPosix('dist\\esm\\index.js')).toBe('dist/esm/index.js');
            expect(toPosix('build\\types\\index.d.ts')).toBe('build/types/index.d.ts');
        });
    });

    describe('performance and consistency', () => {
        test('should be idempotent', () => {
            const windowsPath = 'C:\\Users\\John\\file.txt';
            const posixPath = toPosix(windowsPath);
            expect(toPosix(posixPath)).toBe(posixPath);
        });

        test('should handle very long paths', () => {
            const longPath = `C:${'\\folder'.repeat(50)}\\file.txt`;
            const expected = `C:${'/folder'.repeat(50)}/file.txt`;
            expect(toPosix(longPath)).toBe(expected);
        });

        test('should handle paths with many consecutive backslashes', () => {
            expect(toPosix('folder\\\\\\\\\\file.txt')).toBe('folder/////file.txt');
        });
    });
});
