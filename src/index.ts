/**
 * @file Library entry point.
 */

import { version as importedVersion } from '../package.json';

export { Linter, type LinterResult, type LinterRunOptions } from './linter/linter';
export { LinterFixer, type LinterFixerResult, type LinterFixerRunOptions } from './linter/fixer';

export { CONFIG_FILE_NAMES } from './cli/config-file/config-file';
export {
    getConfigFileFormat,
    loadConfigFileFlattened,
    parseConfigFileContent,
    resolveConfigForDir,
    type ConfigEnv,
    type FlattenCache,
    type FsLike,
    type ParserLike,
    type PathLike,
    type PresetResolver,
} from './cli/config-file/resolve';

// We need this trick to avoid importing `package.json` in the types
const version = importedVersion;

export { version };
