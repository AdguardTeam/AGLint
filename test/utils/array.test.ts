import { ArrayUtils } from "../../src/utils/array";

describe("Array utils", () => {
    test("isArrayOfStrings", () => {
        expect(ArrayUtils.isArrayOfStrings([1, 2, 3])).toBeFalsy();
        expect(ArrayUtils.isArrayOfStrings([1, "2", 3])).toBeFalsy();
        expect(ArrayUtils.isArrayOfStrings([null])).toBeFalsy();
        expect(ArrayUtils.isArrayOfStrings({})).toBeFalsy();
        expect(ArrayUtils.isArrayOfStrings(null)).toBeFalsy();

        expect(ArrayUtils.isArrayOfStrings(["a"])).toBeTruthy();
        expect(ArrayUtils.isArrayOfStrings(["a", "b", "c"])).toBeTruthy();
    });
});
