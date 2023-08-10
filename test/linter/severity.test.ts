import { assert } from 'superstruct';

import { getSeverity, isSeverity, severity } from '../../src/linter/severity';

describe('Linter severity', () => {
    test('getSeverity', () => {
        // Valid cases
        expect(getSeverity('off')).toEqual(0);
        expect(getSeverity('warn')).toEqual(1);
        expect(getSeverity('error')).toEqual(2);
        expect(getSeverity('fatal')).toEqual(3);

        expect(getSeverity(0)).toEqual(0);
        expect(getSeverity(1)).toEqual(1);
        expect(getSeverity(2)).toEqual(2);
        expect(getSeverity(3)).toEqual(3);
    });

    test('isSeverity', () => {
        // Valid cases
        expect(isSeverity('off')).toBeTruthy();
        expect(isSeverity('warn')).toBeTruthy();
        expect(isSeverity('error')).toBeTruthy();
        expect(isSeverity('fatal')).toBeTruthy();

        expect(isSeverity(0)).toBeTruthy();
        expect(isSeverity(1)).toBeTruthy();
        expect(isSeverity(2)).toBeTruthy();
        expect(isSeverity(3)).toBeTruthy();

        // Invalid cases
        expect(isSeverity('off2')).toBeFalsy();
        expect(isSeverity('ofF')).toBeFalsy();
        expect(isSeverity('aaa')).toBeFalsy();

        expect(isSeverity(-1)).toBeFalsy();
        expect(isSeverity(4)).toBeFalsy();
        expect(isSeverity(5)).toBeFalsy();

        expect(isSeverity(null)).toBeFalsy();
    });

    test('check custom Superstruct validation', () => {
        // Valid cases
        expect(() => assert('off', severity())).not.toThrowError();
        expect(() => assert('warn', severity())).not.toThrowError();
        expect(() => assert('error', severity())).not.toThrowError();
        expect(() => assert('fatal', severity())).not.toThrowError();

        expect(() => assert(0, severity())).not.toThrowError();
        expect(() => assert(1, severity())).not.toThrowError();
        expect(() => assert(2, severity())).not.toThrowError();
        expect(() => assert(3, severity())).not.toThrowError();

        // Invalid cases
        expect(() => assert('off2', severity())).toThrowError();
        expect(() => assert('ofF', severity())).toThrowError();
        expect(() => assert('aaa', severity())).toThrowError();

        expect(() => assert(-1, severity())).toThrowError();
        expect(() => assert(4, severity())).toThrowError();
        expect(() => assert(5, severity())).toThrowError();
    });
});
