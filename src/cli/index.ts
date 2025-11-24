export { CONFIG_FILE_NAMES } from './config-file/config-file';
export { IGNORE_FILE_NAME } from './constants';

export { type LinterConfigFile } from './config-file/config-file';

export {
    type FileSystemAdapter,
    type FileStats,
    type GlobOptions,
    type FileChangeEvent,
    FileChangeType,
    type Disposable,
    NodeFileSystemAdapter,
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

export {
    type PatternMatchOptions,
    type PatternMatchResult,
    matchPatterns,
    DEFAULT_IGNORE_PATTERNS,
} from './utils/pattern-matcher';

export {
    type ConfigResolverOptions,
    ConfigResolver,
} from './utils/config-resolver';

export {
    type ScannedFile,
    LinterFileScanner,
} from './utils/file-scanner';

export {
    type Logger,
    type ColorFormatter,
    type DebugOptions,
    Debug,
    ModuleDebug,
    createDebug,
} from '../utils/debug';

export { chalkColorFormatter } from './utils/debug-colors';
