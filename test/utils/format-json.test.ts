import { describe, expect, it } from 'vitest';

import { formatJson } from '../../src/utils/format-json';

describe('formatJson', () => {
    describe('indent detection', () => {
        it('uses no indent when indent cannot be detected from minimal content', () => {
            const obj = { key: 'value' };
            const originalContent = '{}';
            const result = formatJson(obj, originalContent);

            // detect-indent returns empty string when no indent is detected
            expect(result).toBe('{"key":"value"}');
        });

        it('detects and preserves 2-space indent', () => {
            const obj = { a: 1, b: 2 };
            const originalContent = '{\n  "x": 1,\n  "y": 2\n}';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
        });

        it('detects and preserves 4-space indent', () => {
            const obj = { a: 1, b: 2 };
            const originalContent = '{\n    "x": 1,\n    "y": 2\n}';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('{\n    "a": 1,\n    "b": 2\n}');
        });

        it('detects and preserves tab indent', () => {
            const obj = { a: 1, b: 2 };
            const originalContent = '{\n\t"x": 1,\n\t"y": 2\n}';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('{\n\t"a": 1,\n\t"b": 2\n}');
        });

        it('detects and preserves mixed indent (tabs)', () => {
            const obj = { a: { b: 1 } };
            const originalContent = '{\n\t"x": {\n\t\t"y": 1\n\t}\n}';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('{\n\t"a": {\n\t\t"b": 1\n\t}\n}');
        });
    });

    describe('newline detection', () => {
        it('uses LF (\\n) as default newline style when not detected', () => {
            const obj = { key: 'value' };
            const originalContent = '{"x": 1}';
            const result = formatJson(obj, originalContent);

            // No indent detected, but uses LF for newlines in JSON.stringify
            expect(result).toBe('{"key":"value"}');
            expect(result).not.toContain('\r\n');
        });

        it('detects and preserves LF newlines', () => {
            const obj = { a: 1, b: 2 };
            const originalContent = '{\n  "x": 1,\n  "y": 2\n}';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
            expect(result).not.toContain('\r\n');
        });

        it('detects and preserves CRLF newlines', () => {
            const obj = { a: 1, b: 2 };
            const originalContent = '{\r\n  "x": 1,\r\n  "y": 2\r\n}';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('{\r\n  "a": 1,\r\n  "b": 2\r\n}');
            expect(result.split('\r\n')).toHaveLength(4);
        });

        it('handles CRLF with nested objects', () => {
            const obj = { a: { b: { c: 1 } } };
            const originalContent = '{\r\n  "x": {\r\n    "y": 1\r\n  }\r\n}';
            const result = formatJson(obj, originalContent);

            expect(result).toContain('\r\n');
            expect(result.split('\n').every((line, idx, arr) => {
                // All newlines except the last character should be preceded by \r
                if (idx < arr.length - 1) {
                    return line.endsWith('\r') || line === '';
                }
                return true;
            })).toBe(true);
        });
    });

    describe('final newline handling', () => {
        it('does not add final newline when original does not have one', () => {
            const obj = { key: 'value' };
            const originalContent = '{"x": 1}'; // no final newline
            const result = formatJson(obj, originalContent);

            // No indent detected, no final newline added
            expect(result).toBe('{"key":"value"}');
            expect(result.endsWith('}')).toBe(true);
        });

        it('adds final newline when original has one (LF)', () => {
            const obj = { key: 'value' };
            const originalContent = '{"x": 1}\n'; // has final newline
            const result = formatJson(obj, originalContent);

            // No indent detected, but adds final LF
            expect(result).toBe('{"key":"value"}\n');
            expect(result.endsWith('\n')).toBe(true);
        });

        it('adds final newline when original has one (CRLF)', () => {
            const obj = { key: 'value' };
            const originalContent = '{"x": 1}\r\n'; // has final CRLF
            const result = formatJson(obj, originalContent);

            // No indent detected, but adds final CRLF
            expect(result).toBe('{"key":"value"}\r\n');
            expect(result.endsWith('\r\n')).toBe(true);
        });

        it('handles multiple trailing newlines (only preserves one)', () => {
            const obj = { key: 'value' };
            const originalContent = '{"x": 1}\n\n\n';
            const result = formatJson(obj, originalContent);

            // Checks if original ends with newline (it does), adds one
            expect(result).toBe('{"key":"value"}\n');
            expect(result.endsWith('\n')).toBe(true);
        });

        it('preserves final newline with properly indented content', () => {
            const obj = { key: 'value' };
            const originalContent = '{\n  "old": "value"\n}\n';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('{\n  "key": "value"\n}\n');
            expect(result.endsWith('\n')).toBe(true);
        });
    });

    describe('combined formatting scenarios', () => {
        it('combines 4-space indent + CRLF + final newline', () => {
            const obj = { a: 1, b: { c: 2 } };
            const originalContent = '{\r\n    "x": 1,\r\n    "y": 2\r\n}\r\n';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('{\r\n    "a": 1,\r\n    "b": {\r\n        "c": 2\r\n    }\r\n}\r\n');
        });

        it('combines tab indent + LF + no final newline', () => {
            const obj = { a: [1, 2, 3] };
            const originalContent = '{\n\t"x": [1, 2]\n}';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('{\n\t"a": [\n\t\t1,\n\t\t2,\n\t\t3\n\t]\n}');
        });

        it('handles complex nested structure with custom formatting', () => {
            const obj = {
                name: 'test',
                settings: {
                    enabled: true,
                    options: ['a', 'b'],
                },
            };
            const originalContent = '{\r\n    "old": "value"\r\n}\r\n';
            const result = formatJson(obj, originalContent);

            expect(result).toContain('\r\n');
            expect(result).toContain('    ');
            expect(result.endsWith('\r\n')).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('handles empty object', () => {
            const obj = {};
            const originalContent = '{"x": 1}\n';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('{}\n');
        });

        it('handles empty array', () => {
            const obj: unknown[] = [];
            const originalContent = '{"x": 1}\n';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('[]\n');
        });

        it('handles null value', () => {
            const obj = null;
            const originalContent = '{"x": 1}\n';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('null\n');
        });

        it('handles primitive values', () => {
            const obj = 42;
            const originalContent = '{"x": 1}\n';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('42\n');
        });

        it('handles string value', () => {
            const obj = 'hello';
            const originalContent = '{"x": 1}\n';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('"hello"\n');
        });

        it('handles boolean value', () => {
            const obj = true;
            const originalContent = '{"x": 1}\n';
            const result = formatJson(obj, originalContent);

            expect(result).toBe('true\n');
        });

        it('handles empty original content with no indent', () => {
            const obj = { key: 'value' };
            const originalContent = '';
            const result = formatJson(obj, originalContent);

            // Empty content has no detectable indent
            expect(result).toBe('{"key":"value"}');
        });

        it('handles single-line original content with no indent', () => {
            const obj = { a: 1 };
            const originalContent = '{"x":1}';
            const result = formatJson(obj, originalContent);

            // Single-line has no detectable indent
            expect(result).toBe('{"a":1}');
        });

        it('preserves special characters in values', () => {
            const obj = { path: 'C:\\Users\\test', url: 'http://example.com' };
            const originalContent = '{"x": 1}\n';
            const result = formatJson(obj, originalContent);

            expect(result).toContain('C:\\\\Users\\\\test');
            expect(result).toContain('http://example.com');
        });

        it('handles Unicode characters', () => {
            const obj = { emoji: '😀', chinese: '你好' };
            const originalContent = '{"x": 1}\n';
            const result = formatJson(obj, originalContent);

            expect(result).toContain('😀');
            expect(result).toContain('你好');
        });
    });

    describe('real-world scenarios', () => {
        it('formats package.json-like structure', () => {
            const obj = {
                name: 'my-package',
                version: '1.0.0',
                dependencies: {
                    'lib-a': '^1.0.0',
                    'lib-b': '^2.0.0',
                },
            };
            const originalContent = '{\n  "name": "old-package",\n  "version": "0.1.0"\n}\n';
            const result = formatJson(obj, originalContent);

            expect(result).toContain('"name": "my-package"');
            expect(result).toContain('"dependencies"');
            expect(result).toContain('  ');
            expect(result.endsWith('\n')).toBe(true);
        });

        it('formats tsconfig.json-like structure with 4-space indent', () => {
            const obj = {
                compilerOptions: {
                    target: 'ES2020',
                    module: 'commonjs',
                },
            };
            const originalContent = '{\n    "compilerOptions": {\n        "target": "ES6"\n    }\n}\n';
            const result = formatJson(obj, originalContent);

            expect(result).toContain('    ');
            expect(result).toContain('"target": "ES2020"');
            expect(result.endsWith('\n')).toBe(true);
        });

        it('formats config with Windows-style line endings', () => {
            const obj = {
                setting1: 'value1',
                setting2: 'value2',
            };
            const originalContent = '{\r\n  "old": "config"\r\n}\r\n';
            const result = formatJson(obj, originalContent);

            expect(result.split('\r\n').length).toBeGreaterThan(1);
            expect(result).toContain('"setting1"');
            expect(result).toContain('"setting2"');
        });
    });
});
