import { parse, type SyntaxParseError } from '@adguard/ecss-tree';

import { type CssTreeParsingContext, type CssTreeParsingContextToNode } from './css-tree-types';

/**
 * Helper function to parse CSS string into CSSTree node by using proper settings for the linter.
 *
 * @param rawCss Raw CSS string to parse.
 * @param context Parsing context. See {@link CssTreeParsingContext}.
 *
 * @returns The parsed CSS node.
 *
 * @throws SyntaxParseError if the CSS parsing fails.
 */
export const parseCss = <T extends CssTreeParsingContext>(
    rawCss: string,
    context: T,
): CssTreeParsingContextToNode[T] => {
    // https://github.com/csstree/csstree/blob/master/docs/parsing.md#parsesource-options
    return parse(rawCss, {
        context,
        positions: true,
        onParseError: (error: SyntaxParseError) => {
            throw error;
        },
    }) as CssTreeParsingContextToNode[T];
};
