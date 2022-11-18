import { ElementHidingBodyParser } from "../../../../src/parser/cosmetic/body/elementhiding";
import { CssTree } from "../../../../src/utils/csstree";
import { CssTreeParserContext } from "../../../../src/utils/csstree-constants";

// ! Please note that CSSTree is fully tested elsewhere
describe("ElementHidingBodyParser", () => {
    test("parse", () => {
        // Single selector
        expect(ElementHidingBodyParser.parse(".test")).toEqual({
            selectors: [CssTree.parse(".test", CssTreeParserContext.selector)],
        });

        // Multiple selectors
        expect(ElementHidingBodyParser.parse(".test1, .test2")).toEqual({
            selectors: [
                CssTree.parse(".test1", CssTreeParserContext.selector),
                CssTree.parse(".test2", CssTreeParserContext.selector),
            ],
        });

        expect(ElementHidingBodyParser.parse(".test1, .test2, [ad-model]")).toEqual({
            selectors: [
                CssTree.parse(".test1", CssTreeParserContext.selector),
                CssTree.parse(".test2", CssTreeParserContext.selector),
                CssTree.parse("[ad-model]", CssTreeParserContext.selector),
            ],
        });
    });

    test("generate", () => {
        const parseAndGenerate = (raw: string) => {
            const ast = ElementHidingBodyParser.parse(raw);

            if (ast) {
                return ElementHidingBodyParser.generate(ast);
            }

            return null;
        };

        expect(parseAndGenerate(".test1, .test2")).toEqual(".test1, .test2");
    });
});
