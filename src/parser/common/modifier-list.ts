import { EMPTY } from "../../utils/constants";
import { StringUtils } from "../../utils/string";

const MODIFIERS_SEPARATOR = ",";
const MODIFIER_ASSIGN_OPERATOR = "=";

export const MODIFIER_LIST_TYPE = "ModifierList";

/** Represents a modifier list, eg `script,domain=example.com`. */
export interface IModifierList {
    type: typeof MODIFIER_LIST_TYPE;
    modifiers: IRuleModifier[];
}

/**
 * Represents a modifier.
 *
 * For example, if the modifier is `third-party`, the value of the modifier property
 * will be `third-party`, but the value will remain undefined.
 *
 * But if the modifier is `domain=example.com`, then the modifier property will be
 * `domain` and the value property will be `example.com`.
 */
export interface IRuleModifier {
    /** Modifier name */
    modifier: string;

    /** Modifier value (optional) */
    value?: string;
}

/**
 * ModifierListParser is responsible for parsing modifiers. Please note that the name is not uniform,
 * "modifiers" are also known as "options".
 *
 * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#basic-rules-modifiers}
 * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#non-basic-rules-modifiers}
 * @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#options}
 */
export class ModifierListParser {
    /**
     * Parses the cosmetic rule modifiers, eg. `script,key=value`
     *
     * @param {string} rawModifiers - Raw modifiers
     * @returns {IRuleModifier} Parsed modifiers interface
     */
    public static parse(rawModifiers: string): IModifierList {
        const result: IModifierList = {
            type: MODIFIER_LIST_TYPE,
            modifiers: [],
        };

        const rawModifiersSplitted = StringUtils.splitStringByUnescapedCharacter(rawModifiers, MODIFIERS_SEPARATOR);

        // Skip empty modifiers
        if (rawModifiersSplitted.length == 1 && rawModifiersSplitted[0].trim() == EMPTY) {
            return result;
        }

        for (const rawModifier of rawModifiersSplitted) {
            const assignmentOperatorIndex = StringUtils.findNextUnescapedCharacter(
                rawModifier,
                MODIFIER_ASSIGN_OPERATOR
            );

            // Modifier without value, eg simply `script`
            if (assignmentOperatorIndex == -1) {
                result.modifiers.push({ modifier: rawModifier.trim() });
            }

            // Modifier with value assignment, eg `redirect=value...`
            else {
                result.modifiers.push({
                    modifier: rawModifier.substring(0, assignmentOperatorIndex).trim(),
                    value: rawModifier.substring(assignmentOperatorIndex + 1).trim(),
                });
            }
        }

        return result;
    }

    /**
     * Converts a modifier list AST to a string.
     *
     * @param {IModifierList} ast - Modifier list AST
     * @returns {string} Raw string
     */
    public static generate(ast: IModifierList): string {
        const result = ast.modifiers
            .map(({ modifier, value }) => {
                let subresult = modifier.trim();

                if (value) {
                    subresult += MODIFIER_ASSIGN_OPERATOR;
                    subresult += value.trim();
                }

                return subresult;
            })
            .join(MODIFIERS_SEPARATOR);

        return result;
    }
}
