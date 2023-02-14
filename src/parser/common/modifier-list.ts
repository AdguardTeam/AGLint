import { EMPTY } from "../../utils/constants";
import { StringUtils } from "../../utils/string";

// Modifiers are separated by ",". For example: "script,domain=example.com"
const MODIFIERS_SEPARATOR = ",";

// Modifiers can be assigned. For example: "domain=example.com"
const MODIFIER_ASSIGN_OPERATOR = "=";

const MODIFIER_EXCEPTION_MARKER = "~";

export const MODIFIER_LIST_TYPE = "ModifierList";

/**
 * Represents a modifier list.
 *
 * @example
 * If the rule is
 * ```adblock
 * some-rule$script,domain=example.com
 * ```
 * then the list of modifiers will be `script,domain=example.com`.
 */
export interface ModifierList {
    // Basically, the idea is that each main AST part should have a type
    type: typeof MODIFIER_LIST_TYPE;
    modifiers: RuleModifier[];
}

/**
 * Represents a modifier.
 *
 * @example
 * If the modifier is `third-party`, the value of the modifier property
 * will be `third-party`, but the value will remain undefined.
 *
 * But if the modifier is `domain=example.com`, then the modifier property will be
 * `domain` and the value property will be `example.com`.
 */
export interface RuleModifier {
    /**
     * Modifier name
     */
    modifier: string;

    /**
     * Is this modifier an exception? For example, `~third-party` is an exception
     */
    exception?: boolean;

    /**
     * Modifier value (optional)
     */
    value?: string;
}

/**
 * `ModifierListParser` is responsible for parsing modifiers. Please note that the name is not uniform,
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
     * @param raw - Raw modifiers
     * @returns Parsed modifiers interface
     */
    public static parse(raw: string): ModifierList {
        const result: ModifierList = {
            type: MODIFIER_LIST_TYPE,
            modifiers: [],
        };

        const rawModifiersSplitted = StringUtils.splitStringByUnescapedCharacter(raw, MODIFIERS_SEPARATOR);

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
                let modifier = rawModifier.trim();
                let exception = false;

                if (modifier.startsWith(MODIFIER_EXCEPTION_MARKER)) {
                    modifier = modifier.slice(1);
                    exception = true;
                }

                result.modifiers.push({ modifier: modifier.trim(), exception });
            }

            // Modifier with value assignment, eg `redirect=value...`
            else {
                let modifier = rawModifier.substring(0, assignmentOperatorIndex).trim();
                let exception = false;

                if (modifier.startsWith(MODIFIER_EXCEPTION_MARKER)) {
                    modifier = modifier.slice(1);
                    exception = true;
                }

                result.modifiers.push({
                    modifier: modifier.trim(),
                    exception,
                    value: rawModifier.substring(assignmentOperatorIndex + 1).trim(),
                });
            }
        }

        return result;
    }

    /**
     * Converts a modifier list AST to a string.
     *
     * @param ast - Modifier list AST
     * @returns Raw string
     */
    public static generate(ast: ModifierList): string {
        const result = ast.modifiers
            .map(({ modifier, exception, value }) => {
                let subresult = EMPTY;

                if (exception) {
                    subresult += MODIFIER_EXCEPTION_MARKER;
                }

                subresult += modifier.trim();

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
