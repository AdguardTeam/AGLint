/**
 * @file AGLint version.
 */

import pkg from '../package.json';

// ! Notice:
// Don't export version from package.json directly, because if you run
// `tsc` in the root directory, it will generate `dist/types/src/version.d.ts`
// with wrong relative path to `package.json`. So we need this little "hack"
//
// package.json intentionally has no "version" field in the repository —
// CI injects the release version before building the package, so published
// builds always carry the real version. Local/dev builds fall back to a
// placeholder.
const version = (pkg as { version?: string }).version ?? '0.0.0-dev';

export { version };
