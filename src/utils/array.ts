/**
 * @file Utility functions for arrays.
 */

/**
 * Array helpers.
 */
export class ArrayUtils {
    /**
     * Check if a value is an array of strings.
     *
     * @param value - The value to check
     * @returns `true` if the value is an array of strings, `false` otherwise
     */
    public static isArrayOfStrings(value: unknown): value is string[] {
        // Check if the value is an array
        if (!Array.isArray(value)) {
            return false;
        }

        // Check if every element in the array is a string
        return value.every((element) => typeof element === 'string');
    }

    /**
     * Get the intersection of two arrays.
     *
     * @param a First array
     * @param b Second array
     * @returns Intersection of the two arrays
     */
    public static getIntersection<T>(a: T[], b: T[]): T[] {
        const intersection = new Set<T>();
        const bSet = new Set(b);

        // Iterate over the first array
        for (const element of a) {
            // Check if the element is in the second array
            if (bSet.has(element)) {
                intersection.add(element);
            }
        }

        return Array.from(intersection);
    }
}
