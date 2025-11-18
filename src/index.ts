/**
 * @file Library entry point.
 */

import { version as importedVersion } from '../package.json';

// We need this trick to avoid importing `package.json` in the types
const version = importedVersion;

export { version };
