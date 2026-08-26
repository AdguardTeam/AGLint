import os from 'node:os';

import * as v from 'valibot';
import { describe, expect, test } from 'vitest';

import { calculateThreads, isSmallProject, threadOptionSchema } from '../../../src/cli/utils/thread-manager';

describe('thread-manager', () => {
    describe('threadOptionSchema', () => {
        test('should accept "off" string', () => {
            const result = v.parse(threadOptionSchema, 'off');
            expect(result).toBe('off');
        });

        test('should accept "auto" string', () => {
            const result = v.parse(threadOptionSchema, 'auto');
            expect(result).toBe('auto');
        });

        test('should accept "OFF" string (case insensitive)', () => {
            const result = v.parse(threadOptionSchema, 'OFF');
            expect(result).toBe('off');
        });

        test('should accept "AUTO" string (case insensitive)', () => {
            const result = v.parse(threadOptionSchema, 'AUTO');
            expect(result).toBe('auto');
        });

        test('should accept "Auto" string (case insensitive)', () => {
            const result = v.parse(threadOptionSchema, 'Auto');
            expect(result).toBe('auto');
        });

        test('should accept valid number within range', () => {
            const result = v.parse(threadOptionSchema, 4);
            expect(result).toBe(4);
        });

        test('should accept 1 (minimum valid number)', () => {
            const result = v.parse(threadOptionSchema, 1);
            expect(result).toBe(1);
        });

        test('should accept max available threads', () => {
            const maxThreads = os.availableParallelism?.() ?? os.cpus().length;
            const result = v.parse(threadOptionSchema, maxThreads);
            expect(result).toBe(maxThreads);
        });

        test('should reject 0', () => {
            expect(() => v.parse(threadOptionSchema, 0)).toThrow();
        });

        test('should reject negative numbers', () => {
            expect(() => v.parse(threadOptionSchema, -1)).toThrow();
        });

        test('should reject number exceeding max threads', () => {
            const maxThreads = os.availableParallelism?.() ?? os.cpus().length;
            expect(() => v.parse(threadOptionSchema, maxThreads + 1)).toThrow();
        });

        test('should reject invalid string', () => {
            expect(() => v.parse(threadOptionSchema, 'invalid')).toThrow();
        });

        test('should reject empty string', () => {
            expect(() => v.parse(threadOptionSchema, '')).toThrow();
        });

        test('should reject null', () => {
            expect(() => v.parse(threadOptionSchema, null)).toThrow();
        });

        test('should reject undefined', () => {
            expect(() => v.parse(threadOptionSchema, undefined)).toThrow();
        });
    });

    describe('calculateThreads', () => {
        test('should return 1 thread for "off" option', () => {
            const result = calculateThreads('off');

            expect(result.maxThreads).toBe(1);
            expect(result.isAutoMode).toBe(false);
        });

        test('should return auto threads for "auto" option', () => {
            const availableThreads = os.availableParallelism?.() ?? os.cpus().length;
            const expectedThreads = Math.max(1, Math.floor(availableThreads / 2));

            const result = calculateThreads('auto');

            expect(result.maxThreads).toBe(expectedThreads);
            expect(result.isAutoMode).toBe(true);
        });

        test('should return specified number of threads', () => {
            const result = calculateThreads(4);

            expect(result.maxThreads).toBe(4);
            expect(result.isAutoMode).toBe(false);
        });

        test('should handle 1 thread', () => {
            const result = calculateThreads(1);

            expect(result.maxThreads).toBe(1);
            expect(result.isAutoMode).toBe(false);
        });

        test('should handle maximum available threads', () => {
            const maxThreads = os.availableParallelism?.() ?? os.cpus().length;

            const result = calculateThreads(maxThreads);

            expect(result.maxThreads).toBe(maxThreads);
            expect(result.isAutoMode).toBe(false);
        });

        test('should floor numeric values', () => {
            const result = calculateThreads(4.7);

            expect(result.maxThreads).toBe(4);
            expect(result.isAutoMode).toBe(false);
        });

        test('should ensure minimum of 1 thread for numeric values', () => {
            // Testing with a very small positive number that would floor to 0
            const result = calculateThreads(0.5);

            expect(result.maxThreads).toBe(1);
            expect(result.isAutoMode).toBe(false);
        });

        test('should ensure auto mode has at least 1 thread', () => {
            // Even on single-core systems, auto should give at least 1 thread
            const result = calculateThreads('auto');

            expect(result.maxThreads).toBeGreaterThanOrEqual(1);
            expect(result.isAutoMode).toBe(true);
        });

        test('should calculate auto threads as half of available', () => {
            const availableThreads = os.availableParallelism?.() ?? os.cpus().length;

            // Mock scenario: if we have 8 cores, auto should give 4
            if (availableThreads >= 2) {
                const result = calculateThreads('auto');
                const expected = Math.floor(availableThreads / 2);

                expect(result.maxThreads).toBe(expected);
            }
        });

        test('should return ThreadConfig object with correct structure', () => {
            const result = calculateThreads('auto');

            expect(result).toHaveProperty('maxThreads');
            expect(result).toHaveProperty('isAutoMode');
            expect(typeof result.maxThreads).toBe('number');
            expect(typeof result.isAutoMode).toBe('boolean');
        });

        test('should handle edge case with 2 threads', () => {
            const result = calculateThreads(2);

            expect(result.maxThreads).toBe(2);
            expect(result.isAutoMode).toBe(false);
        });
    });

    describe('isSmallProject', () => {
        test('should return true for projects with less than 5 files', () => {
            expect(isSmallProject(0, 10_000_000)).toBe(true);
            expect(isSmallProject(1, 10_000_000)).toBe(true);
            expect(isSmallProject(2, 10_000_000)).toBe(true);
            expect(isSmallProject(3, 10_000_000)).toBe(true);
            expect(isSmallProject(4, 10_000_000)).toBe(true);
        });

        test('should return true for projects with less than 5MB total size', () => {
            const fiveMB = 5 * 1024 * 1024;
            expect(isSmallProject(100, 0)).toBe(true);
            expect(isSmallProject(100, 1024)).toBe(true);
            expect(isSmallProject(100, fiveMB - 1)).toBe(true);
        });

        test('should return false for 5 or more files and 5MB or more', () => {
            const fiveMB = 5 * 1024 * 1024;
            expect(isSmallProject(5, fiveMB)).toBe(false);
            expect(isSmallProject(10, fiveMB)).toBe(false);
            expect(isSmallProject(5, fiveMB + 1)).toBe(false);
            expect(isSmallProject(100, 10_000_000)).toBe(false);
        });

        test('should return true if either condition is true (file count)', () => {
            const fiveMB = 5 * 1024 * 1024;
            expect(isSmallProject(4, fiveMB + 1000)).toBe(true);
        });

        test('should return true if either condition is true (size)', () => {
            const fiveMB = 5 * 1024 * 1024;
            expect(isSmallProject(100, fiveMB - 1)).toBe(true);
        });

        test('should handle edge case at boundary (5 files)', () => {
            const fiveMB = 5 * 1024 * 1024;
            expect(isSmallProject(5, fiveMB - 1)).toBe(true);
            expect(isSmallProject(5, fiveMB)).toBe(false);
        });

        test('should handle edge case at boundary (5MB)', () => {
            const fiveMB = 5 * 1024 * 1024;
            expect(isSmallProject(4, fiveMB)).toBe(true);
            expect(isSmallProject(5, fiveMB)).toBe(false);
        });

        test('should handle zero file count', () => {
            expect(isSmallProject(0, 0)).toBe(true);
            expect(isSmallProject(0, 10_000_000)).toBe(true);
        });

        test('should handle zero size', () => {
            expect(isSmallProject(0, 0)).toBe(true);
            expect(isSmallProject(100, 0)).toBe(true);
        });

        test('should handle large file count with large size', () => {
            const tenMB = 10 * 1024 * 1024;
            expect(isSmallProject(1000, tenMB)).toBe(false);
        });

        test('should handle exact 5MB boundary', () => {
            const exactlyFiveMB = 5 * 1024 * 1024;
            expect(isSmallProject(5, exactlyFiveMB)).toBe(false);
            expect(isSmallProject(6, exactlyFiveMB)).toBe(false);
        });

        test('should handle one byte less than 5MB', () => {
            const almostFiveMB = 5 * 1024 * 1024 - 1;
            expect(isSmallProject(10, almostFiveMB)).toBe(true);
        });

        test('should use OR logic (not AND)', () => {
            const fiveMB = 5 * 1024 * 1024;
            // Small file count should make it small regardless of size
            expect(isSmallProject(3, fiveMB * 10)).toBe(true);
            // Small size should make it small regardless of file count
            expect(isSmallProject(1000, fiveMB - 1)).toBe(true);
        });
    });

    describe('integration scenarios', () => {
        test('should work with typical small project workflow', () => {
            const threads = calculateThreads('auto');
            const small = isSmallProject(3, 1024 * 1024); // 3 files, 1MB

            expect(small).toBe(true);
            expect(threads.maxThreads).toBeGreaterThanOrEqual(1);
        });

        test('should work with typical large project workflow', () => {
            const threads = calculateThreads('auto');
            const fiveMB = 5 * 1024 * 1024;
            const small = isSmallProject(100, fiveMB + 1000);

            expect(small).toBe(false);
            expect(threads.maxThreads).toBeGreaterThanOrEqual(1);
        });

        test('should allow manual thread override for small projects', () => {
            const threads = calculateThreads(8);
            const small = isSmallProject(2, 1024);

            expect(small).toBe(true);
            expect(threads.maxThreads).toBe(8);
            expect(threads.isAutoMode).toBe(false);
        });

        test('should allow disabling threads for any project size', () => {
            const threads = calculateThreads('off');
            const fiveMB = 5 * 1024 * 1024;
            const large = isSmallProject(1000, fiveMB * 10);

            expect(large).toBe(false);
            expect(threads.maxThreads).toBe(1);
            expect(threads.isAutoMode).toBe(false);
        });
    });
});
