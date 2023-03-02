import { ArrayUtils } from '../../src/utils/array';

describe('Array utils', () => {
    test('isArrayOfStrings', () => {
        expect(ArrayUtils.isArrayOfStrings([1, 2, 3])).toBeFalsy();
        expect(ArrayUtils.isArrayOfStrings([1, '2', 3])).toBeFalsy();
        expect(ArrayUtils.isArrayOfStrings([null])).toBeFalsy();
        expect(ArrayUtils.isArrayOfStrings({})).toBeFalsy();
        expect(ArrayUtils.isArrayOfStrings(null)).toBeFalsy();

        expect(ArrayUtils.isArrayOfStrings(['a'])).toBeTruthy();
        expect(ArrayUtils.isArrayOfStrings(['a', 'b', 'c'])).toBeTruthy();
    });

    test('getIntersection', () => {
        // No intersection
        expect(ArrayUtils.getIntersection([1, 2], [3, 4])).toEqual([]);

        // Intersection with no duplicates
        expect(ArrayUtils.getIntersection([1, 2], [2, 3])).toEqual([2]);
        expect(ArrayUtils.getIntersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
        expect(ArrayUtils.getIntersection([1, 2, 3, 4], [2, 3])).toEqual([2, 3]);

        // Intersection with duplicates
        expect(ArrayUtils.getIntersection([1, 2, 2, 3], [2, 2, 3, 4])).toEqual([2, 3]);

        // Same array should return itself
        expect(ArrayUtils.getIntersection([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);

        // Empty arrays
        expect(ArrayUtils.getIntersection([], [])).toEqual([]);
        expect(ArrayUtils.getIntersection([1, 2, 3], [])).toEqual([]);
        expect(ArrayUtils.getIntersection([], [1, 2, 3])).toEqual([]);

        // Non-numeric arrays
        expect(ArrayUtils.getIntersection(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual(['b', 'c']);
        expect(ArrayUtils.getIntersection(['a', 'b', 'c'], ['b', 'c', 'd', 'e'])).toEqual(['b', 'c']);
    });
});
