/**
 * Migrated from https://github.com/AdguardTeam/tsurlfilter/blob/2144959e92f94e4738274ce577c2fe26e3a0c08b/packages/agtree/test/utils/csstree.test.ts
 */

import {
    type CssNode,
    find,
    type FunctionNode,
    List,
    type PseudoClassSelector,
} from '@adguard/ecss-tree';

import {
    generateDeclarationList,
    generateFunctionValue,
    generateMediaQuery,
    generateMediaQueryList,
    generatePseudoClassValue,
    generateSelector,
    generateSelectorList,
} from '../../../src/linter/helpers/css-generate';
import { parseCss } from '../../../src/linter/helpers/css-parse';
import { CssTreeNodeType, CssTreeParsingContext } from '../../../src/linter/helpers/css-tree-types';

describe('CSSTree utils', () => {
    describe('generateSelector', () => {
        test.each([
            {
                actual: 'div',
                expected: 'div',
            },
            {
                actual: '#test',
                expected: '#test',
            },
            {
                actual: '.test',
                expected: '.test',
            },
            {
                actual: '.test .test',
                expected: '.test .test',
            },
            {
                actual: '[a=b]',
                expected: '[a=b]',
            },
            {
                actual: '[a="b"i]',
                expected: '[a="b" i]',
            },
            {
                actual: '[a="b" i]',
                expected: '[a="b" i]',
            },
            {
                actual: 'div::first-child',
                expected: 'div::first-child',
            },
            {
                actual: 'div::a(b)',
                expected: 'div::a(b)',
            },
            {
                actual: 'div.test',
                expected: 'div.test',
            },
            {
                actual: 'div#test',
                expected: 'div#test',
            },
            {
                actual: 'div[data-advert]',
                expected: 'div[data-advert]',
            },
            {
                actual: ':lang(hu-hu)',
                expected: ':lang(hu-hu)',
            },
            {
                actual: 'div[data-advert] > #test ~ div[class="advert"][id="something"]:nth-child(3n+0):first-child',
                expected: 'div[data-advert] > #test ~ div[class="advert"][id="something"]:nth-child(3n+0):first-child',
            },
            {
                actual: ':not(:not([name]))',
                expected: ':not(:not([name]))',
            },
            {
                actual: ':not(:not([name]):contains(2))',
                expected: ':not(:not([name]):contains(2))',
            },
            {
                // eslint-disable-next-line max-len
                actual: '.teasers > div[class=" display"]:has(> div[class] > div[class] > div:not([class]):not([id]) > div:not([class]):not([id]):contains(/^REKLAMA$/))',
                // eslint-disable-next-line max-len
                expected: '.teasers > div[class=" display"]:has(> div[class] > div[class] > div:not([class]):not([id]) > div:not([class]):not([id]):contains(/^REKLAMA$/))',
            },
        ])('should generate \'$expected\' from \'$actual\'', ({ actual, expected }) => {
            const generated = generateSelector(parseCss(actual, CssTreeParsingContext.Selector));
            expect(generated).toEqual(expected);
        });
    });

    describe('generateSelectorList', () => {
        test.each([
            {
                actual: 'div,div',
                expected: 'div, div',
            },
            {
                actual: 'div, div',
                expected: 'div, div',
            },
            {
                actual: 'div, div, div',
                expected: 'div, div, div',
            },
            {
                actual: '#test, div',
                expected: '#test, div',
            },
            {
                actual: '#test,div,#test',
                expected: '#test, div, #test',
            },
            {
                actual: '#test, div, #test',
                expected: '#test, div, #test',
            },
            {
                actual: '.test, div',
                expected: '.test, div',
            },
            {
                actual: '[a=b],#test',
                expected: '[a=b], #test',
            },
            {
                actual: '[a=b], #test',
                expected: '[a=b], #test',
            },
            {
                actual: '[a="b"i],#test',
                expected: '[a="b" i], #test',
            },
            {
                actual: '[a="b" i], #test',
                expected: '[a="b" i], #test',
            },
            {
                actual: 'div::first-child,#test',
                expected: 'div::first-child, #test',
            },
            {
                actual: 'div::first-child, #test',
                expected: 'div::first-child, #test',
            },
            {
                actual: 'div::a(b),#test',
                expected: 'div::a(b), #test',
            },
            {
                actual: 'div::a(b), #test',
                expected: 'div::a(b), #test',
            },
            {
                actual: 'div.test,#test',
                expected: 'div.test, #test',
            },
            {
                actual: 'div.test, #test',
                expected: 'div.test, #test',
            },
            {
                actual: 'div#test,#test',
                expected: 'div#test, #test',
            },
            {
                actual: 'div#test, #test',
                expected: 'div#test, #test',
            },
            {
                actual: 'div[data-advert],#test',
                expected: 'div[data-advert], #test',
            },
            {
                actual: ':lang(hu-hu),#test',
                expected: ':lang(hu-hu), #test',
            },
            {
                // eslint-disable-next-line max-len
                actual: 'div[data-advert] > #test ~ div[class="advert"][id="something"]:nth-child(3n+0):first-child,#test',
                // eslint-disable-next-line max-len
                expected: 'div[data-advert] > #test ~ div[class="advert"][id="something"]:nth-child(3n+0):first-child, #test',
            },
        ])('should generate \'$expected\' from \'$actual\'', ({ actual, expected }) => {
            const generated = generateSelectorList(parseCss(actual, CssTreeParsingContext.SelectorList));
            expect(generated).toEqual(expected);
        });

        test('should generate a selector list with a raw value', () => {
            expect(
                generateSelector({
                    type: 'Selector',
                    children: new List<CssNode>().fromArray([
                        {
                            type: 'PseudoClassSelector',
                            name: 'not',
                            children: new List<CssNode>().fromArray([
                                {
                                    type: 'SelectorList',
                                    children: new List<CssNode>().fromArray([
                                        {
                                            type: 'Selector',
                                            children: new List<CssNode>().fromArray([
                                                {
                                                    type: 'ClassSelector',
                                                    name: 'a',
                                                },
                                            ]),
                                        },
                                        {
                                            type: 'Raw',
                                            value: '/raw/',
                                        },
                                    ]),
                                },
                            ]),
                        },
                    ]),
                }),
            ).toEqual(
                ':not(.a, /raw/)',
            );
        });
    });

    describe('generateMediaQuery', () => {
        test.each([
            {
                actual: 'screen',
                expected: 'screen',
            },
            {
                actual: '(max-width: 100px)',
                expected: '(max-width: 100px)',
            },
        ])('should generate \'$expected\' from \'$actual\'', ({ actual, expected }) => {
            const generated = generateMediaQuery(parseCss(actual, CssTreeParsingContext.MediaQuery));
            expect(generated).toEqual(expected);
        });
    });

    describe('generateMediaQueryList', () => {
        test.each([
            {
                actual: 'screen and (max-width: 100px)',
                expected: 'screen and (max-width: 100px)',
            },
            {
                actual: 'screen and (max-width: 100px) and (min-width: 50px)',
                expected: 'screen and (max-width: 100px) and (min-width: 50px)',
            },
            {
                // eslint-disable-next-line max-len
                actual: 'screen and (max-width: 100px) and (min-width: 50px) and (orientation: landscape)',
                // eslint-disable-next-line max-len
                expected: 'screen and (max-width: 100px) and (min-width: 50px) and (orientation: landscape)',
            },
            {
                actual: 'screen, print',
                expected: 'screen, print',
            },
        ])('should generate \'$expected\' from \'$actual\'', ({ actual, expected }) => {
            const generated = generateMediaQueryList(parseCss(actual, CssTreeParsingContext.MediaQueryList));
            expect(generated).toEqual(expected);
        });
    });

    describe('generateDeclarationList', () => {
        test.each([
            {
                actual: 'padding: 0;',
                expected: 'padding: 0;',
            },
            {
                actual: 'padding: 0',
                expected: 'padding: 0;',
            },
            {
                actual: 'padding: 0!important',
                expected: 'padding: 0 !important;',
            },
            {
                actual: 'padding: 0 !important',
                expected: 'padding: 0 !important;',
            },
            {
                actual: 'padding: 0!important;',
                expected: 'padding: 0 !important;',
            },
            {
                actual: 'padding: 0 !important;',
                expected: 'padding: 0 !important;',
            },
            {
                actual: 'padding: 0!important; margin: 2px',
                expected: 'padding: 0 !important; margin: 2px;',
            },
            {
                actual: 'padding: 0 1px 2px 3px',
                expected: 'padding: 0 1px 2px 3px;',
            },
            {
                // eslint-disable-next-line max-len
                actual: 'padding: 0 1px 2px 3px; margin: 0 1px 2px 3px; background: url(http://example.com)',
                // eslint-disable-next-line max-len
                expected: 'padding: 0 1px 2px 3px; margin: 0 1px 2px 3px; background: url(http://example.com);',
            },
        ])('should generate \'$expected\' from \'$actual\'', ({ actual, expected }) => {
            const generated = generateDeclarationList(parseCss(actual, CssTreeParsingContext.DeclarationList));
            expect(generated).toEqual(expected);
        });
    });

    describe('generatePseudoClassValue', () => {
        test.each([
            {
                actual: ':not(.a, .b)',
                expected: '.a, .b',
            },
            {
                actual: ':nth-child(2n+1)',
                expected: '2n+1',
            },
            {
                actual: ':matches-path(/path)',
                expected: '/path',
            },
            {
                actual: ':matches-path(/^\\/path/)',
                expected: '/^\\/path/',
            },
            {
                actual: ':matches-path(/\\/(sub1|sub2)\\/page\\.html/)',
                expected: '/\\/(sub1|sub2)\\/page\\.html/',
            },
            {
                actual: ':has(> [class^="a"])',
                expected: '> [class^="a"]',
            },
        ])('should generate \'$expected\' from \'$actual\'', ({ actual, expected }) => {
            // Parse the actual value as a selector, then find the first pseudo class node
            const selectorNode = parseCss(actual, CssTreeParsingContext.Selector);
            const pseudo = find(selectorNode, (node) => node.type === CssTreeNodeType.PseudoClassSelector);

            if (!pseudo) {
                throw new Error('Pseudo class not found');
            }

            expect(
                generatePseudoClassValue(pseudo as PseudoClassSelector),
            ).toEqual(expected);
        });
    });

    describe('generateFunctionValue', () => {
        test.each([
            {
                actual: 'func(aaa)',
                expected: 'aaa',
            },
            {
                actual: 'responseheader(header-name)',
                expected: 'header-name',
            },
        ])('should generate \'$expected\' from \'$actual\'', ({ actual, expected }) => {
            const valueNode = parseCss(actual, CssTreeParsingContext.Value);
            const func = find(valueNode, (node) => node.type === CssTreeNodeType.Function);

            if (!func) {
                throw new Error('Function node not found');
            }

            expect(
                generateFunctionValue(func as FunctionNode),
            ).toEqual(expected);
        });
    });
});
