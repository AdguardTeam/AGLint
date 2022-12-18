import { AgentParser, Agent } from "../../../src/parser/comment/agent";
import { CommentRuleType } from "../../../src/parser/comment/types";
import { RuleCategory } from "../../../src/parser/categories";
import { AdblockSyntax } from "../../../src/utils/adblockers";
import { EMPTY, SPACE } from "../../../src/utils/constants";

describe("AgentParser", () => {
    test("isAgent", () => {
        // Invalid
        expect(AgentParser.isAgent(EMPTY)).toBe(false);
        expect(AgentParser.isAgent(SPACE)).toBe(false);
        expect(AgentParser.isAgent("[")).toBe(false);

        // Cosmetic rule modifiers
        expect(AgentParser.isAgent("[$path=/test]example.org##.ad")).toBe(false);
        expect(AgentParser.isAgent("[$path=/test]##.ad")).toBe(false);

        // Empty agent
        expect(AgentParser.isAgent("[]")).toBe(true);
        expect(AgentParser.isAgent("[ ]")).toBe(true);

        // Agents
        expect(AgentParser.isAgent("[Adblock Plus 2.0]")).toBe(true);
        expect(AgentParser.isAgent("[Adblock Plus 3.1; AdGuard 1.0]")).toBe(true);
    });

    test("parse", () => {
        expect(AgentParser.parse('##[class="ad"]')).toBeNull();

        // Empty agents
        expect(AgentParser.parse(EMPTY)).toBeNull();
        expect(AgentParser.parse(SPACE)).toBeNull();

        // Valid agents
        expect(AgentParser.parse("[]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [],
        });

        expect(AgentParser.parse("[ ]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [],
        });

        expect(AgentParser.parse("[  ]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [],
        });

        expect(AgentParser.parse("[;]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [],
        });

        expect(AgentParser.parse("[ ; ]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [],
        });

        expect(AgentParser.parse("[  ;  ]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [],
        });

        expect(AgentParser.parse("[;;;]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [],
        });

        expect(AgentParser.parse("[ ; ; ; ]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [],
        });

        expect(AgentParser.parse("[AdBlock]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "AdBlock",
                },
            ],
        });

        expect(AgentParser.parse("[AdGuard]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "AdGuard",
                },
            ],
        });

        expect(AgentParser.parse("[uBlock]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "uBlock",
                },
            ],
        });

        expect(AgentParser.parse("[uBlock Origin]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "uBlock Origin",
                },
            ],
        });

        expect(AgentParser.parse("[Adblock Plus 2.0]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "Adblock Plus",
                    version: "2.0",
                },
            ],
        });

        expect(AgentParser.parse("[uBlock Origin 1.0.0]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "uBlock Origin",
                    version: "1.0.0",
                },
            ],
        });

        expect(AgentParser.parse("[Adblock Plus 2.0; AdGuard]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "Adblock Plus",
                    version: "2.0",
                },
                {
                    adblock: "AdGuard",
                },
            ],
        });

        expect(AgentParser.parse("[Adblock Plus 2.0; AdGuard 1.0.1.10]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "Adblock Plus",
                    version: "2.0",
                },
                {
                    adblock: "AdGuard",
                    version: "1.0.1.10",
                },
            ],
        });

        expect(AgentParser.parse("[Adblock Plus 3.1; AdGuard 1.4; uBlock Origin 1.0.15.0]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "Adblock Plus",
                    version: "3.1",
                },
                {
                    adblock: "AdGuard",
                    version: "1.4",
                },
                {
                    adblock: "uBlock Origin",
                    version: "1.0.15.0",
                },
            ],
        });

        expect(AgentParser.parse("![Adblock Plus 3.1]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "Adblock Plus",
                    version: "3.1",
                },
            ],
        });

        expect(AgentParser.parse("! [Adblock Plus 3.1]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "Adblock Plus",
                    version: "3.1",
                },
            ],
        });

        expect(AgentParser.parse("#[Adblock Plus 3.1]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "Adblock Plus",
                    version: "3.1",
                },
            ],
        });

        expect(AgentParser.parse("# [Adblock Plus 3.1]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "Adblock Plus",
                    version: "3.1",
                },
            ],
        });

        expect(AgentParser.parse("# [Adblock Plus 3.1 beta]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "Adblock Plus",
                    version: "3.1 beta",
                },
            ],
        });

        // Syntactically this is fine:
        expect(AgentParser.parse("[2.0]")).toEqual(<Agent>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Agent,
            agents: [
                {
                    adblock: "2.0",
                },
            ],
        });
    });

    test("generate", () => {
        const parseAndGenerate = (raw: string) => {
            const ast = AgentParser.parse(raw);

            if (ast) {
                return AgentParser.generate(ast);
            }

            return null;
        };

        expect(parseAndGenerate("[]")).toEqual("[]");
        expect(parseAndGenerate("[AdGuard]")).toEqual("[AdGuard]");
        expect(parseAndGenerate("[ AdGuard ]")).toEqual("[AdGuard]");
        expect(parseAndGenerate("[AdGuard;]")).toEqual("[AdGuard]");
        expect(parseAndGenerate("[AdGuard ; ]")).toEqual("[AdGuard]");
        expect(parseAndGenerate("[Adblock Plus 2.0]")).toEqual("[Adblock Plus 2.0]");
        expect(parseAndGenerate("[Adblock Plus 2.0; AdGuard]")).toEqual("[Adblock Plus 2.0; AdGuard]");
        expect(parseAndGenerate("[  Adblock Plus 2.0  ; AdGuard  ]")).toEqual("[Adblock Plus 2.0; AdGuard]");
    });
});
