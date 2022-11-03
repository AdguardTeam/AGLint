import { CommentParser } from "../../../src/parser/comment/comment";
import { CommentRuleType } from "../../../src/parser/comment/common";
import { IMetadata } from "../../../src/parser/comment/metadata";
import { RuleCategories } from "../../../src/parser/common";
import { AdblockSyntax } from "../../../src/utils/adblockers";

describe("CommentParser", () => {
    test("isComment", () => {
        // Empty
        expect(CommentParser.isComment("")).toBe(false);
        expect(CommentParser.isComment(" ")).toBe(false);

        // Begins with !
        expect(CommentParser.isComment("!")).toBe(true);
        expect(CommentParser.isComment("!!")).toBe(true);
        expect(CommentParser.isComment("!comment")).toBe(true);
        expect(CommentParser.isComment("! comment")).toBe(true);
        expect(CommentParser.isComment("!+comment")).toBe(true);
        expect(CommentParser.isComment("!#comment")).toBe(true);
        expect(CommentParser.isComment("!#########################")).toBe(true);
        expect(CommentParser.isComment("! #########################")).toBe(true);

        // Begins with #
        expect(CommentParser.isComment("#")).toBe(true);
        expect(CommentParser.isComment("##")).toBe(true);
        expect(CommentParser.isComment("# #")).toBe(true);
        expect(CommentParser.isComment("#comment")).toBe(true);
        expect(CommentParser.isComment("# comment")).toBe(true);
        expect(CommentParser.isComment("#+comment")).toBe(true);
        expect(CommentParser.isComment("#########################")).toBe(true);
        expect(CommentParser.isComment("# ########################")).toBe(true);

        // Cosmetic rules (also begins with #)
        expect(CommentParser.isComment("##.selector")).toBe(false);
        expect(CommentParser.isComment("#@#.selector")).toBe(false);
        expect(CommentParser.isComment("#%#//scriptlet('scriptlet')")).toBe(false);

        // Adblock agents
        expect(CommentParser.isComment("[Adblock Plus 2.0]")).toBe(true);
        expect(CommentParser.isComment("[Adblock]")).toBe(true);
        expect(CommentParser.isComment("[Adblock Plus 2.0; AdGuard]")).toBe(true);
        expect(CommentParser.isComment("[Adblock Plus 2.0; AdGuard 1.0]")).toBe(true);
        expect(CommentParser.isComment("[uBlock]")).toBe(true);
        expect(CommentParser.isComment("[uBlock Origin]")).toBe(true);
    });

    test("parse", () => {
        // Empty / not comment
        expect(CommentParser.parse("")).toBe(null);
        expect(CommentParser.parse(" ")).toBe(null);
        expect(CommentParser.parse("##.ad")).toBe(null);
        expect(CommentParser.parse("#@#.ad")).toBe(null);

        // Agents
        expect(CommentParser.parse("[]")).toEqual({
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [],
        });

        expect(CommentParser.parse("[Adblock Plus 2.0]")).toEqual({
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "Adblock Plus",
                    version: "2.0",
                },
            ],
        });

        expect(CommentParser.parse("[AdGuard]")).toEqual({
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "AdGuard",
                },
            ],
        });

        // Hints
        expect(CommentParser.parse("!+ NOT_OPTIMIZED")).toEqual({
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.AdGuard,
            type: CommentRuleType.Hint,
            hints: [
                {
                    name: "NOT_OPTIMIZED",
                    params: [],
                },
            ],
        });

        expect(CommentParser.parse("!+NOT_OPTIMIZED")).toEqual({
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.AdGuard,
            type: CommentRuleType.Hint,
            hints: [
                {
                    name: "NOT_OPTIMIZED",
                    params: [],
                },
            ],
        });

        expect(CommentParser.parse("!+ NOT_OPTIMIZED PLATFORM(windows, mac) NOT_PLATFORM(android, ios)")).toEqual({
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.AdGuard,
            type: CommentRuleType.Hint,
            hints: [
                {
                    name: "NOT_OPTIMIZED",
                    params: [],
                },
                {
                    name: "PLATFORM",
                    params: ["windows", "mac"],
                },
                {
                    name: "NOT_PLATFORM",
                    params: ["android", "ios"],
                },
            ],
        });

        // Pre processors
        expect(CommentParser.parse("!#if (adguard)")).toEqual({
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.PreProcessor,
            name: "if",
            params: "(adguard)",
        });

        expect(CommentParser.parse("!#if (adguard && !adguard_ext_safari)")).toEqual({
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.PreProcessor,
            name: "if",
            params: "(adguard && !adguard_ext_safari)",
        });

        expect(CommentParser.parse("!#include https://example.org/path/includedfile.txt")).toEqual({
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.PreProcessor,
            name: "include",
            params: "https://example.org/path/includedfile.txt",
        });

        // Metadata
        expect(CommentParser.parse("! Title: Filter")).toEqual(<IMetadata>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: "Metadata",
            marker: "!",
            header: "Title",
            value: "Filter",
        });

        expect(CommentParser.parse("! Homepage: https://github.com/AdguardTeam/some-repo/wiki")).toEqual(<IMetadata>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: "Metadata",
            marker: "!",
            header: "Homepage",
            value: "https://github.com/AdguardTeam/some-repo/wiki",
        });

        expect(CommentParser.parse("# Homepage: https://github.com/AdguardTeam/some-repo/wiki")).toEqual(<IMetadata>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: "Metadata",
            marker: "#",
            header: "Homepage",
            value: "https://github.com/AdguardTeam/some-repo/wiki",
        });

        // Comments
        expect(CommentParser.parse("! This is just a comment")).toEqual({
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Comment,
            marker: "!",
            text: " This is just a comment",
        });

        expect(CommentParser.parse("# This is just a comment")).toEqual({
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Comment,
            marker: "#",
            text: " This is just a comment",
        });

        expect(CommentParser.parse("!#########################")).toEqual({
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Comment,
            marker: "!",
            text: "#########################",
        });

        expect(CommentParser.parse("##########################")).toEqual({
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Comment,
            marker: "#",
            text: "#########################",
        });
    });

    test("generate", () => {
        const parseAndGenerate = (raw: string) => {
            const ast = CommentParser.parse(raw);

            if (ast) {
                return CommentParser.generate(ast);
            }

            return null;
        };

        expect(parseAndGenerate("[Adblock Plus 2.0]")).toEqual("[Adblock Plus 2.0]");

        expect(parseAndGenerate("[Adblock Plus 2.0; AdGuard]")).toEqual("[Adblock Plus 2.0; AdGuard]");

        expect(parseAndGenerate("!+ NOT_OPTIMIZED")).toEqual("!+ NOT_OPTIMIZED");

        expect(parseAndGenerate("!+ NOT_OPTIMIZED PLATFORM(windows) NOT_PLATFORM(mac)")).toEqual(
            "!+ NOT_OPTIMIZED PLATFORM(windows) NOT_PLATFORM(mac)"
        );

        expect(parseAndGenerate("!#if (adguard && !adguard_ext_safari)")).toEqual(
            "!#if (adguard && !adguard_ext_safari)"
        );

        expect(parseAndGenerate("! Homepage: https://github.com/AdguardTeam/some-repo/wiki")).toEqual(
            "! Homepage: https://github.com/AdguardTeam/some-repo/wiki"
        );

        expect(parseAndGenerate("! This is just a comment")).toEqual("! This is just a comment");
    });
});
