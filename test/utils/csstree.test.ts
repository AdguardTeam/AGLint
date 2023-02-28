import { Block, Selector } from '@adguard/ecss-tree';
import { CssTree } from '../../src/utils/csstree';
import { CssTreeParserContext } from '../../src/utils/csstree-constants';

describe('CSSTree utils', () => {
    test('getSelectorExtendedCssNodes', () => {
        expect(
            CssTree.getSelectorExtendedCssNodes(<Selector>CssTree.parse('#test', CssTreeParserContext.selector)),
        ).toEqual({
            attributes: [],
            pseudos: [],
        });

        expect(
            CssTree.getSelectorExtendedCssNodes(
                <Selector>CssTree.parse('#test[-ext-contains="something"]', CssTreeParserContext.selector),
            ),
        ).toMatchObject({
            attributes: [CssTree.createAttributeSelector('-ext-contains', 'something')],
            pseudos: [],
        });

        expect(
            CssTree.getSelectorExtendedCssNodes(
                <Selector>(
                    CssTree.parse(
                        '#test[-ext-contains="something"]:-abp-has(.ad):if-not([ad]):not([some])::before',
                        CssTreeParserContext.selector,
                    )
                ),
            ),
        ).toMatchObject({
            attributes: [CssTree.createAttributeSelector('-ext-contains', 'something')],
            // Partial match, for important parts
            pseudos: [
                {
                    name: '-abp-has',
                    type: 'PseudoClassSelector',
                },
                {
                    name: 'if-not',
                    type: 'PseudoClassSelector',
                },
            ],
        });
    });

    // Customized selector generation
    test('generateSelector', () => {
        const parseAndGenerate = (rawSelector: string) => {
            return CssTree.generateSelector(<Selector>CssTree.parse(rawSelector, CssTreeParserContext.selector));
        };

        expect(parseAndGenerate('div')).toEqual('div');
        expect(parseAndGenerate('#test')).toEqual('#test');
        expect(parseAndGenerate('.test')).toEqual('.test');
        expect(parseAndGenerate('.test .test')).toEqual('.test .test');
        expect(parseAndGenerate('[a=b]')).toEqual('[a=b]');
        expect(parseAndGenerate('[a="b"i]')).toEqual('[a="b" i]');
        expect(parseAndGenerate('[a="b" i]')).toEqual('[a="b" i]');
        expect(parseAndGenerate('div::first-child')).toEqual('div::first-child');
        expect(parseAndGenerate('div::a(b)')).toEqual('div::a(b)');
        expect(parseAndGenerate('div.test')).toEqual('div.test');
        expect(parseAndGenerate('div#test')).toEqual('div#test');
        expect(parseAndGenerate('div[data-advert]')).toEqual('div[data-advert]');
        expect(parseAndGenerate(':lang(hu-hu)')).toEqual(':lang(hu-hu)');

        expect(
            parseAndGenerate(
                'div[data-advert] > #test ~ div[class="advert"][id="something"]:nth-child(3n+0):first-child',
            ),
        ).toEqual('div[data-advert] > #test ~ div[class="advert"][id="something"]:nth-child(3n+0):first-child');

        expect(parseAndGenerate(':not(:not([name]))')).toEqual(':not(:not([name]))');

        // "Sub selector lists"
        expect(parseAndGenerate(':not(:not([name]):contains(2))')).toEqual(':not(:not([name]):contains(2))');

        expect(
            parseAndGenerate(
                // eslint-disable-next-line max-len
                '.teasers > div[class=" display"]:has(> div[class] > div[class] > div:not([class]):not([id]) > div:not([class]):not([id]):contains(/^REKLAMA$/))',
            ),
        ).toEqual(
            // eslint-disable-next-line max-len
            '.teasers > div[class=" display"]:has(> div[class] > div[class] > div:not([class]):not([id]) > div:not([class]):not([id]):contains(/^REKLAMA$/))',
        );
    });

    test('generateBlock', () => {
        const parseAndGenerate = (declarationList: string) => {
            return CssTree.generateBlock(<Block>CssTree.parse(declarationList, CssTreeParserContext.declarationList));
        };

        expect(parseAndGenerate('padding: 0;')).toEqual('padding: 0;');
        expect(parseAndGenerate('padding: 0')).toEqual('padding: 0;');
        expect(parseAndGenerate('padding: 0!important')).toEqual('padding: 0 !important;');
        expect(parseAndGenerate('padding: 0 !important')).toEqual('padding: 0 !important;');
        expect(parseAndGenerate('padding: 0!important;')).toEqual('padding: 0 !important;');
        expect(parseAndGenerate('padding: 0 !important;')).toEqual('padding: 0 !important;');
        expect(parseAndGenerate('padding: 0!important; margin: 2px')).toEqual('padding: 0 !important; margin: 2px;');
    });
});
