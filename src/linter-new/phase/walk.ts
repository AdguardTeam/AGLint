// phase/walk.ts
import { type LinterRuntime } from '../core/runtime';

export function runWalk(runtime: LinterRuntime) {
    runtime.walker.walk(runtime.visitors.getVisitors());
}
