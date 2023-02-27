import {
    CssNode,
    parse as parseCss,
    walk as walkCss,
    generate as generateCss,
    Selector,
    PseudoClassSelector,
} from 'css-tree';
import { UBO_COSMETIC_MODIFIERS } from '../../../converter/cosmetic-modifiers';
import {
    CSS_NOT_PSEUDO,
    CSS_PSEUDO_CLOSE,
    CSS_PSEUDO_MARKER,
    CSS_PSEUDO_OPEN,
    EMPTY,
    SPACE,
} from '../../../utils/constants';
import { CssTreeNodeType, CssTreeParserContext } from '../../../utils/csstree-constants';
import { RuleModifier } from '../../misc/modifier-list';

export const UBO_MODIFIER_LIST_TYPE = 'UboModifierList';

/**
 * Represents uBlock's cosmetic rule modifiers.
 */
export interface UboModifierList {
    /**
     * Type of the node. Basically, the idea is that each main AST part should have a type
     */
    type: typeof UBO_MODIFIER_LIST_TYPE;

    /**
     * List of modifiers
     */
    modifiers: UboModifier[];

    /**
     * Rest of the pattern
     */
    rest: string;
}

/**
 * Represents a uBO modifier.
 *
 * This is a standard rule modifier interface with the addition of a not property to handle the following case:
 * ```adblock
 * example.com##:not(:matches-path(/path)) .ad
 * ```
 */
export interface UboModifier extends RuleModifier {
    /**
     * If the modifier is negated.
     */
    not?: boolean;
}

/**
 * `UboModifierListParser` is responsible for parsing uBlock cosmetic rule modifiers.
 *
 * They follow the syntax of pseudo classes, but they are actually part of the targeting,
 * not the selector.
 *
 * For example:
 * ```adblock
 * example.com##:matches-path(/path) .ads
 * ```
 */
export class UboModifierListParser {
    /**
     * Checks if there is a uBO modifier indicator in the selector.
     * The motivation is to have a lightweight check before expensive parsing.
     *
     * @param raw - Raw selector
     * @returns `true` if there is a uBO modifier indicator in the selector, `false` otherwise
     */
    public static hasUboModifierIndicators(raw: string): boolean {
        return (
            UBO_COSMETIC_MODIFIERS.find(
                // eslint-disable-next-line @typescript-eslint/no-loop-func
                (m) => raw.indexOf(`${CSS_PSEUDO_MARKER}${m}${CSS_PSEUDO_OPEN}`) !== -1,
            ) !== undefined
        );
    }

