import { UBlockModifierListParser, UBO_MODIFIER_LIST_TYPE } from "../../../../src/parser/cosmetic/specific/ubo-options";

describe("UBlockModifierListParser", () => {
    test("parse", async () => {
        expect(UBlockModifierListParser.parse(":matches-path(/path).ad")).toEqual({
            type: UBO_MODIFIER_LIST_TYPE,
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
            type: UBO_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: "matches-path",
                    value: "/path",
                },
            ],
            rest: ".ad",
        });

        expect(UBlockModifierListParser.parse(":matches-path() .ad")).toEqual({
            type: UBO_MODIFIER_LIST_TYPE,
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
            type: UBO_MODIFIER_LIST_TYPE,
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
            type: UBO_MODIFIER_LIST_TYPE,
            modifiers: [],
            rest: ".ad:-abp-has(.something)",
        });

        expect(UBlockModifierListParser.parse("")).toEqual({
            type: UBO_MODIFIER_LIST_TYPE,
            modifiers: [],
            rest: "",
        });

        // trim
        expect(UBlockModifierListParser.parse("  ")).toEqual({
            type: UBO_MODIFIER_LIST_TYPE,
            modifiers: [],
            rest: "",
        });
    });

    test("generate", async () => {
        const parseAndGenerate = (raw: string) => {
            const ast = UBlockModifierListParser.parse(raw);

            if (ast) {
                return UBlockModifierListParser.generate(ast);
            }

            return null;
        };

        expect(parseAndGenerate(".ad:-abp-has(.something)")).toEqual(".ad:-abp-has(.something)");

        // ! Please note that this method "brings forward" the modifier pseudos (although in theory it makes
        // ! no sense to use e.g. matches-path "inside" the selector)
        expect(
            parseAndGenerate(
                ":matches-path(a) .ad:matches-path(b):matches-path(c) > .something:matches-path(d) > .advert"
            )
        ).toEqual(":matches-path(a):matches-path(b):matches-path(c):matches-path(d) .ad > .something > .advert");
    });
});
