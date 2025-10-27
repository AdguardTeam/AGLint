// phase/walk.ts
import { type LinterRuntime } from '../core/runtime';

/**
 * Executes the AST traversal phase of linting.
 *
 * Invokes the walker to traverse the entire AST (including sub-ASTs)
 * and trigger all registered visitor callbacks from active rules.
 *
 * @param runtime - The linter runtime environment with walker and visitors
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
    runtime.walker.walk(runtime.visitors.getVisitors());
}