    /**
     * uBlock Origin uses rule modifiers in the selector. A striking example of this is `matches-path`, which
     * specifies the path within the domain. These modifiers are semantically part of the selector and follow
     * the pattern of CSS pseudo classes. However, in practice they are part of the targeting, not the selector.
     * This function takes them out of the selector and returns the selector without the known modifiers.
     *
     * Typically, these modifiers are listed at the beginning of the selector. For example, let's have this rule:
     * ```adblock
     * example.com##:matches-path(/article) .ad
     * ```
     *
     * Then `.ad` will only be blocked if we are somewhere within the `example.com/article` path. This is equivalent to
     * the following AdGuard rule:
     * ```adblock
     * [$path=/article]example.com##.ad
     * ```
     *
     * For example, for the `:matches-path(/article) .ad` selector, this function will return the following result:
     * ```json
     * {
     *   "modifiers": [
     *     { "modifier": "matches-path", "value": "/article", "not": false }
     *   ],
     *   "rest": ".ad"
     * }
     * ```
     *
     * When using not (`:not(:matches-path(/article)) .ad`), it works like this:
     * ```json
     * {
     *   "modifiers": [
     *     { "modifier": "matches-path", "value": "/article", "not": true }
     *   ],
     *   "rest": ".ad"
     * }
     * ```
     *
     * @see {@link https://github.com/gorhill/uBlock/wiki/Procedural-cosmetic-filters#subjectmatches-patharg}
     * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#non-basic-rules-modifiers-path}
     * @param raw - Raw selector
     * @returns Parsed uBO modifiers and rest of the selector
     */
    public static parse(raw: string): UboModifierList {
        const trimmed = raw.trim();

        // Handle empty case (otherwise CSSTree throws error for the empty selector)
        if (trimmed.length === 0) {
            return <UboModifierList>{
                type: UBO_MODIFIER_LIST_TYPE,
                modifiers: [],
                rest: EMPTY,
            };
        }

        // It is important that the CSSTree also stores the positions, since the uBO modifiers will have to be cut out
        const ast = <Selector>parseCss(trimmed, {
            context: CssTreeParserContext.selector,
            positions: true,
        });

        let prevPseudo: PseudoClassSelector | null = null;
        const modifiers: UboModifier[] = [];

        // Initially, we keep the entire selector
        const keep = Array(trimmed.length).fill(true);

        walkCss(ast, {
            enter: (node: CssNode) => {
                if (node.type === CssTreeNodeType.PseudoClassSelector) {
                    if (UBO_COSMETIC_MODIFIERS.includes(node.name)) {
                        // If the previous pseudo selector was :not(), then the
                        // entire :not(:ubo-modifier(...)) must be omitted
                        const common: RuleModifier = {
                            modifier: node.name,
                            // TODO: Fix CSSTree typedefs (first is getter now, not method)
                            // See: https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/62536
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            value: node && node.children ? generateCss(<any>node.children.first) : EMPTY,
                        };

                        if (prevPseudo && prevPseudo.name === CSS_NOT_PSEUDO) {
                            modifiers.push({
                                ...common,
                                not: true,
                            });

                            // At this point, the ESLint warning can be turned off, since
                            // we have  instructed CSSTree to parse the positions as well.
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            keep.fill(false, prevPseudo.loc!.start.offset, prevPseudo.loc!.end.offset);
                        } else {
                            modifiers.push({
                                ...common,
                                not: false,
                            });

                            // At this point, the ESLint warning can be turned off, since
                            // we have  instructed CSSTree to parse the positions as well.
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            keep.fill(false, node.loc!.start.offset, node.loc!.end.offset);
                        }
                    }

                    prevPseudo = node;
                }
            },
            leave: (node: CssNode) => {
                if (node.type === CssTreeNodeType.PseudoClassSelector) {
                    prevPseudo = null;
                }
            },
        });

        // Get rest
        let rest = EMPTY;

        for (let i = 0; i < raw.length; i += 1) {
            if (keep[i]) {
                rest += raw[i];
            }
        }

        return <UboModifierList>{
            type: UBO_MODIFIER_LIST_TYPE,
            modifiers,
            rest: rest.trim(),
        };
    }

    /**
     * Converts a uBO modifier (option) list AST to a string.
     *
     * @param ast - Modifier list AST
     * @returns Raw string
     */
    public static generate(ast: UboModifierList): string {
        let result = EMPTY;

        result += ast.modifiers
            .map(({ modifier, value, not }) => {
                let subresult = EMPTY;

                // Insert ":not("
                if (not) {
                    subresult += CSS_PSEUDO_MARKER;
                    subresult += CSS_NOT_PSEUDO;
                    subresult += CSS_PSEUDO_OPEN;
                }

                subresult += CSS_PSEUDO_MARKER;
                subresult += modifier.trim();
                subresult += CSS_PSEUDO_OPEN;

                if (value) {
                    subresult += value.trim();
                }

                subresult += CSS_PSEUDO_CLOSE;

                // Insert additional ")" for ":not("
                if (not) {
                    subresult += CSS_PSEUDO_CLOSE;
                }

                return subresult;
            })
            .join(EMPTY);

        if (result.length > 0) {
            result += SPACE;
        }

        result += ast.rest;

        return result;
    }
}
