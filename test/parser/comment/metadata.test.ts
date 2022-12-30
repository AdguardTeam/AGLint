import { CommentRuleType } from "../../../src/parser/comment/types";
import { Metadata, MetadataParser } from "../../../src/parser/comment/metadata";
import { RuleCategory } from "../../../src/parser/categories";
import { AdblockSyntax } from "../../../src/utils/adblockers";
import { EMPTY, SPACE } from "../../../src/utils/constants";

describe("MetadataParser", () => {
    test("parse", () => {
        expect(MetadataParser.parse(EMPTY)).toBe(null);
        expect(MetadataParser.parse(SPACE)).toBe(null);

        expect(MetadataParser.parse("!")).toBe(null);
        expect(MetadataParser.parse("!##")).toBe(null);
        expect(MetadataParser.parse("##")).toBe(null);
        expect(MetadataParser.parse("!aaa:bbb")).toBe(null);
        expect(MetadataParser.parse("! aaa: bbb")).toBe(null);
        expect(MetadataParser.parse("!aaa:bbb:ccc")).toBe(null);
        expect(MetadataParser.parse("! aaa: bbb: ccc")).toBe(null);
        expect(MetadataParser.parse("!:::")).toBe(null);
        expect(MetadataParser.parse("! : : :")).toBe(null);

        expect(MetadataParser.parse("! Title: Filter")).toEqual(<Metadata>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.Metadata,
            marker: "!",
            header: "Title",
            value: "Filter",
        });

        expect(MetadataParser.parse("# Title: Filter")).toEqual(<Metadata>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.Metadata,
            marker: "#",
            header: "Title",
            value: "Filter",
        });

        expect(MetadataParser.parse("! title: Filter")).toEqual(<Metadata>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.Metadata,
            marker: "!",
            header: "title",
            value: "Filter",
        });

        expect(MetadataParser.parse("!    title:    Filter   ")).toEqual(<Metadata>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.Metadata,
            marker: "!",
            header: "title",
            value: "Filter",
        });

        expect(MetadataParser.parse("! Homepage: https://github.com/AdguardTeam/some-repo/wiki")).toEqual(<Metadata>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Common,
            type: CommentRuleType.Metadata,
            marker: "!",
            header: "Homepage",
            value: "https://github.com/AdguardTeam/some-repo/wiki",
        });
    });

    test("generate", () => {
        const parseAndGenerate = (raw: string) => {
            const ast = MetadataParser.parse(raw);

            if (ast) {
                return MetadataParser.generate(ast);
            }

            return null;
        };

        expect(parseAndGenerate("! Title: Filter")).toEqual("! Title: Filter");
        expect(parseAndGenerate("!   Title: Filter   ")).toEqual("! Title: Filter");
        expect(parseAndGenerate("# Title: Filter")).toEqual("# Title: Filter");

        expect(parseAndGenerate("! Homepage: https://github.com/AdguardTeam/some-repo/wiki")).toEqual(
            "! Homepage: https://github.com/AdguardTeam/some-repo/wiki"
        );

        expect(parseAndGenerate("# Homepage: https://github.com/AdguardTeam/some-repo/wiki")).toEqual(
            "# Homepage: https://github.com/AdguardTeam/some-repo/wiki"
        );
    });
});
