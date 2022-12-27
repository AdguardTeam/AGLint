import { CommentParser } from "../../../src/parser/comment";
import { CommentRuleType } from "../../../src/parser/comment/types";
import { Metadata } from "../../../src/parser/comment/metadata";
import { RuleCategory } from "../../../src/parser/categories";
import { AdblockSyntax } from "../../../src/utils/adblockers";
import { EMPTY, SPACE } from "../../../src/utils/constants";

describe("CommentParser", () => {
    test("isComment", () => {
        // Empty
        expect(CommentParser.isComment(EMPTY)).toBe(false);
        expect(CommentParser.isComment(SPACE)).toBe(false);

        // Begins with !
        expect(CommentParser.isComment("!")).toBe(true);
        expect(CommentParser.isComment("!!")).toBe(true);
        expect(CommentParser.isComment("!comment")).toBe(true);
        expect(CommentParser.isComment("! comment")).toBe(true);
        expect(CommentParser.isComment("!+comment")).toBe(true);
        expect(CommentParser.isComment("!#comment")).toBe(true);
        expect(CommentParser.isComment("!#########################")).toBe(true);
        expect(CommentParser.isComment("! #########################")).toBe(true);
        expect(CommentParser.isComment(" !")).toBe(true);
        expect(CommentParser.isComment("  !")).toBe(true);

        // Begins with #
        expect(CommentParser.isComment("#")).toBe(true);
        expect(CommentParser.isComment("##")).toBe(true);
        expect(CommentParser.isComment("# #")).toBe(true);
        expect(CommentParser.isComment("#comment")).toBe(true);
        expect(CommentParser.isComment("# comment")).toBe(true);
        expect(CommentParser.isComment("#+comment")).toBe(true);
        expect(CommentParser.isComment("#########################")).toBe(true);
        expect(CommentParser.isComment("# ########################")).toBe(true);
        expect(CommentParser.isComment(" #")).toBe(true);
        expect(CommentParser.isComment("  ##")).toBe(true);

        // Cosmetic rules (also begins with #)
        expect(CommentParser.isComment("##.selector")).toBe(false);
        expect(CommentParser.isComment("#@#.selector")).toBe(false);
        expect(CommentParser.isComment("#%#//scriptlet('scriptlet')")).toBe(false);
        expect(CommentParser.isComment(" #%#//scriptlet('scriptlet')")).toBe(false);

        // Adblock agents
        expect(CommentParser.isComment("[Adblock Plus 2.0]")).toBe(true);
        expect(CommentParser.isComment("[Adblock]")).toBe(true);
        expect(CommentParser.isComment("[Adblock Plus 2.0; AdGuard]")).toBe(true);
        expect(CommentParser.isComment("[Adblock Plus 2.0; AdGuard 1.0]")).toBe(true);
        expect(CommentParser.isComment("[uBlock]")).toBe(true);
        expect(CommentParser.isComment("[uBlock Origin]")).toBe(true);
        expect(CommentParser.isComment("[Adblock Plus 2.0]")).toBe(true);
        expect(CommentParser.isComment("  [Adblock Plus 2.0]")).toBe(true);
    });

    test("parse", () => {
        // Empty / not comment
        expect(CommentParser.parse(EMPTY)).toBe(null);
        expect(CommentParser.parse(SPACE)).toBe(null);
        expect(CommentParser.parse("##.ad")).toBe(null);
        expect(CommentParser.parse("#@#.ad")).toBe(null);

        // Agents
        expect(CommentParser.parse("[]")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.Agent,
            agents: [],
        });

        expect(CommentParser.parse("[Adblock Plus 2.0]")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "Adblock Plus",
                    version: "2.0",
                },
            ],
        });

        expect(CommentParser.parse("[AdGuard]")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "AdGuard",
                },
            ],
        });

        // Hints
        expect(CommentParser.parse("!+ NOT_OPTIMIZED")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Adg,
            type: CommentRuleType.Hint,
            hints: [
                {
                    name: "NOT_OPTIMIZED",
                    params: [],
                },
            ],
        });

        expect(CommentParser.parse("!+NOT_OPTIMIZED")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Adg,
            type: CommentRuleType.Hint,
            hints: [
                {
                    name: "NOT_OPTIMIZED",
                    params: [],
                },
            ],
        });

        expect(CommentParser.parse("!+ NOT_OPTIMIZED PLATFORM(windows, mac) NOT_PLATFORM(android, ios)")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Adg,
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
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.PreProcessor,
            name: "if",
            params: "(adguard)",
        });

        expect(CommentParser.parse("!#if (adguard && !adguard_ext_safari)")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.PreProcessor,
            name: "if",
            params: "(adguard && !adguard_ext_safari)",
        });

        expect(CommentParser.parse("!#include https://example.org/path/includedfile.txt")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.PreProcessor,
            name: "include",
            params: "https://example.org/path/includedfile.txt",
        });

        // Metadata
        expect(CommentParser.parse("! Title: Filter")).toEqual(<Metadata>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.Metadata,
            marker: "!",
            header: "Title",
            value: "Filter",
        });

        expect(CommentParser.parse("! Homepage: https://github.com/AdguardTeam/some-repo/wiki")).toEqual(<Metadata>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.Metadata,
            marker: "!",
            header: "Homepage",
            value: "https://github.com/AdguardTeam/some-repo/wiki",
        });

        expect(CommentParser.parse("# Homepage: https://github.com/AdguardTeam/some-repo/wiki")).toEqual(<Metadata>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.Metadata,
            marker: "#",
            header: "Homepage",
            value: "https://github.com/AdguardTeam/some-repo/wiki",
        });

        // Config comments
        expect(CommentParser.parse("! aglint-disable rule1, rule2")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.ConfigComment,
            marker: "!",
            command: "aglint-disable",
            params: ["rule1", "rule2"],
        });

        expect(CommentParser.parse("! aglint-enable rule1, rule2")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.ConfigComment,
            marker: "!",
            command: "aglint-enable",
            params: ["rule1", "rule2"],
        });

        expect(CommentParser.parse("# aglint-disable rule1, rule2")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.ConfigComment,
            marker: "#",
            command: "aglint-disable",
            params: ["rule1", "rule2"],
        });

        expect(CommentParser.parse("# aglint-enable rule1, rule2")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.ConfigComment,
            marker: "#",
            command: "aglint-enable",
            params: ["rule1", "rule2"],
        });

        expect(CommentParser.parse('! aglint rule1: "off", rule2: ["a", "b"] -- this is a comment')).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.ConfigComment,
            marker: "!",
            command: "aglint",
            params: {
                rule1: "off",
                rule2: ["a", "b"],
            },
            comment: "this is a comment",
        });

        expect(CommentParser.parse('# aglint rule1: "off", rule2: ["a", "b"] -- this is a comment')).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.ConfigComment,
            marker: "#",
            command: "aglint",
            params: {
                rule1: "off",
                rule2: ["a", "b"],
            },
            comment: "this is a comment",
        });

        // Comments
        expect(CommentParser.parse("! This is just a comment")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.SimpleComment,
            marker: "!",
            text: " This is just a comment",
        });

        expect(CommentParser.parse("# This is just a comment")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.SimpleComment,
            marker: "#",
            text: " This is just a comment",
        });

        expect(CommentParser.parse("!#########################")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.SimpleComment,
            marker: "!",
            text: "#########################",
        });

        expect(CommentParser.parse("##########################")).toEqual({
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.SimpleComment,
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

        expect(parseAndGenerate("! aglint-enable rule1, rule2 -- comment")).toEqual(
            "! aglint-enable rule1, rule2 -- comment"
        );

        expect(parseAndGenerate("# aglint-enable rule1, rule2 -- comment")).toEqual(
            "# aglint-enable rule1, rule2 -- comment"
        );

        expect(parseAndGenerate("! This is just a comment")).toEqual("! This is just a comment");
    });
});
