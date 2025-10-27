/**
 * @file Library entry point.
 */

import { version as importedVersion } from '../package.json';

export type { LinterConfig } from './linter/config';
export { Linter, type LinterResult, type LinterRunOptions } from './linter/linter';
export { LinterFixer, type LinterFixerResult, type LinterFixerRunOptions } from './linter/fixer';
export { LinterRuleSeverity } from './linter/rule';
export { type LinterProblem, type LinterSuggestion } from './linter/linter-problem';

export { CONFIG_FILE_NAMES } from './cli/config-file/config-file';
export { IGNORE_FILE_NAME } from './cli/constants';

export { defaultSubParsers } from './linter/default-subparsers';

export { type LinterFixCommand } from './linter/source-code/fix-generator';
// eslint-disable-next-line max-len
export { type LinterPosition, type LinterPositionRange, type LinterOffsetRange } from './linter/source-code/source-code';

export {
    type FileSystemAdapter,
    type FileStats,
    type GlobOptions,
    type FileChangeEvent,
    FileChangeType,
    type Disposable,
    NodeFileSystemAdapter,
} from './cli/utils/fs-adapter';

export { type PathAdapter, type ParsedPath, NodePathAdapter } from './cli/utils/path-adapter';

export {
    type DirectoryNode,
    type IgnoreChainEntry,
    type ConfigChainEntry,
    type LinterTreeOptions,
    IgnoreMatcher,
    LinterTree,
} from './cli/utils/tree-builder';

export {
    type PatternMatchOptions,
    type PatternMatchResult,
    matchPatterns,
    DEFAULT_IGNORE_PATTERNS,
} from './cli/utils/pattern-matcher';

export {
    type ConfigResolverOptions,
    ConfigResolver,
} from './cli/utils/config-resolver';

export {
    type ScannedFile,
    LinterFileScanner,
} from './cli/utils/file-scanner';

// We need this trick to avoid importing `package.json` in the types
const version = importedVersion;

export { version };
