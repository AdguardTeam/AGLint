/**
 * @file Helper file for CSSTree to provide better compatibility with TypeScript.
 * @see {@link https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/62536}
 */

import {
    type DeclarationList as DeclarationListNode,
    type Selector as SelectorNode,
    type SelectorList as SelectorListNode,
    type StyleSheet as StyleSheetNode,
    type Atrule as AtruleNode,
    type AtrulePrelude as AtrulePreludeNode,
    type MediaQueryList as MediaQueryListNode,
    type MediaQuery as MediaQueryNode,
    type Rule as RuleNode,
    type Block as BlockNode,
    type Declaration as DeclarationNode,
    type Value as ValueNode,
    type CssNodeCommon,
    type CssLocation,
} from '@adguard/ecss-tree';

/**
 * CSS tree node with location.
 * Its just a small helper as in the AGLint context we always had the location.
 */
export type CssNodeWithLocation<T extends CssNodeCommon> = T & { loc: CssLocation };

/**
 * CSSTree node types.
 *
 * @see {@link https://github.com/csstree/csstree/blob/master/docs/ast.md#node-types}
 */
export enum CssTreeNodeType {
    AnPlusB = 'AnPlusB',
    Atrule = 'Atrule',
    AtrulePrelude = 'AtrulePrelude',
    AttributeSelector = 'AttributeSelector',
    Block = 'Block',
    Brackets = 'Brackets',
    CDC = 'CDC',
    CDO = 'CDO',
    ClassSelector = 'ClassSelector',
    Combinator = 'Combinator',
    Comment = 'Comment',
    Declaration = 'Declaration',
    DeclarationList = 'DeclarationList',
    Dimension = 'Dimension',
    Function = 'Function',
    Hash = 'Hash',
    Identifier = 'Identifier',
    IdSelector = 'IdSelector',
    MediaFeature = 'MediaFeature',
    MediaQuery = 'MediaQuery',
    MediaQueryList = 'MediaQueryList',
    NestingSelector = 'NestingSelector',
    Nth = 'Nth',
    Number = 'Number',
    Operator = 'Operator',
    Parentheses = 'Parentheses',
    Percentage = 'Percentage',
    PseudoClassSelector = 'PseudoClassSelector',
    PseudoElementSelector = 'PseudoElementSelector',
    Ratio = 'Ratio',
    Raw = 'Raw',
    Rule = 'Rule',
    Selector = 'Selector',
    SelectorList = 'SelectorList',
    String = 'String',
    StyleSheet = 'StyleSheet',
    TypeSelector = 'TypeSelector',
    UnicodeRange = 'UnicodeRange',
    Url = 'Url',
    Value = 'Value',
    WhiteSpace = 'WhiteSpace',
}

/**
 * Parsing context for CSS tree.
 *
 * @see {@link https://github.com/csstree/csstree/blob/master/docs/parsing.md#context}
 */
export enum CssTreeParsingContext {
    Stylesheet = 'stylesheet',
    Atrule = 'atrule',
    AtrulePrelude = 'atrulePrelude',
    MediaQueryList = 'mediaQueryList',
    MediaQuery = 'mediaQuery',
    Rule = 'rule',
    SelectorList = 'selectorList',
    Selector = 'selector',
    Block = 'block',
    DeclarationList = 'declarationList',
    Declaration = 'declaration',
    Value = 'value',
}

/**
 * Mapping of parsing context to CSS tree node.
 * This helps us to provide better types for CSS node getters.
 */
export type CssTreeParsingContextToNode = {
    [CssTreeParsingContext.Stylesheet]: CssNodeWithLocation<StyleSheetNode>;
    [CssTreeParsingContext.Atrule]: CssNodeWithLocation<AtruleNode>;
    [CssTreeParsingContext.AtrulePrelude]: CssNodeWithLocation<AtrulePreludeNode>;
    [CssTreeParsingContext.MediaQueryList]: CssNodeWithLocation<MediaQueryListNode>;
    [CssTreeParsingContext.MediaQuery]: CssNodeWithLocation<MediaQueryNode>;
    [CssTreeParsingContext.Rule]: CssNodeWithLocation<RuleNode>;
    [CssTreeParsingContext.SelectorList]: CssNodeWithLocation<SelectorListNode>;
    [CssTreeParsingContext.Selector]: CssNodeWithLocation<SelectorNode>;
    [CssTreeParsingContext.Block]: CssNodeWithLocation<BlockNode>;
    [CssTreeParsingContext.DeclarationList]: CssNodeWithLocation<DeclarationListNode>;
    [CssTreeParsingContext.Declaration]: CssNodeWithLocation<DeclarationNode>;
    [CssTreeParsingContext.Value]: CssNodeWithLocation<ValueNode>;
};
