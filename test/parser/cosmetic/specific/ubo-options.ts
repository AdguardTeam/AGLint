import { UBlockModifierListParser } from "../../../../src/parser/cosmetic/specific/ubo-options";

describe("UBlockModifierListParser", () => {
    test("parse", async () => {
        expect(UBlockModifierListParser.parse(":matches-path(/path).ad")).toEqual({
            modifiers: [
                {
                    modifier: "matches-path",
                    value: "/path",
                },
            ],
            rest: ".ad",
        });

        // trim
        expect(UBlockModifierListParser.parse(":matches-path(/path) .ad")).toEqual({
            modifiers: [
                {
                    modifier: "matches-path",
                    value: "/path",
                },
            ],
            rest: ".ad",
        });

        expect(UBlockModifierListParser.parse(":matches-path() .ad")).toEqual({
            modifiers: [
                {
                    modifier: "matches-path",
                    value: "",
                },
            ],
            rest: ".ad",
        });

        expect(
            UBlockModifierListParser.parse(
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
        expect(UBlockModifierListParser.parse(".ad:-abp-has(.something)")).toEqual({
            modifiers: [],
            rest: ".ad:-abp-has(.something)",
        });

        expect(UBlockModifierListParser.parse("")).toEqual({
            modifiers: [],
            rest: "",
        });

        // trim
        expect(UBlockModifierListParser.parse("  ")).toEqual({
            modifiers: [],
            rest: "",
        });
    });
});
