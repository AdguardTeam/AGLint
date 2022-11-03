import { HtmlBodyParser } from "../../../../src/parser/cosmetic/body/html";
import { CssTree } from "../../../../src/utils/csstree";
import { CssTreeParserContext } from "../../../../src/utils/csstree-constants";

describe("HtmlBodyParser", () => {
    test("escapeDoubleQuotes", () => {
        expect(HtmlBodyParser.escapeDoubleQuotes('[tag-content="a"]')).toBe('[tag-content="a"]');

        expect(HtmlBodyParser.escapeDoubleQuotes('[tag-content="""a"""]')).toBe('[tag-content="\\"a\\""]');

        expect(HtmlBodyParser.escapeDoubleQuotes('[tag-content="""""a"""""]')).toBe('[tag-content="\\"\\"a\\"\\""]');
    });

    test("unescapeDoubleQuotes", () => {
        expect(HtmlBodyParser.unescapeDoubleQuotes('[tag-content="a"]')).toBe('[tag-content="a"]');

        expect(HtmlBodyParser.unescapeDoubleQuotes('[tag-content="\\"a\\""]')).toBe('[tag-content="""a"""]');

        expect(HtmlBodyParser.unescapeDoubleQuotes('[tag-content="\\"\\"a\\"\\""]')).toBe('[tag-content="""""a"""""]');
    });

    test("parse", () => {
        expect(HtmlBodyParser.parse('[tag-content="""a"""]')).toEqual({
            selectors: [CssTree.parse('[tag-content="\\"a\\""]', CssTreeParserContext.selector)],
        });

        expect(HtmlBodyParser.parse('[tag-content="""""a"""""]')).toEqual({
            selectors: [CssTree.parse('[tag-content="\\"\\"a\\"\\""]', CssTreeParserContext.selector)],
        });

        expect(HtmlBodyParser.parse("script:has-text(a), script:has-text(b)")).toEqual({
            selectors: [
                CssTree.parse("script:has-text(a)", CssTreeParserContext.selector),
                CssTree.parse("script:has-text(b)", CssTreeParserContext.selector),
            ],
        });
    });
});
