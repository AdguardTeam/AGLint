import { assert } from "superstruct";
import { linterConfigSchema, mergeConfigs } from "../../src/linter/config";

describe("Linter config", () => {
    test("mergeConfigs", () => {
        expect(
            mergeConfigs(
                {
                    rules: {
                        "rule-1": "off",
                        "rule-2": ["warn"],
                        "rule-3": "error",
                        "rule-4": ["error", { a: "b", c: [{ d: 1, e: "2" }] }, "aaa", NaN],
                    },
                },
                {
                    rules: {
                        "rule-1": "off",
                        "rule-5": ["warn", { a: 1, b: 2 }],
                    },
                }
            )
        ).toMatchObject({
            rules: {
                "rule-1": "off",
                "rule-2": ["warn"],
                "rule-3": "error",
                "rule-4": ["error", { a: "b", c: [{ d: 1, e: "2" }] }, "aaa", NaN],
                "rule-5": ["warn", { a: 1, b: 2 }],
            },
        });
    });

    test("check custom Superstruct validation", () => {
        // Valid cases
        expect(() => assert({}, linterConfigSchema)).not.toThrowError();

        expect(() => assert({ allowInlineConfig: true }, linterConfigSchema)).not.toThrowError();
        expect(() => assert({ allowInlineConfig: false }, linterConfigSchema)).not.toThrowError();

        expect(() => assert({ rules: {} }, linterConfigSchema)).not.toThrowError();
        expect(() =>
            assert(
                {
                    rules: {
                        "rule-1": "off",
                        "rule-2": ["warn"],
                        "rule-3": "error",
                        "rule-4": ["error", { a: "b", c: [{ d: 1, e: "2" }] }, "aaa", NaN],
                    },
                },
                linterConfigSchema
            )
        ).not.toThrowError();

        // Invalid cases
        expect(() => assert(null, linterConfigSchema)).toThrowError();

        expect(() => assert({ allowInlineConfig: "a" }, linterConfigSchema)).toThrowError();
        expect(() => assert({ allowInlineConfig: 2 }, linterConfigSchema)).toThrowError();

        expect(() =>
            assert(
                {
                    rules: "aaa",
                },
                linterConfigSchema
            )
        ).toThrowError();
    });
});
