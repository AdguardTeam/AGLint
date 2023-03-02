/**
 * Elementhiding rule body parser
 */

import {
    fromPlainObject, Selector, SelectorList, SelectorPlain, toPlainObject,
} from '@adguard/ecss-tree';
import { CSS_SELECTORS_SEPARATOR, SPACE } from '../../../utils/constants';
import { CssTree } from '../../../utils/csstree';
import { CssTreeNodeType, CssTreeParserContext } from '../../../utils/csstree-constants';
import { StringUtils } from '../../../utils/string';

/**
 * Represents an element hiding rule body. There can even be several selectors in a rule,
 * but the best practice is to place the selectors in separate rules.
 */
export interface ElementHidingRuleBody {
    /**
     * Element hiding rule selector(s).
     */
    selectors: SelectorPlain[];
}

/**
 * `ElementHidingBodyParser` is responsible for parsing element hiding rule bodies.
 *
 * It delegates CSS parsing to CSSTree, which is tolerant and therefore able to
 * parse Extended CSS parts as well.
 *
 * Please note that this parser will read ANY selector if it is syntactically correct.
 * Checking whether this selector is actually compatible with a given adblocker is not
 * done at this level.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors}
 * @see {@link https://github.com/AdguardTeam/ExtendedCss}
 * @see {@link https://github.com/gorhill/uBlock/wiki/Procedural-cosmetic-filters#cosmetic-filter-operators}
 * @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide-emulation}
 * @see {@link https://github.com/csstree/csstree/tree/master/docs}
 */
export class ElementHidingBodyParser {
    /**
     * Parses a raw cosmetic rule body as an element hiding rule body.
     *
     * @param raw - Raw body
     * @returns Element hiding rule body AST
     * @throws
     *   - If the selector is invalid according to the CSS syntax
     */
    public static parse(raw: string): ElementHidingRuleBody {
        const trimmed = raw.trim();

        const selectors: SelectorPlain[] = [];

        // Selector
        if (StringUtils.findNextUnescapedCharacter(trimmed, CSS_SELECTORS_SEPARATOR) === -1) {
            selectors.push(<SelectorPlain>CssTree.parsePlain(trimmed, CssTreeParserContext.selector));
        } else {
            // SelectorList
            const selectorListAst = <SelectorList>CssTree.parse(trimmed, CssTreeParserContext.selectorList);
            selectorListAst.children.forEach((child) => {
                if (child.type === CssTreeNodeType.Selector) {
                    selectors.push(<SelectorPlain>toPlainObject(child));
                }
            });
        }

        return {
            selectors,
        };
    }

    /**
     * Converts an element hiding rule body AST to a string.
     *
     * @param ast - Element hiding rule body AST
     * @returns Raw string
     */
    public static generate(ast: ElementHidingRuleBody): string {
        return ast.selectors
            .map((selector) => CssTree.generateSelector(<Selector>fromPlainObject(selector)))
            .join(CSS_SELECTORS_SEPARATOR + SPACE);
    }
}
