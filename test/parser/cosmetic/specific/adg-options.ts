import { AdGuardModifierListParser } from "../../../../src/parser/cosmetic/specific/adg-options";

describe("AdGuardModifierListParser", () => {
    test("parse", async () => {
        // Empty
        expect(AdGuardModifierListParser.parse("")).toEqual({
            modifiers: [],
            rest: "",
        });

        // Valid cases (please note that modifier parser are tested in another test file)
        expect(AdGuardModifierListParser.parse("[$m1]example.com")).toEqual({
            modifiers: [
                {
                    modifier: "m1",
                },
            ],
            rest: "example.com",
        });

        expect(AdGuardModifierListParser.parse("[$m1,m2=v2]example.com")).toEqual({
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
            modifiers: [
                {
                    modifier: "m1",
                },
                {
                    modifier: "m2",
                    value: "v2",
                },
            ],
            rest: "",
        });

        // Spaces
        expect(AdGuardModifierListParser.parse("[$   path  =   /test  ]")).toEqual({
            modifiers: [
                {
                    modifier: "path",
                    value: "/test",
                },
            ],
            rest: "",
        });

        // Complicated case
        expect(
            AdGuardModifierListParser.parse(
                `[$path=/test,domain=/(^|.+\\.)example\\.(com|org)\\$/,modifier1]example.com,example.org`
            )
        ).toEqual({
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
        expect(AdGuardModifierListParser.parse("[")).toThrowError(
            /^Missing modifier marker "\$" at pattern/
        );

        expect(AdGuardModifierListParser.parse("[ ")).toThrowError(
            /^Missing modifier marker "\$" at pattern/
        );

        expect(AdGuardModifierListParser.parse("[m1]example.com")).toThrowError(
            /^Missing modifier marker "\$" at pattern/
        );

        expect(AdGuardModifierListParser.parse("[$m1example.com")).toThrowError(
            /^Missing closing bracket "]" at pattern/
        );

        expect(AdGuardModifierListParser.parse("[$]example.com")).toThrowError(
            /^No modifiers specified at pattern/
        );
        expect(AdGuardModifierListParser.parse("[$  ]example.com")).toThrowError(
            /^No modifiers specified at pattern/
        );
    });
});
