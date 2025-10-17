// phase/walk.ts
import { type LinterRuntime } from '../core/runtime';

export function runWalk(rt: LinterRuntime) {
    rt.walker.walk(rt.visitors.getVisitors());
}
