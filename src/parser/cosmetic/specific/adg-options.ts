import { StringUtils } from "../../../utils/string";
import { ModifierListParser, IRuleModifier } from "../../common/modifier-list";

const MODIFIER_LIST_OPEN = "[";
const MODIFIER_LIST_CLOSE = "]";
const MODIFIERS_MARKER = "$";

export interface IAdGuardModifierList {
    type: "AdGuardModifierList";
    modifiers: IRuleModifier[];
    rest: string;
}

export class AdGuardModifierListParser {
    /**
     * Parses an AdGuard modifier (option) list.
     *
     * @param {string} raw - Raw pattern
     * @returns {IAdGuardModifierList} Modifier list AST
     * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#non-basic-rules-modifiers}
     */
    public static parse(raw: string): IAdGuardModifierList {
        let modifiers: IRuleModifier[] = [];

        let closeIndex = -1;

        if (raw[0] == MODIFIER_LIST_OPEN) {
            if (raw[1] != MODIFIERS_MARKER) {
                throw new SyntaxError(`Missing modifier marker "${MODIFIERS_MARKER}" at pattern "${raw}"`);
            }

            // Find closing pair
            closeIndex = StringUtils.findNextUnescapedCharacter(raw, MODIFIER_LIST_CLOSE);

            // Handle missing closing case
            if (closeIndex == -1) {
                throw new SyntaxError(`Missing closing bracket "${MODIFIER_LIST_CLOSE}" at pattern "${raw}"`);
            }

            // Parse modifiers: [$<modofiers>]
            const rawModifiers = raw.substring(2, closeIndex).trim();
            if (rawModifiers.length == 0) {
                throw new SyntaxError(`No modifiers specified at pattern "${raw}"`);
            }

            modifiers = ModifierListParser.parse(rawModifiers).modifiers;
        }

        return {
            type: "AdGuardModifierList",
            modifiers,
            rest: closeIndex > -1 ? raw.substring(closeIndex + 1).trim() : raw.trim(),
        };
    }

    /**
     * Converts an AdGuard modifier (option) list AST to a string.
     *
     * @param {IAdGuardModifierList} ast - Modifier list AST
     * @returns {string} Raw string
     */
    public static generate(ast: IAdGuardModifierList) {
        let result = "";

        result += MODIFIER_LIST_OPEN;
        result += MODIFIERS_MARKER;

        result += ModifierListParser.generate({
            type: "ModifierList",
            modifiers: ast.modifiers,
        });

        result += MODIFIER_LIST_CLOSE;

        return result;
    }
}
