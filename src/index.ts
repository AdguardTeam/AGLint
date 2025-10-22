/**
 * @file Library entry point.
 */

import { version as importedVersion } from '../package.json';

export type { LinterConfig } from './linter/config';
export { Linter, type LinterResult, type LinterRunOptions } from './linter/linter';
export { LinterFixer, type LinterFixerResult, type LinterFixerRunOptions } from './linter/fixer';
export { LinterRuleSeverity } from './linter/rule';

export { CONFIG_FILE_NAMES } from './cli/config-file/config-file';
export { IGNORE_FILE_NAME } from './cli/constants';

export {
    type FileSystemAdapter,
    type FileStats,
    type GlobOptions,
    type FileChangeEvent,
    FileChangeType,
    type Disposable,
} from './utils/fs-adapter';

export { type PathAdapter, type ParsedPath, NodePathAdapter } from './utils/path-adapter';

export {
    type DirectoryNode,
    type IgnoreChainEntry,
    type ConfigChainEntry,
    type LinterTreeOptions,
    IgnoreMatcher,
    LinterTree,
} from './utils/tree-builder';

// We need this trick to avoid importing `package.json` in the types
const version = importedVersion;

export { version };
