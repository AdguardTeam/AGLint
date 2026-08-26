/**
 * @file Library entry point.
 */

import { version } from './version';

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
