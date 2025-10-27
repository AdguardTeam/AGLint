import { type ParsedPath } from 'node:path';

import { type LinterConfig } from '../../linter/config';
import { type AnyLinterResult } from '../../linter/fixer';
import { type LinterCliConfig } from '../cli-options';

/**
 * Interface for CLI reporters that handle linting progress and results output.
 *
 * Reporters can hook into various stages of the linting process to provide
 * feedback to users in different formats (console, JSON, etc.).
 */
export interface LinterCliReporter {
    /**
     * Called when the CLI linting process begins.
     *
     * @param cliOptions Complete CLI configuration.
     */
    onCliStart?: (cliOptions: LinterCliConfig) => void;

    /**
     * Called when linting of a single file begins.
     *
     * @param file Parsed file path information.
     * @param config Linter configuration for this file.
     */
    onFileStart?: (file: ParsedPath, config: LinterConfig) => void;

    /**
     * Called when linting of a single file completes.
     *
     * @param file Parsed file path information.
     * @param result Linting result with problems and counts.
     * @param cached Whether the result was retrieved from cache.
     */
    onFileEnd?: (file: ParsedPath, result: AnyLinterResult, cached: boolean) => void;

    /**
     * Called when the entire CLI linting process completes.
     *
     * Use this to output final summaries or statistics.
     */
    onCliEnd?: () => void;
}
