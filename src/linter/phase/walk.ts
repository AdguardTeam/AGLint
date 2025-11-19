// phase/walk.ts
import { type LinterRuntime } from '../core/runtime';

/**
 * Executes the AST traversal phase of linting.
 *
 * Invokes the walker to traverse the entire AST (including sub-ASTs)
 * and trigger all registered visitor callbacks from active rules.
 *
 * @param runtime The linter runtime environment with walker and visitors.
 *
 * @example
 * ```typescript
 * // After loading rules and setting up visitors
 * runWalk(runtime);
 * // All visitor callbacks have been invoked
 * // runtime.problems now contains all detected issues
 * ```
 */
export function runWalk(runtime: LinterRuntime) {
    const { debug } = runtime as any;
    const visitors = runtime.visitors.getVisitors();

    if (debug) {
        const selectorCount = Object.keys(visitors).length;
        debug.log(`Walking AST with ${selectorCount} registered selector(s)`);

        // Log registered selectors
        const selectors = Object.keys(visitors).slice(0, 10); // Show first 10
        if (selectors.length > 0) {
            debug.log(`Selectors: ${selectors.join(', ')}${selectorCount > 10 ? '...' : ''}`);
        }
    }

    const walkStart = Date.now();
    runtime.walker.walk(visitors);

    if (debug) {
        debug.log(`Walker traversed AST in ${Date.now() - walkStart}ms`);
    }
}
