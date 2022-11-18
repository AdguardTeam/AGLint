/* eslint-disable max-len */
import { UBlockModifierListParser, UBO_MODIFIER_LIST_TYPE } from "../../../../src/parser/cosmetic/specific/ubo-options";
import { EMPTY } from "../../../../src/utils/constants";

describe("UBlockModifierListParser", () => {
    test("hasUblockModifierIndicators", async () => {
        expect(UBlockModifierListParser.hasUblockModifierIndicators(":matches-path(/path).ad")).toBe(true);
        expect(
            UBlockModifierListParser.hasUblockModifierIndicators(":matches-path(/path).ad:matches-path(/path)")
        ).toBe(true);

        expect(UBlockModifierListParser.hasUblockModifierIndicators(":matches-path2(/path).ad")).toBe(false);

        expect(UBlockModifierListParser.hasUblockModifierIndicators(".ad")).toBe(false);
    });

    test("parse", async () => {
        expect(UBlockModifierListParser.parse(":matches-path(/path).ad")).toEqual({
            type: UBO_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: "matches-path",
                    value: "/path",
                    not: false,
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
                    not: false,
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
                    not: false,
                },
            ],
            rest: ".ad",
        });

        expect(UBlockModifierListParser.parse(":matches-path() .ad")).toEqual({
            type: UBO_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: "matches-path",
                    value: EMPTY,
                    not: false,
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
                    not: false,
                },
                {
                    modifier: "matches-path",
                    value: "b",
                    not: false,
                },
                {
                    modifier: "matches-path",
                    value: "c",
                    not: false,
                },
                {
                    modifier: "matches-path",
                    value: "d",
                    not: false,
                },
            ],
            rest: ".ad > .something > .advert",
        });

        // not
        expect(UBlockModifierListParser.parse(":not(:matches-path(/path)) .ad")).toEqual({
            type: UBO_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: "matches-path",
                    value: "/path",
                    not: true,
                },
            ],
            rest: ".ad",
        });

        expect(
            UBlockModifierListParser.parse(
                ":not(:matches-path(a)) .ad:matches-path(b):not(:matches-path(c)) > .something:matches-path(d) > .advert"
            )
        ).toEqual({
            type: UBO_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: "matches-path",
                    value: "a",
                    not: true,
                },
                {
                    modifier: "matches-path",
                    value: "b",
                    not: false,
                },
                {
                    modifier: "matches-path",
                    value: "c",
                    not: true,
                },
                {
                    modifier: "matches-path",
                    value: "d",
                    not: false,
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

        expect(UBlockModifierListParser.parse(EMPTY)).toEqual({
            type: UBO_MODIFIER_LIST_TYPE,
            modifiers: [],
            rest: EMPTY,
        });

        // trim
        expect(UBlockModifierListParser.parse("  ")).toEqual({
            type: UBO_MODIFIER_LIST_TYPE,
            modifiers: [],
            rest: EMPTY,
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

        expect(
            parseAndGenerate(
                ":not(:matches-path(a)) .ad:matches-path(b):not(:matches-path(c)) > .something:matches-path(d) > .advert"
            )
        ).toEqual(
            ":not(:matches-path(a)):matches-path(b):not(:matches-path(c)):matches-path(d) .ad > .something > .advert"
        );
    });
});
