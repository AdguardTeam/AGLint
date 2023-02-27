import { HtmlBodyParser } from '../../../../src/parser/cosmetic/body/html';
import { AdblockSyntax } from '../../../../src/utils/adblockers';
import { CssTree } from '../../../../src/utils/csstree';
import { CssTreeParserContext } from '../../../../src/utils/csstree-constants';

describe('HtmlBodyParser', () => {
    test('escapeDoubleQuotes', () => {
        expect(HtmlBodyParser.escapeDoubleQuotes('[tag-content="a"]')).toBe('[tag-content="a"]');

        expect(HtmlBodyParser.escapeDoubleQuotes('[tag-content="""a"""]')).toBe('[tag-content="\\"a\\""]');

        expect(HtmlBodyParser.escapeDoubleQuotes('[tag-content="""""a"""""]')).toBe('[tag-content="\\"\\"a\\"\\""]');
    });

    test('unescapeDoubleQuotes', () => {
        expect(HtmlBodyParser.unescapeDoubleQuotes('[tag-content="a"]')).toBe('[tag-content="a"]');

        expect(HtmlBodyParser.unescapeDoubleQuotes('[tag-content="\\"a\\""]')).toBe('[tag-content="""a"""]');

        expect(HtmlBodyParser.unescapeDoubleQuotes('[tag-content="\\"\\"a\\"\\""]')).toBe('[tag-content="""""a"""""]');
    });

    test('parse', () => {
        expect(HtmlBodyParser.parse('[tag-content="""a"""]')).toEqual({
            selectors: [CssTree.parsePlain('[tag-content="\\"a\\""]', CssTreeParserContext.selector)],
        });

        expect(HtmlBodyParser.parse('[tag-content="""""a"""""]')).toEqual({
            selectors: [CssTree.parsePlain('[tag-content="\\"\\"a\\"\\""]', CssTreeParserContext.selector)],
        });

        expect(HtmlBodyParser.parse('script:has-text(a), script:has-text(b)')).toEqual({
            selectors: [
                CssTree.parsePlain('script:has-text(a)', CssTreeParserContext.selector),
                CssTree.parsePlain('script:has-text(b)', CssTreeParserContext.selector),
            ],
        });
    });

    test('generate', () => {
        const parseAndGenerate = (raw: string, syntax: AdblockSyntax) => {
            const ast = HtmlBodyParser.parse(raw);

            if (ast) {
                return HtmlBodyParser.generate(ast, syntax);
            }

            return null;
        };

        expect(parseAndGenerate('[tag-content="""a"""]', AdblockSyntax.Adg)).toEqual('[tag-content="""a"""]');

        expect(parseAndGenerate('[tag-content="""""a"""""]', AdblockSyntax.Adg)).toEqual('[tag-content="""""a"""""]');

        expect(parseAndGenerate('script:has-text(a), script:has-text(b)', AdblockSyntax.Adg)).toEqual(
            'script:has-text(a), script:has-text(b)',
        );
    });
});
