import { CommentRuleType } from "../../../src/parser/comment/common";
import { IMetadata, MetadataParser } from "../../../src/parser/comment/metadata";
import { RuleCategories } from "../../../src/parser/common";
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

        expect(MetadataParser.parse("! Title: Filter")).toEqual(<IMetadata>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Metadata,
            marker: "!",
            header: "Title",
            value: "Filter",
        });

        expect(MetadataParser.parse("# Title: Filter")).toEqual(<IMetadata>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Metadata,
            marker: "#",
            header: "Title",
            value: "Filter",
        });

        expect(MetadataParser.parse("! title: Filter")).toEqual(<IMetadata>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Metadata,
            marker: "!",
            header: "title",
            value: "Filter",
        });

        expect(MetadataParser.parse("!    title:    Filter   ")).toEqual(<IMetadata>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: CommentRuleType.Metadata,
            marker: "!",
            header: "title",
            value: "Filter",
        });

        expect(MetadataParser.parse("! Homepage: https://github.com/AdguardTeam/some-repo/wiki")).toEqual(<IMetadata>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
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
