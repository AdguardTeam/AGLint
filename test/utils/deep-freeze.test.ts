import { describe, expect, it } from 'vitest';

import { deepFreeze } from '../../src/utils/deep-freeze';

describe('deepFreeze', () => {
    it('returns the same reference and freezes the root object', () => {
        const obj = { a: 1 };
        const frozen = deepFreeze(obj);
        expect(frozen).toBe(obj);
        expect(Object.isFrozen(obj)).toBe(true);
    });

    it('deeply freezes nested plain objects', () => {
        const obj: any = { a: { b: { c: 1 } } };
        deepFreeze(obj);

        expect(Object.isFrozen(obj)).toBe(true);
        expect(Object.isFrozen(obj.a)).toBe(true);
        expect(Object.isFrozen(obj.a.b)).toBe(true);

        // mutations should throw in strict mode
        expect(() => { obj.a.b.c = 2; }).toThrow(TypeError);
        expect(obj.a.b.c).toBe(1);
    });

    it('freezes arrays and their elements recursively', () => {
        const arr: any = [{ x: 1 }, 2, [3, { y: 4 }]];
        deepFreeze(arr);

        expect(Object.isFrozen(arr)).toBe(true);
        expect(Object.isFrozen(arr[0])).toBe(true);
        expect(Object.isFrozen(arr[2])).toBe(true);
        expect(Object.isFrozen(arr[2][1])).toBe(true);

        expect(() => { arr.push(5); }).toThrow(TypeError);
        expect(() => { arr[0].x = 10; }).toThrow(TypeError);
        expect(() => { arr[2][1].y = 9; }).toThrow(TypeError);
    });

    it('freezes functions and their attached properties recursively', () => {
        const fn: any = (() => {}) as any; // arrow fn avoids fn.prototype cycle
        fn.meta = { n: 1 };
        fn.list = [{ v: 2 }];

        deepFreeze(fn);

        expect(Object.isFrozen(fn)).toBe(true);
        expect(Object.isFrozen(fn.meta)).toBe(true);
        expect(Object.isFrozen(fn.list)).toBe(true);
        expect(Object.isFrozen(fn.list[0])).toBe(true);

        expect(() => { fn.newProp = 1; }).toThrow(TypeError);
        expect(() => { fn.meta.n = 2; }).toThrow(TypeError);
        expect(() => { fn.list[0].v = 3; }).toThrow(TypeError);
    });

    it('freezes symbol-keyed properties as well (Reflect.ownKeys)', () => {
        const sym = Symbol('s');
        const obj: any = { [sym]: { z: 1 } };
        deepFreeze(obj);

        expect(Object.isFrozen(obj)).toBe(true);
        expect(Object.isFrozen(obj[sym])).toBe(true);
        expect(() => { obj[sym].z = 2; }).toThrow(TypeError);
        expect(obj[sym].z).toBe(1);
    });

    it('freezes non-enumerable properties (Reflect.ownKeys includes them)', () => {
        const obj: any = {};
        Object.defineProperty(obj, 'hidden', {
            value: { inner: 1 },
            enumerable: false,
            configurable: true,
            writable: true,
        });

        deepFreeze(obj);

        expect(Object.isFrozen(obj)).toBe(true);
        expect(Object.isFrozen(obj.hidden)).toBe(true);
        expect(() => { obj.hidden.inner = 2; }).toThrow(TypeError);
        expect(obj.hidden.inner).toBe(1);
    });

    it('freezes Date objects (though mutator methods can still change internal time value)', () => {
        const d = new Date('2020-01-01T00:00:00Z');
        const frozen = deepFreeze({ d }).d;

        expect(Object.isFrozen(frozen)).toBe(true);

        // NOTE: Date mutators can still change internal [[DateValue]] even on a frozen object.
        const before = frozen.getFullYear();
        frozen.setFullYear(2021); // allowed by JS spec
        const after = frozen.getFullYear();

        expect(after).toBe(before + 1);
    });

    it('handles empty objects/arrays without issues', () => {
        const o = {};
        const a: any[] = [];
        deepFreeze(o);
        deepFreeze(a);
        expect(Object.isFrozen(o)).toBe(true);
        expect(Object.isFrozen(a)).toBe(true);
        expect(() => { a.push(1); }).toThrow(TypeError);
    });

    it('freezing the same object twice is idempotent', () => {
        const obj: any = { a: { b: 1 } };
        deepFreeze(obj);
        expect(Object.isFrozen(obj)).toBe(true);
        expect(Object.isFrozen(obj.a)).toBe(true);

        // calling again should not throw and keeps frozen
        deepFreeze(obj);
        expect(Object.isFrozen(obj)).toBe(true);
        expect(Object.isFrozen(obj.a)).toBe(true);
    });

    it('documents the limitation: circular references cause a stack overflow (throws)', () => {
        const obj: any = {};
        obj.self = obj; // cycle
        expect(() => deepFreeze(obj)).toThrow(); // RangeError: Maximum call stack size exceeded
    });
});
