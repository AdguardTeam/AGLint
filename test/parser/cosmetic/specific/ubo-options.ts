import { uBlockModifierListParser } from "../../../../src/parser/cosmetic/specific/ubo-options";

describe("uBlockModifierListParser", () => {
    test("parse", async () => {
        expect(uBlockModifierListParser.parse(":matches-path(/path).ad")).toEqual({
            modifiers: [
                {
                    modifier: "matches-path",
                    value: "/path",
                },
            ],
            rest: ".ad",
        });

        // trim
        expect(uBlockModifierListParser.parse(":matches-path(/path) .ad")).toEqual({
            modifiers: [
                {
                    modifier: "matches-path",
                    value: "/path",
                },
            ],
            rest: ".ad",
        });

        expect(uBlockModifierListParser.parse(":matches-path() .ad")).toEqual({
            modifiers: [
                {
                    modifier: "matches-path",
                    value: "",
                },
            ],
            rest: ".ad",
        });

        expect(
            uBlockModifierListParser.parse(
                ":matches-path(a) .ad:matches-path(b):matches-path(c) > .something:matches-path(d) > .advert"
            )
        ).toEqual({
            modifiers: [
                {
                    modifier: "matches-path",
                    value: "a",
                },
                {
                    modifier: "matches-path",
                    value: "b",
                },
                {
                    modifier: "matches-path",
                    value: "c",
                },
                {
                    modifier: "matches-path",
                    value: "d",
                },
            ],
            rest: ".ad > .something > .advert",
        });

        // No uBO modifier
        expect(uBlockModifierListParser.parse(".ad:-abp-has(.something)")).toEqual({
            modifiers: [],
            rest: ".ad:-abp-has(.something)",
        });

        expect(uBlockModifierListParser.parse("")).toEqual({
            modifiers: [],
            rest: "",
        });

        // trim
        expect(uBlockModifierListParser.parse("  ")).toEqual({
            modifiers: [],
            rest: "",
        });
    });
});
