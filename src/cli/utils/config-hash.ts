import { hash as hashObject } from 'ohash';

import { type LinterConfig } from '../../linter/config';

/**
 * Computes a hash of linter configuration.
 *
 * @param config Linter configuration to hash.
 *
 * @returns Hash string.
 *
 * @example
 * ```typescript
 * const config = { syntax: 'adblock', rules: {} };
 * const hash = getLinterConfigHash(config);
 * console.log(hash); // "abc123..."
 * ```
 */
export function getLinterConfigHash(config: LinterConfig): string {
    return hashObject(config);
}
