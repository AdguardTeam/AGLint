import { IMetadata, MetadataParser } from "../../../src/parser/comment/metadata";
import { RuleCategories } from "../../../src/parser/common";
import { AdblockSyntax } from "../../../src/utils/adblockers";

describe("MetadataParser", () => {
    test("parse", () => {
        expect(MetadataParser.parse("")).toBe(null);
        expect(MetadataParser.parse(" ")).toBe(null);
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
            type: "Metadata",
            marker: "!",
            header: "Title",
            value: "Filter",
        });

        expect(MetadataParser.parse("# Title: Filter")).toEqual(<IMetadata>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: "Metadata",
            marker: "#",
            header: "Title",
            value: "Filter",
        });

        expect(MetadataParser.parse("! title: Filter")).toEqual(<IMetadata>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: "Metadata",
            marker: "!",
            header: "title",
            value: "Filter",
        });

        expect(MetadataParser.parse("!    title:    Filter   ")).toEqual(<IMetadata>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: "Metadata",
            marker: "!",
            header: "title",
            value: "Filter",
        });

        expect(
            MetadataParser.parse("! Homepage: https://github.com/AdguardTeam/some-repo/wiki")
        ).toEqual(<IMetadata>{
            category: RuleCategories.Comment,
            syntax: AdblockSyntax.Unknown,
            type: "Metadata",
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

        expect(
            parseAndGenerate("! Homepage: https://github.com/AdguardTeam/some-repo/wiki")
        ).toEqual("! Homepage: https://github.com/AdguardTeam/some-repo/wiki");

        expect(
            parseAndGenerate("# Homepage: https://github.com/AdguardTeam/some-repo/wiki")
        ).toEqual("# Homepage: https://github.com/AdguardTeam/some-repo/wiki");
    });
});
