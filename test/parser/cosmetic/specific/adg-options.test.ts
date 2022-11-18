/* eslint-disable max-len */
import {
    AdGuardModifierListParser,
    ADG_MODIFIER_LIST_TYPE,
} from "../../../../src/parser/cosmetic/specific/adg-options";
import { EMPTY } from "../../../../src/utils/constants";

describe("AdGuardModifierListParser", () => {
    test("parse", async () => {
        // Empty
        expect(AdGuardModifierListParser.parse(EMPTY)).toEqual({
            type: ADG_MODIFIER_LIST_TYPE,
            modifiers: [],
            rest: EMPTY,
        });

        // Valid cases (please note that modifier parser are tested in another test file)
        expect(AdGuardModifierListParser.parse("[$m1]example.com")).toEqual({
            type: ADG_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: "m1",
                },
            ],
            rest: "example.com",
        });

        expect(AdGuardModifierListParser.parse("[$m1,m2=v2]example.com")).toEqual({
            type: ADG_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: "m1",
                },
                {
                    modifier: "m2",
                    value: "v2",
                },
            ],
            rest: "example.com",
        });

        expect(AdGuardModifierListParser.parse("[$m1,m2=v2]")).toEqual({
            type: ADG_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: "m1",
                },
                {
                    modifier: "m2",
                    value: "v2",
                },
            ],
            rest: EMPTY,
        });

        // Spaces
        expect(AdGuardModifierListParser.parse("[$   path  =   /test  ]")).toEqual({
            type: ADG_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: "path",
                    value: "/test",
                },
            ],
            rest: EMPTY,
        });

        // Complicated case
        expect(
            AdGuardModifierListParser.parse(
                `[$path=/test,domain=/(^|.+\\.)example\\.(com|org)\\$/,modifier1]example.com,example.org`
            )
        ).toEqual({
            type: ADG_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: "path",
                    value: "/test",
                },
                {
                    modifier: "domain",
                    value: "/(^|.+\\.)example\\.(com|org)\\$/",
                },
                {
                    modifier: "modifier1",
                },
            ],
            rest: "example.com,example.org",
        });

        // Invalid cases
        expect(() => AdGuardModifierListParser.parse("[")).toThrowError(/^Missing modifier marker "\$" at pattern/);

        expect(() => AdGuardModifierListParser.parse("[ ")).toThrowError(/^Missing modifier marker "\$" at pattern/);

        expect(() => AdGuardModifierListParser.parse("[m1]example.com")).toThrowError(
            /^Missing modifier marker "\$" at pattern/
        );

        expect(() => AdGuardModifierListParser.parse("[$m1example.com")).toThrowError(
            /^Missing closing bracket "]" at pattern/
        );

        expect(() => AdGuardModifierListParser.parse("[$]example.com")).toThrowError(
            /^No modifiers specified at pattern/
        );
        expect(() => AdGuardModifierListParser.parse("[$  ]example.com")).toThrowError(
            /^No modifiers specified at pattern/
        );
    });

    test("generate", async () => {
        const parseAndGenerate = (raw: string) => {
            const ast = AdGuardModifierListParser.parse(raw);

            if (ast) {
                return AdGuardModifierListParser.generate(ast);
            }

            return null;
        };

        // Please note that this generation does not affect the classic domain list, only the modifier list is generated.
        expect(
            parseAndGenerate("[$path=/test,domain=/(^|.+\\.)example\\.(com|org)\\$/,modifier1]example.com,example.org")
        ).toEqual("[$path=/test,domain=/(^|.+\\.)example\\.(com|org)\\$/,modifier1]");
    });
});
