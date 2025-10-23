// import { defaultParserOptions, DomainListParser } from '@adguard/agtree/parser';
import { type CssNode, List, parse as parseCss } from '@adguard/ecss-tree';

import { type LinterSubParsersConfig, type Parser } from './config';

const createCssParser = (context: string): Parser => {
    return {
        name: '@adguard/ecss-tree',
        parse: ((source: string, offset: number, line: number, lineStartOffset: number) => {
            return parseCss(source, {
                context,
                positions: true,
                offset,
                line,
                column: offset - lineStartOffset,
            });
        }),
        nodeTypeKey: 'type',
        childNodeKey: 'children',
        nodeTransformer: (node: CssNode) => {
            if ('children' in node) {
                const maybeChildren = (node as { children?: unknown }).children;

                if (maybeChildren instanceof List) {
                    // eslint-disable-next-line no-param-reassign
                    (node as { children: unknown }).children = maybeChildren.toArray();
                }
            }
            return node;
        },
        getStartOffset: (node: CssNode) => {
            return node.loc!.start.offset;
        },
        getEndOffset: (node: CssNode) => {
            return node.loc!.end.offset;
        },
    };
};

export const defaultSubParsers: LinterSubParsersConfig = {
    'ElementHidingRuleBody > Value.selectorList': createCssParser('selectorList'),
    'CssInjectionRuleBody > Value.selectorList': createCssParser('selectorList'),
    'ElementHidingRuleBody > Value.declarationList': createCssParser('declarationList'),
    'CssInjectionRuleBody > Value.declarationList': createCssParser('declarationList'),

    // TODO: Enable it later
    // Problematic with regex values in domain modifiers,
    // their parsing should be improved, see https://github.com/AdguardTeam/tsurlfilter/issues/121

    // 'Modifier[name.value="domain"] > Value.value': {
    //     name: '@adguard/agtree',
    //     parse: ((source: string, offset: number) => {
    //         return DomainListParser.parse(
    //             source,
    //             defaultParserOptions,
    //             offset,
    //             '|',
    //         );
    //     }),
    //     nodeTypeKey: 'type',
    //     childNodeKey: 'children',
    // },
};
