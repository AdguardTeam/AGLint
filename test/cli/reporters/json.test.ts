import path from 'node:path';

import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import { LinterJsonReporter } from '../../../src/cli/reporters/json';
import { type AnyLinterResult } from '../../../src/linter/fixer';
import { LinterRuleSeverity, LinterRuleType } from '../../../src/linter/rule';

describe('LinterJsonReporter', () => {
    test('should output sorted JSON results', () => {
        const reporter = new LinterJsonReporter();
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        const result1: AnyLinterResult = {
            problems: [
                {
                    message: 'Test error',
                    severity: LinterRuleSeverity.Error,
                    ruleId: 'test-rule',
                    position: {
                        start: { line: 1, column: 1 },
                        end: { line: 1, column: 10 },
                    },
                },
            ],
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        };

        const result2: AnyLinterResult = {
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        };

        // Report results in reverse alphabetical order
        reporter.onFileEnd?.(path.parse('/path/to/file2.txt'), result2);
        reporter.onFileEnd?.(path.parse('/path/to/file1.txt'), result1);

        reporter.onCliEnd?.();

        // Should output sorted by file path
        expect(consoleSpy).toHaveBeenCalledOnce();
        const output = consoleSpy.mock.calls[0]![0];
        const parsed = JSON.parse(output);

        // Keys should be sorted alphabetically
        const keys = Object.keys(parsed);
        expect(keys).toEqual(['/path/to/file1.txt', '/path/to/file2.txt']);

        // Verify results are correct
        expect(parsed['/path/to/file1.txt']).toEqual(result1);
        expect(parsed['/path/to/file2.txt']).toEqual(result2);

        consoleSpy.mockRestore();
    });

    test('should handle empty results', () => {
        const reporter = new LinterJsonReporter();
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        reporter.onCliEnd?.();

        expect(consoleSpy).toHaveBeenCalledOnce();
        const output = consoleSpy.mock.calls[0]![0];
        const parsed = JSON.parse(output);

        expect(parsed).toEqual({});

        consoleSpy.mockRestore();
    });

    test('should handle results with metadata', () => {
        const reporter = new LinterJsonReporter();
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        const result: AnyLinterResult = {
            problems: [
                {
                    message: 'Test error',
                    severity: LinterRuleSeverity.Error,
                    ruleId: 'test-rule',
                    position: {
                        start: { line: 1, column: 1 },
                        end: { line: 1, column: 10 },
                    },
                },
            ],
            metadata: {
                'test-rule': {
                    type: LinterRuleType.Problem,
                    docs: {
                        name: 'test-rule',
                        description: 'Test rule',
                        recommended: false,
                    },
                },
            },
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        };

        reporter.onFileEnd?.(path.parse('/path/to/file.txt'), result);
        reporter.onCliEnd?.();

        expect(consoleSpy).toHaveBeenCalledOnce();
        const output = consoleSpy.mock.calls[0]![0];
        const parsed = JSON.parse(output);

        // Should include metadata in output
        expect(parsed['/path/to/file.txt'].metadata).toBeDefined();
        expect(parsed['/path/to/file.txt'].metadata['test-rule']).toEqual(result.metadata!['test-rule']);

        consoleSpy.mockRestore();
    });
});
