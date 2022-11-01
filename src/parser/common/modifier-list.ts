import { StringUtils } from "../../utils/string";

const MODIFIERS_SEPARATOR = ",";
const MODIFIER_ASSIGN_OPERATOR = "=";

export interface IModifierList {
    type: "ModifierList";
    modifiers: IRuleModifier[];
}

export interface IRuleModifier {
    /** Modifier name */
    modifier: string;

    /** Modifier value (optional) */
    value?: string;
}

export class ModifierListParser {
    /**
     * Parses the cosmetic rule modifiers, eg. `script,key=value`
     *
     * @param {string} rawModifiers - Raw modifiers
     * @returns {IRuleModifier} Parsed modifiers interface
     */
    public static parse(rawModifiers: string): IModifierList {
        const result: IModifierList = {
            type: "ModifierList",
            modifiers: [],
        };

        const rawModifiersSplitted = StringUtils.splitStringByUnescapedCharacter(
            rawModifiers,
            MODIFIERS_SEPARATOR
        );

        // Skip empty modifiers
        if (rawModifiersSplitted.length == 1 && rawModifiersSplitted[0].trim() == "") {
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
     * Converts AST to String.
     *
     * @param {IModifierList} ast
     * @returns {string} Raw data
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
