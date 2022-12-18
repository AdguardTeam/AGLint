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
        return value.every((element) => typeof element === "string");
    }
}
