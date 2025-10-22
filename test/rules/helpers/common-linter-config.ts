import { defaultParserOptions, DomainListParser } from '@adguard/agtree/parser';
import { AdblockSyntax } from '@adguard/agtree/utils';
import { type CssNode, List, parse } from '@adguard/ecss-tree';

import { type LinterConfigParsed, type LinterSubParsersConfig } from '../../../src/linter/config';

const createCssParser = (context: string) => {
    return {
        name: '@adguard/ecss-tree',
        parse: ((source: string, offset: number, line: number, lineStartOffset: number) => {
            return parse(source, {
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

export const commonSubParsers: LinterSubParsersConfig = {
    'ElementHidingRuleBody > Value.selectorList': createCssParser('selectorList'),
    'CssInjectionRuleBody > Value.selectorList': createCssParser('selectorList'),
    'ElementHidingRuleBody > Value.declarationList': createCssParser('declarationList'),
    'CssInjectionRuleBody > Value.declarationList': createCssParser('declarationList'),
    'Modifier[name.value="domain"] > Value.value': {
        name: '@adguard/agtree',
        parse: ((source: string, offset: number) => {
            return DomainListParser.parse(
                source,
                defaultParserOptions,
                offset,
                '|',
            );
        }),
        nodeTypeKey: 'type',
        childNodeKey: 'children',
    },
};

export const commonLinterConfig: Omit<LinterConfigParsed, 'rules'> = {
    syntax: [
        AdblockSyntax.Adg,
    ],
    allowInlineConfig: true,
};
