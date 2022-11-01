import { StringUtils } from "../../../utils/string";
import { IRuleModifier } from "../../common/modifier-list";

const PSEUDO_MARKER = ":";
const PSEUDO_OPEN = "(";
const PSEUDO_CLOSE = ")";

const UBO_COSMETIC_MODIFIERS = ["matches-path"];

export interface IuBlockModifierList {
    type: "uBlockModifierList";
    modifiers: IRuleModifier[];
    rest: string;
}

export class uBlockModifierListParser {
    public static parse(rawBody: string): IuBlockModifierList {
        const modifiers: IRuleModifier[] = [];
        let rest = "";

        let i = 0;
        while (i < rawBody.length) {
            if (rawBody[i] == PSEUDO_MARKER) {
                const modifier = UBO_COSMETIC_MODIFIERS.find(
                    (m) => rawBody.indexOf(`${m}${PSEUDO_OPEN}`, i + 1) == i + 1
                );
                if (modifier) {
                    const contentStart = i + modifier.length + 2;

                    const contentEnd = StringUtils.findNextUnescapedCharacter(
                        rawBody,
                        PSEUDO_CLOSE,
                        contentStart
                    );

                    modifiers.push({
                        modifier,
                        value: rawBody.substring(contentStart, contentEnd),
                    });

                    i = contentEnd + 1;
                    continue;
                }
            }

            // Store anything else
            rest += rawBody[i];
            i++;
        }

        return {
            type: "uBlockModifierList",
            modifiers,
            rest: rest.trim(),
        };
    }

    public static generate(ast: IuBlockModifierList): string {
        let result = "";

        result += ast.modifiers
            .map(({ modifier, value }) => {
                let subresult = "";

                subresult += PSEUDO_MARKER + modifier.trim();
                subresult += PSEUDO_OPEN;

                if (value) {
                    subresult += value.trim();
                }

                subresult += PSEUDO_CLOSE;

                return subresult;
            })
            .join("");

        if (result.length > 0) {
            result += " ";
        }

        result += ast.rest;

        return result;
    }
}
