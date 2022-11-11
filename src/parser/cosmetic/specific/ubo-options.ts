import { UBO_COSMETIC_MODIFIERS } from "../../../converter/cosmetic-modifiers";
import { CSS_PSEUDO_CLOSE, CSS_PSEUDO_MARKER, CSS_PSEUDO_OPEN, EMPTY, SPACE } from "../../../utils/constants";
import { StringUtils } from "../../../utils/string";
import { IRuleModifier } from "../../common/modifier-list";

export const UBO_MODIFIER_LIST_TYPE = "uBlockModifierList";

/** Represents uBlock's cosmetic rule modifiers. */
export interface IuBlockModifierList {
    type: typeof UBO_MODIFIER_LIST_TYPE;
    modifiers: IRuleModifier[];
    rest: string;
}

/**
 * UBlockModifierListParser is responsible for parsing uBlock cosmetic rule modifiers.
 *
 * They follow the syntax of pseudo classes, but they are actually part of the targeting,
 * not the selector.
 *
 * For example:
 * ```adblock
 * example.com##:matches-path(/path) .ads
 * ```
 */
export class UBlockModifierListParser {
    /**
     * Parses a uBO modifier (option) list.
     *
     * @param {string} raw - Raw pattern
     * @returns {IuBlockModifierList} Modifier list AST
     */
    public static parse(raw: string): IuBlockModifierList {
        const trimmed = raw.trim();
        const modifiers: IRuleModifier[] = [];

        let rest = EMPTY;

        let i = 0;
        while (i < trimmed.length) {
            if (trimmed[i] == CSS_PSEUDO_MARKER) {
                const modifier = UBO_COSMETIC_MODIFIERS.find(
                    // eslint-disable-next-line @typescript-eslint/no-loop-func
                    (m) => trimmed.indexOf(`${m}${CSS_PSEUDO_OPEN}`, i + 1) == i + 1
                );
                if (modifier) {
                    const contentStart = i + modifier.length + 2;

                    const contentEnd = StringUtils.findNextUnescapedCharacter(trimmed, CSS_PSEUDO_CLOSE, contentStart);

                    modifiers.push({
                        modifier,
                        value: trimmed.substring(contentStart, contentEnd),
                    });

                    i = contentEnd + 1;
                    continue;
                }
            }

            // Store anything else
            rest += trimmed[i];
            i++;
        }

        return {
            type: UBO_MODIFIER_LIST_TYPE,
            modifiers,
            rest: rest.trim(),
        };
    }

    /**
     * Converts a uBO modifier (option) list AST to a string.
     *
     * @param {IuBlockModifierList} ast - Modifier list AST
     * @returns {string} Raw string
     */
    public static generate(ast: IuBlockModifierList): string {
        let result = EMPTY;

        result += ast.modifiers
            .map(({ modifier, value }) => {
                let subresult = EMPTY;

                subresult += CSS_PSEUDO_MARKER + modifier.trim();
                subresult += CSS_PSEUDO_OPEN;

                if (value) {
                    subresult += value.trim();
                }

                subresult += CSS_PSEUDO_CLOSE;

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
