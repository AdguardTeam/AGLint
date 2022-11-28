import { ModifierList, ModifierListParser, MODIFIER_LIST_TYPE } from "../../../src/parser/common/modifier-list";
import { EMPTY, SPACE } from "../../../src/utils/constants";

describe("ModifierListParser", () => {
    test("parse", () => {
        // Empty modifiers
        expect(ModifierListParser.parse(EMPTY)).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [],
        });
        expect(ModifierListParser.parse(SPACE)).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [],
        });

        // Valid modifiers
        expect(ModifierListParser.parse("modifier1")).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: "modifier1" }],
        });

        expect(ModifierListParser.parse("modifier1,modifier2")).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: "modifier1" }, { modifier: "modifier2" }],
        });

        expect(ModifierListParser.parse("modifier1, modifier2")).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: "modifier1" }, { modifier: "modifier2" }],
        });

        expect(ModifierListParser.parse("modifier1=value1")).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: "modifier1", value: "value1" }],
        });

        expect(ModifierListParser.parse("modifier1 = value1")).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: "modifier1", value: "value1" }],
        });

        expect(ModifierListParser.parse("   modifier1   =    value1       ")).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: "modifier1", value: "value1" }],
        });

        expect(ModifierListParser.parse("modifier1,modifier2=value2")).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: "modifier1" }, { modifier: "modifier2", value: "value2" }],
        });

        expect(ModifierListParser.parse("modifier1=value1,modifier2=value2")).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                { modifier: "modifier1", value: "value1" },
                { modifier: "modifier2", value: "value2" },
            ],
        });

        // Escaped separator comma
        // eslint-disable-next-line prettier/prettier
        expect(ModifierListParser.parse("modifier1=a\\,b\\,c,modifier2=value2")).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                { modifier: "modifier1", value: "a\\,b\\,c" },
                { modifier: "modifier2", value: "value2" },
            ],
        });

        expect(
            ModifierListParser.parse(
                "path=/\\/(sub1|sub2)\\/page\\.html/,replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/\\$1<\\/VAST>/i"
            )
        ).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: "path",
                    value: "/\\/(sub1|sub2)\\/page\\.html/",
                },
                {
                    modifier: "replace",
                    value: "/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/\\$1<\\/VAST>/i",
                },
            ],
        });
    });

    test("generate", () => {
        const parseAndGenerate = (raw: string) => {
            const ast = ModifierListParser.parse(raw);

            if (ast) {
                return ModifierListParser.generate(ast);
            }

            return null;
        };

        expect(parseAndGenerate("modifier1")).toEqual("modifier1");
        expect(parseAndGenerate("modifier1=value1")).toEqual("modifier1=value1");

        expect(parseAndGenerate("modifier1=value1,modifier2")).toEqual("modifier1=value1,modifier2");

        expect(parseAndGenerate("modifier1,modifier2=value2")).toEqual("modifier1,modifier2=value2");

        expect(parseAndGenerate("modifier1,modifier2")).toEqual("modifier1,modifier2");

        expect(parseAndGenerate("modifier1=value1,modifier2=value2")).toEqual("modifier1=value1,modifier2=value2");

        expect(
            parseAndGenerate(
                "path=/\\/(sub1|sub2)\\/page\\.html/,replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/\\$1<\\/VAST>/i"
            )
        ).toEqual("path=/\\/(sub1|sub2)\\/page\\.html/,replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/\\$1<\\/VAST>/i");
    });
});
