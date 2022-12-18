import { CommentRuleType } from "../../../src/parser/comment/types";
import { PreProcessor, PreProcessorParser } from "../../../src/parser/comment/preprocessor";
import { RuleCategory } from "../../../src/parser/categories";
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
        // Valid pre-processors
        expect(PreProcessorParser.parse("!#endif")).toEqual(<PreProcessor>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.PreProcessor,
            name: "endif",
            params: undefined,
        });

        expect(PreProcessorParser.parse("!#include ../sections/ads.txt")).toEqual(<PreProcessor>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.PreProcessor,
            name: "include",
            params: "../sections/ads.txt",
        });

        expect(PreProcessorParser.parse("!#include    ")).toEqual(<PreProcessor>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.PreProcessor,
            name: "include",
            params: undefined,
        });

        expect(PreProcessorParser.parse("!#if (conditions)")).toEqual(<PreProcessor>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.PreProcessor,
            name: "if",
            params: "(conditions)",
        });

        expect(PreProcessorParser.parse("!#if      (conditions)")).toEqual(<PreProcessor>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.PreProcessor,
            name: "if",
            params: "(conditions)",
        });

        expect(PreProcessorParser.parse("!#safari_cb_affinity(content_blockers)")).toEqual(<PreProcessor>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.PreProcessor,
            // !#if is an operator, safari_cb_affinity is more of a "command" here
            name: "safari_cb_affinity(content_blockers)",
            params: undefined,
        });

        // If the parenthesis is open, do not split it in half along the space:
        expect(PreProcessorParser.parse("!#aaa(bbb ccc)")).toEqual(<PreProcessor>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.PreProcessor,
            name: "aaa(bbb ccc)",
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
