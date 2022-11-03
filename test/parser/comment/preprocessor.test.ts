import { IPreProcessor, PreProcessorParser } from "../../../src/parser/comment/preprocessor";
import { RuleCategories } from "../../../src/parser/common";
import { AdblockSyntax } from "../../../src/utils/adblockers";
import { EMPTY, SPACE } from "../../../src/utils/constants";

describe("PreProcessorParser", () => {
    test("isPreProcessor", () => {
        // Invalid
        expect(PreProcessorParser.isPreProcessor(EMPTY)).toBe(false);
        expect(PreProcessorParser.isPreProcessor(SPACE)).toBe(false);

        expect(PreProcessorParser.isPreProcessor("!")).toBe(false);
        expect(PreProcessorParser.isPreProcessor("!##")).toBe(false);
        expect(PreProcessorParser.isPreProcessor("##")).toBe(false);
    });

    test("parse", () => {
        // Valid agents
        expect(PreProcessorParser.parse("!#endif")).toEqual(<IPreProcessor>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: "PreProcessor",
            name: "endif",
            params: undefined,
        });

        expect(PreProcessorParser.parse("!#include ../sections/ads.txt")).toEqual(<IPreProcessor>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: "PreProcessor",
            name: "include",
            params: "../sections/ads.txt",
        });

        expect(PreProcessorParser.parse("!#include    ")).toEqual(<IPreProcessor>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: "PreProcessor",
            name: "include",
            params: undefined,
        });
    });

    test("generate", () => {
        const parseAndGenerate = (raw: string) => {
            const ast = PreProcessorParser.parse(raw);

            if (ast) {
                return PreProcessorParser.generate(ast);
            }

            return null;
        };

        expect(parseAndGenerate("!#endif")).toEqual("!#endif");

        expect(parseAndGenerate("!#include ../sections/ads.txt")).toEqual("!#include ../sections/ads.txt");

        expect(parseAndGenerate("!#safari_cb_affinity(content_blockers)")).toEqual(
            "!#safari_cb_affinity(content_blockers)"
        );
    });
});
