/**
 * @file Library entry point.
 */

import { version as importedVersion } from '../package.json';

// We need this trick to avoid importing `package.json` in the types
const version = importedVersion;

export { version };

// Export debug utilities for external use (e.g., VS Code extensions)
export {
    type Logger,
    type ColorFormatter,
    type DebugOptions,
    Debug,
    ModuleDebug,
    createDebug,
} from './utils/debug';
