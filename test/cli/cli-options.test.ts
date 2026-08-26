import { describe, expect, test } from 'vitest';

import { LinterCacheStrategy } from '../../src/cli/cache';
import { buildCliProgram } from '../../src/cli/cli-options';

describe('cli-options', () => {
    describe('buildCliProgram', () => {
        test('should parse basic file patterns', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', 'file1.txt', 'file2.txt']);

            expect(program.args).toEqual(['file1.txt', 'file2.txt']);
        });

        test('should parse glob patterns', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '**/*.txt']);

            expect(program.args).toEqual(['**/*.txt']);
        });

        test('should handle empty patterns', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint']);

            expect(program.args).toEqual([]);
        });
    });

    describe('--threads option', () => {
        test('should accept "off"', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--threads', 'off', 'file.txt']);

            expect(program.opts().threads).toBe('off');
        });

        test('should accept "auto"', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--threads', 'auto', 'file.txt']);

            expect(program.opts().threads).toBe('auto');
        });

        test('should accept "OFF" (case-insensitive)', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--threads', 'OFF', 'file.txt']);

            expect(program.opts().threads).toBe('off');
        });

        test('should accept valid positive integer', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--threads', '4', 'file.txt']);

            expect(program.opts().threads).toBe(4);
            expect(typeof program.opts().threads).toBe('number');
        });

        test('should reject zero', () => {
            const program = buildCliProgram();

            expect(() => {
                program.parse(['node', 'aglint', '--threads', '0', 'file.txt']);
            }).toThrow(/Must be "off", "auto", or a positive integer/);
        });

        test('should reject negative numbers', () => {
            const program = buildCliProgram();

            expect(() => {
                program.parse(['node', 'aglint', '--threads', '-1', 'file.txt']);
            }).toThrow(/Must be "off", "auto", or a positive integer/);
        });

        test('should reject floats', () => {
            const program = buildCliProgram();

            expect(() => {
                program.parse(['node', 'aglint', '--threads', '1.5', 'file.txt']);
            }).toThrow(/Must be "off", "auto", or a positive integer/);
        });

        test('should reject leading zeros', () => {
            const program = buildCliProgram();

            expect(() => {
                program.parse(['node', 'aglint', '--threads', '01', 'file.txt']);
            }).toThrow(/Must be "off", "auto", or a positive integer/);
        });

        test('should reject invalid strings', () => {
            const program = buildCliProgram();

            expect(() => {
                program.parse(['node', 'aglint', '--threads', 'invalid', 'file.txt']);
            }).toThrow(/Must be "off", "auto", or a positive integer/);
        });

        test('should use default value "off" when not specified', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', 'file.txt']);

            expect(program.opts().threads).toBe('off');
        });
    });

    describe('--max-fix-rounds option', () => {
        test('should accept valid positive integer', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--max-fix-rounds', '5', 'file.txt']);

            expect(program.opts().maxFixRounds).toBe(5);
            expect(typeof program.opts().maxFixRounds).toBe('number');
        });

        test('should accept "1"', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--max-fix-rounds', '1', 'file.txt']);

            expect(program.opts().maxFixRounds).toBe(1);
        });

        test('should reject zero', () => {
            const program = buildCliProgram();

            expect(() => {
                program.parse(['node', 'aglint', '--max-fix-rounds', '0', 'file.txt']);
            }).toThrow(/must be a positive integer/);
        });

        test('should reject negative numbers', () => {
            const program = buildCliProgram();

            expect(() => {
                program.parse(['node', 'aglint', '--max-fix-rounds', '-1', 'file.txt']);
            }).toThrow(/must be a positive integer/);
        });

        test('should reject floats', () => {
            const program = buildCliProgram();

            expect(() => {
                program.parse(['node', 'aglint', '--max-fix-rounds', '2.5', 'file.txt']);
            }).toThrow(/must be a positive integer/);
        });

        test('should reject leading zeros', () => {
            const program = buildCliProgram();

            expect(() => {
                program.parse(['node', 'aglint', '--max-fix-rounds', '05', 'file.txt']);
            }).toThrow(/must be a positive integer/);
        });

        test('should reject non-numeric strings', () => {
            const program = buildCliProgram();

            expect(() => {
                program.parse(['node', 'aglint', '--max-fix-rounds', 'abc', 'file.txt']);
            }).toThrow(/must be a positive integer/);
        });

        test('should use default value 10 when not specified', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', 'file.txt']);

            expect(program.opts().maxFixRounds).toBe(10);
        });
    });

    describe('--cache options', () => {
        test('should disable cache by default', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', 'file.txt']);

            expect(program.opts().cache).toBe(false);
        });

        test('should enable cache with --cache flag', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--cache', 'file.txt']);

            expect(program.opts().cache).toBe(true);
        });

        test('should accept metadata cache strategy', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--cache-strategy', 'metadata', 'file.txt']);

            expect(program.opts().cacheStrategy).toBe(LinterCacheStrategy.Metadata);
        });

        test('should accept content cache strategy', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--cache-strategy', 'content', 'file.txt']);

            expect(program.opts().cacheStrategy).toBe(LinterCacheStrategy.Content);
        });

        test('should use metadata as default cache strategy', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', 'file.txt']);

            expect(program.opts().cacheStrategy).toBe(LinterCacheStrategy.Metadata);
        });

        test('should accept custom cache location', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--cache-location', '.custom-cache', 'file.txt']);

            expect(program.opts().cacheLocation).toBe('.custom-cache');
        });
    });

    describe('--fix options', () => {
        test('should disable fix by default', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', 'file.txt']);

            expect(program.opts().fix).toBe(false);
        });

        test('should enable fix with --fix flag', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--fix', 'file.txt']);

            expect(program.opts().fix).toBe(true);
        });

        test('should enable fix with -f flag', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '-f', 'file.txt']);

            expect(program.opts().fix).toBe(true);
        });

        test('should accept fix-types', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', 'file.txt', '--fix-types', 'layout', 'suggestion']);

            expect(program.opts().fixTypes).toEqual(['layout', 'suggestion']);
        });

        test('should accept fix-rules', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', 'file.txt', '--fix-rules', 'rule1', 'rule2']);

            expect(program.opts().fixRules).toEqual(['rule1', 'rule2']);
        });
    });

    describe('--reporter option', () => {
        test('should use console reporter by default', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', 'file.txt']);

            expect(program.opts().reporter).toBe('console');
        });

        test('should accept json reporter', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--reporter', 'json', 'file.txt']);

            expect(program.opts().reporter).toBe('json');
        });

        test('should accept json-with-metadata reporter', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--reporter', 'json-with-metadata', 'file.txt']);

            expect(program.opts().reporter).toBe('json-with-metadata');
        });
    });

    describe('boolean flags', () => {
        test('should handle --debug flag', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--debug', 'file.txt']);

            expect(program.opts().debug).toBe(true);
        });

        test('should handle --init flag', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--init']);

            expect(program.opts().init).toBe(true);
        });

        test('should handle --print-config flag', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--print-config', 'file.txt']);

            expect(program.opts().printConfig).toBe(true);
        });

        test('should handle --color flag', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--color', 'file.txt']);

            expect(program.opts().color).toBe(true);
        });

        test('should handle --no-color flag', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--no-color', 'file.txt']);

            expect(program.opts().color).toBe(false);
        });

        test('should handle --report-unused-disable-directives flag', () => {
            const program = buildCliProgram();
            program.parse(['node', 'aglint', '--report-unused-disable-directives', 'file.txt']);

            expect(program.opts().reportUnusedDisableDirectives).toBe(true);
        });
    });

    describe('combined options', () => {
        test('should handle multiple options together', () => {
            const program = buildCliProgram();
            program.parse([
                'node',
                'aglint',
                '--cache',
                '--cache-strategy',
                'content',
                '--threads',
                '4',
                '--fix',
                '--max-fix-rounds',
                '5',
                '**/*.txt',
            ]);

            const opts = program.opts();
            expect(opts.cache).toBe(true);
            expect(opts.cacheStrategy).toBe(LinterCacheStrategy.Content);
            expect(opts.threads).toBe(4);
            expect(opts.fix).toBe(true);
            expect(opts.maxFixRounds).toBe(5);
            expect(program.args).toEqual(['**/*.txt']);
        });
    });
});
