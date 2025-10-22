import { type ParsedPath } from 'node:path';

import { type LinterConfig } from '../../linter/config';
import { type AnyLinterResult } from '../../linter/fixer';
import { type LinterCliConfig } from '../cli-options';

/**
 * Represents a reporter skeleton for the linter.
 */
export interface LinterCliReporter {
    /**
     * Called when the whole linting process starts.
     */
    onCliStart?: (cliOptions: LinterCliConfig) => void;

    /**
     * Called when linting a file starts.
     *
     * @param file The file that is being linted.
     * @param config The linter configuration.
     */
    onFileStart?: (file: ParsedPath, config: LinterConfig) => void;

    /**
     * Called when linting a file ends. It will give you the result of the linting
     * and the configuration that was used (if you want to do something with it).
     *
     * @param file The file that was linted.
     * @param result The result of the linting.
     * @param cached Whether the file was linted from cache.
     */
    onFileEnd?: (file: ParsedPath, result: AnyLinterResult, cached: boolean) => void;

    /**
     * Called when the whole linting process ends.
     */
    onCliEnd?: () => void;
}
