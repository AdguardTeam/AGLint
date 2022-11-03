/**
 * Scriptlet injection rule body parser
 */

import { AdblockSyntax } from "../../../utils/adblockers";
import { StringUtils } from "../../../utils/string";

export interface IScriptlet {
    scriptlet: IScriptletParameter;
    parameters?: IScriptletParameter[];
}

export type ScriptletParameterType = "Unquoted" | "SingleQuoted" | "DoubleQuoted" | "RegExp";

export interface IScriptletParameter {
    type: ScriptletParameterType;
    value: string;
}

export interface IScriptletRuleBody {
    scriptlets: IScriptlet[];
}

export class ScriptletBodyParser {
    public static parseAdgAndUboScriptletCall(rawCall: string): IScriptletRuleBody {
        // Call should contain: (arg0, arg1,...)
        if (rawCall[0] != "(") {
            throw new Error(`Invalid uBlock/AdGuard scriptlet call, no opening bracket "(" at call: "${rawCall}"`);
        } else if (!rawCall.endsWith(")")) {
            throw new Error(`Invalid uBlock/AdGuard scriptlet call, no closing bracket ")" at call: "${rawCall}"`);
        }

        // Remove parentheses
        const rawParameterList = rawCall.slice(1, -1);

        const splittedRawParameterList = StringUtils.splitStringByUnquotedUnescapedCharacter(rawParameterList, ",").map(
            (param) => param.trim()
        );

        // Empty case
        if (splittedRawParameterList[0] == "") {
            return {
                scriptlets: [],
            };
        }

        const parameterList = ScriptletBodyParser.decodeParameters(splittedRawParameterList);

        return {
            scriptlets: [
                {
                    scriptlet: parameterList[0],
                    parameters: parameterList.slice(1),
                },
            ],
        };
    }

    private static decodeParameters(params: string[]): IScriptletParameter[] {
        return params.map((param) => {
            let type: ScriptletParameterType = "Unquoted";

            if (param[0] == "'" && param.endsWith("'")) {
                type = "SingleQuoted";
            } else if (param[0] == '"' && param.endsWith('"')) {
                type = "DoubleQuoted";
            } else if (param[0] == "/" && param.endsWith("/")) {
                type = "RegExp";
            }

            return {
                type,
                value: type != "Unquoted" ? param.slice(1, -1) : param,
            };
        });
    }

    private static splitAbpSnippetParameters(args: string): string[] {
        let openedQuote: string | null = null;
        let quotedArgStartIndex = -1;
        let unquotedArgStartIndex = -1;
        let collectedWhitespaces = "";
        const result: string[] = [];
        for (let i = 0; i < args.length; i++) {
            if ((args[i] == '"' || args[i] == "'") && args[i - 1] != "\\") {
                if (!openedQuote) {
                    if (unquotedArgStartIndex != -1) {
                        result.push(collectedWhitespaces + args.substring(unquotedArgStartIndex, i));
                        unquotedArgStartIndex = -1;
                        collectedWhitespaces = "";
                    }
                    openedQuote = args[i];
                    quotedArgStartIndex = i;
                } else if (args[i] == openedQuote) {
                    result.push(collectedWhitespaces + args.substring(quotedArgStartIndex, i + 1));
                    openedQuote = null;
                    quotedArgStartIndex = -1;
                    collectedWhitespaces = "";
                }
            } else if ((args[i] == " " || args[i] == "\t") && args[i - 1] != "\\") {
                // Whitespaces are only relevant if we are not in a string
                if (!openedQuote) {
                    // If this space follows an unquoted argument, the argument must be stored
                    if (unquotedArgStartIndex != -1) {
                        result.push(collectedWhitespaces + args.substring(unquotedArgStartIndex, i));
                        unquotedArgStartIndex = -1;
                        collectedWhitespaces = args[i];
                    } else {
                        collectedWhitespaces += args[i];
                    }
                }
            } else {
                if (!openedQuote) {
                    if (unquotedArgStartIndex == -1) {
                        unquotedArgStartIndex = i;
                    }
                }
            }
        }
        if (unquotedArgStartIndex != -1) {
            result.push(collectedWhitespaces + args.substring(unquotedArgStartIndex, args.length));
        } else if (quotedArgStartIndex != -1) {
            result.push(collectedWhitespaces + args.substring(quotedArgStartIndex, args.length));
        }
        return result;
    }

    public static parseAbpSnippetCall(rawCall: string): IScriptletRuleBody {
        const scriptlets: IScriptlet[] = [];

        let trimmedRawCall = rawCall.trim();

        // Remove ending semicolon (if present)
        if (rawCall.endsWith(";")) {
            trimmedRawCall = rawCall.slice(0, -1);
        }

        // It can contain multiple scriptlet calls delimeted by semicolon
        const rawScriptletCalls = StringUtils.splitStringByUnescapedNonStringNonRegexChar(trimmedRawCall, ";");

        for (const rawScriptletCall of rawScriptletCalls) {
            const splittedRawParameterList = ScriptletBodyParser.splitAbpSnippetParameters(rawScriptletCall).map(
                (param) => param.trim()
            );

            // The scriptlet must be specified (parameters are optional)
            if (!splittedRawParameterList[0] || splittedRawParameterList[0] == "") {
                throw new SyntaxError(`No scriptlet specified at the following scriptlet call: "${rawCall}"`);
            }

            const parameterList = ScriptletBodyParser.decodeParameters(splittedRawParameterList);

            scriptlets.push({
                scriptlet: parameterList[0],
                parameters: parameterList.slice(1),
            });
        }

        return {
            scriptlets,
        };
    }

    public static parse(rawBody: string): IScriptletRuleBody {
        const rawCall = rawBody.trim();

        // ADG and uBO calls begins with (
        if (rawCall[0] == "(") {
            return ScriptletBodyParser.parseAdgAndUboScriptletCall(rawCall);
        }

        return ScriptletBodyParser.parseAbpSnippetCall(rawCall);
    }

    private static encodeParameters(params: IScriptletParameter[]): string[] {
        return params.map(({ value, type }) => {
            switch (type) {
                case "SingleQuoted":
                    return `'${StringUtils.escapeCharacter(value, "'")}'`;
                case "DoubleQuoted":
                    return `"${StringUtils.escapeCharacter(value, '"')}"`;
                case "RegExp":
                    return `/${StringUtils.escapeCharacter(value, "/")}/`;
            }

            return value;
        });
    }

    public static generate(ast: IScriptletRuleBody, syntax: AdblockSyntax): string[] {
        const scriptlets = ast.scriptlets.map(({ scriptlet, parameters }) => {
            return ScriptletBodyParser.encodeParameters([scriptlet, ...(parameters || [])]);
        });

        if (syntax == AdblockSyntax.AdGuard || syntax == AdblockSyntax.uBlockOrigin) {
            return scriptlets.map((scriptlet) => `(${scriptlet.join(", ")})`);
        }

        // ABP
        return scriptlets.map((scriptlet) => scriptlet.join(" "));
    }
}
