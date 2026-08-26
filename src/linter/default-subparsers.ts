// import { defaultParserOptions, DomainListParser } from '@adguard/agtree/parser';
import {
    type Comment,
    type CssNode,
    parse as parseCss,
    toPlainObject,
} from '@adguard/ecss-tree';

import { type LinterSubParsersConfig, type Parser } from './config';
import { LinterSourceCodeError } from './source-code/error';

/**
 * Creates a CSS parser for a specific context.
 *
 * Uses @adguard/ecss-tree to parse CSS selector lists and declaration lists
 * embedded within adblock filter rules.
 *
 * @param context The CSS parsing context ('selectorList' or 'declarationList').
 *
 * @returns A configured parser instance for the specified CSS context.
 */
const createCssParser = (context: string): Parser => {
    return {
        name: '@adguard/ecss-tree',
        parse: ((source: string, offset: number, line: number, lineStartOffset: number) => {
            const comments: Comment[] = [];

            const res = toPlainObject(parseCss(source, {
                context,
                positions: true,
                offset,
                line,
                column: offset - lineStartOffset,
                onParseError: (error) => {
                    throw new LinterSourceCodeError(error.message, {
                        start: {
                            line: error.line,
                            column: error.column - 1,
                        },
                        end: {
                            line: error.line,
                            column: error.column - 1,
                        },
                    });
                },
                onComment(value, loc) {
                    comments.push({
                        type: 'Comment',
                        value,
                        loc,
                    });
                },
            }));

            // By default, css-tree ignores comments from the AST.
            // With this little trick, we include them into the AST.
            // Its not a perfect solution, but enough to detect comments.
            if (comments.length > 0) {
                (res as any).comments = comments;
            }

            return res;
        }),
        nodeTypeKey: 'type',
        childNodeKeys: ['children', 'comments'],
        getStartOffset: (node: CssNode) => {
            return node.loc!.start.offset;
        },
        getEndOffset: (node: CssNode) => {
            return node.loc!.end.offset;
        },
    };
};

/**
 * Default sub-parsers for handling CSS embedded in adblock filter rules.
 *
 * These parsers handle CSS selector lists and declaration lists found in:
 * - Element hiding rules (e.g., `example.com##.selector`)
 * - CSS injection rules (e.g., `example.com#$#.selector { style }`).
 *
 * The parsers extract and parse CSS syntax using @adguard/ecss-tree,
 * allowing linter rules to analyze CSS-specific patterns within filter rules.
 */
export const defaultSubParsers: LinterSubParsersConfig = {
    'ElementHidingRuleBody > Value.selectorList': createCssParser('selectorList'),
    'CssInjectionRuleBody > Value.selectorList': createCssParser('selectorList'),
    'ElementHidingRuleBody > Value.declarationList': createCssParser('declarationList'),
    'CssInjectionRuleBody > Value.declarationList': createCssParser('declarationList'),
    'CssInjectionRuleBody > Value.mediaQueryList': createCssParser('mediaQueryList'),

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
    //     childNodeKeys: ['children'],
    // },
};
