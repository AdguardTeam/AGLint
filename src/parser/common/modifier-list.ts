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

        // Split modifiers by unescaped commas
        const rawModifiers = StringUtils.splitStringByUnescapedCharacter(raw, MODIFIERS_SEPARATOR);

        // Skip empty modifiers
        if (rawModifiers.length == 1 && rawModifiers[0].trim() == EMPTY) {
            return result;
        }

        // Parse each modifier separately
        for (const rawModifier of rawModifiers) {
            const trimmedRawModifier = rawModifier.trim();

            // Find the index of the first unescaped "=" character
            const assignmentOperatorIndex = StringUtils.findNextUnescapedCharacter(
                trimmedRawModifier,
                MODIFIER_ASSIGN_OPERATOR
            );

            const exception = trimmedRawModifier.startsWith(MODIFIER_EXCEPTION_MARKER);

            let modifier;
            let value;

            if (assignmentOperatorIndex === -1) {
                // Modifier without assigned value. For example: "third-party"
                modifier = trimmedRawModifier.substring(exception ? MODIFIER_EXCEPTION_MARKER.length : 0);
            } else {
                // Modifier with assigned value. For example: "domain=example.com"
                value = trimmedRawModifier.substring(assignmentOperatorIndex + MODIFIER_ASSIGN_OPERATOR.length).trim();
                modifier = trimmedRawModifier
                    .substring(exception ? MODIFIER_EXCEPTION_MARKER.length : 0, assignmentOperatorIndex)
                    .trim();
            }

            result.modifiers.push({
                modifier,
                value,
                exception,
            });
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
