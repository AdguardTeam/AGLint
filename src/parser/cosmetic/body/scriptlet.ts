/**
 * Scriptlet injection rule body parser
 */

import { AdblockSyntax } from "../../../utils/adblockers";
import { EMPTY, ESCAPE_CHARACTER, SPACE } from "../../../utils/constants";
import { DOUBLE_QUOTE_MARKER, REGEX_MARKER, SINGLE_QUOTE_MARKER, StringUtils } from "../../../utils/string";

const ADG_UBO_CALL_OPEN = "(";
const ADG_UBO_CALL_CLOSE = ")";
const ADG_UBO_PARAM_SEPARATOR = ",";
const ABP_SNIPPETS_SEPARATOR = ";";
const ABP_PARAM_SEPARATOR = " ";

export interface IScriptlet {
    scriptlet: IScriptletParameter;
    parameters?: IScriptletParameter[];
}

export enum ScriptletParameterType {
    Unquoted = "Unquoted",
    SingleQuoted = "SingleQuoted",
    DoubleQuoted = "DoubleQuoted",
    RegExp = "RegExp",
}

export interface IScriptletParameter {
    type: ScriptletParameterType;
    value: string;
}

export interface IScriptletRuleBody {
    scriptlets: IScriptlet[];
}

export class ScriptletBodyParser {
    /**
     * Parses a raw ADG/uBO scriptlet call body.
     *
     * @param {string} raw - Raw body
     * @returns {IScriptletRuleBody} Scriptlet rule body AST
     */
    public static parseAdgAndUboScriptletCall(raw: string): IScriptletRuleBody {
        const trimmed = raw.trim();

        // Call should contain: (arg0, arg1,...)
        if (trimmed[0] != ADG_UBO_CALL_OPEN) {
            throw new Error(
                `Invalid uBlock/AdGuard scriptlet call, no opening parentheses "${ADG_UBO_CALL_OPEN}" at call: "${raw}"`
            );
        } else if (!trimmed.endsWith(ADG_UBO_CALL_CLOSE)) {
            throw new Error(
                // eslint-disable-next-line max-len
                `Invalid uBlock/AdGuard scriptlet call, no closing parentheses "${ADG_UBO_CALL_CLOSE}" at call: "${raw}"`
            );
        }

        // Remove parentheses
        const rawParameterList = trimmed.slice(1, -1);

        const splittedRawParameterList = StringUtils.splitStringByUnquotedUnescapedCharacter(
            rawParameterList,
            ADG_UBO_PARAM_SEPARATOR
        ).map((param) => param.trim());

        // Empty case
        if (splittedRawParameterList[0] == EMPTY) {
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

    /**
     * Splits the parameters of an ABP snippet call.
     *
     * @param {string} raw - Raw snippet call
     * @returns {string[]} Splitted parameter list
     */
    private static splitAbpSnippetParameters(raw: string): string[] {
        const result: string[] = [];
        const trimmed = raw.trim();

        let openedQuote: string | null = null;
        let quotedArgStartIndex = -1;
        let unquotedArgStartIndex = -1;
        let collectedWhitespaces = EMPTY;

        for (let i = 0; i < trimmed.length; i++) {
            if (
                (trimmed[i] == SINGLE_QUOTE_MARKER || trimmed[i] == DOUBLE_QUOTE_MARKER) &&
                trimmed[i - 1] != ESCAPE_CHARACTER
            ) {
                if (!openedQuote) {
                    if (unquotedArgStartIndex != -1) {
                        result.push(collectedWhitespaces + trimmed.substring(unquotedArgStartIndex, i));
                        unquotedArgStartIndex = -1;
                        collectedWhitespaces = EMPTY;
                    }
                    openedQuote = trimmed[i];
                    quotedArgStartIndex = i;
                } else if (trimmed[i] == openedQuote) {
                    result.push(collectedWhitespaces + trimmed.substring(quotedArgStartIndex, i + 1));
                    openedQuote = null;
                    quotedArgStartIndex = -1;
                    collectedWhitespaces = EMPTY;
                }
            } else if (StringUtils.isWhitespace(trimmed[i]) && trimmed[i - 1] != ESCAPE_CHARACTER) {
                // Whitespaces are only relevant if we are not in a string
                if (!openedQuote) {
                    // If this space follows an unquoted argument, the argument must be stored
                    if (unquotedArgStartIndex != -1) {
                        result.push(collectedWhitespaces + trimmed.substring(unquotedArgStartIndex, i));
                        unquotedArgStartIndex = -1;
                        collectedWhitespaces = trimmed[i];
                    } else {
                        collectedWhitespaces += trimmed[i];
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
            result.push(collectedWhitespaces + trimmed.substring(unquotedArgStartIndex, trimmed.length));
        } else if (quotedArgStartIndex != -1) {
            result.push(collectedWhitespaces + trimmed.substring(quotedArgStartIndex, trimmed.length));
        }

        return result;
    }

    /**
     * Parses a raw ABP snippet call body.
     *
     * @param {string} raw - Raw body
     * @returns {IScriptletRuleBody | null} Scriptlet rule body AST
     */
    public static parseAbpSnippetCall(raw: string): IScriptletRuleBody {
        const scriptlets: IScriptlet[] = [];

        let trimmed = raw.trim();

        // Remove unnecessary ending semicolon (if present)
        if (trimmed.endsWith(ABP_SNIPPETS_SEPARATOR)) {
            trimmed = trimmed.slice(0, -1);
        }

        // It can contain multiple scriptlet calls delimeted by semicolon
        const rawScriptletCalls = StringUtils.splitStringByUnescapedNonStringNonRegexChar(
            trimmed,
            ABP_SNIPPETS_SEPARATOR
        );

        for (const rawScriptletCall of rawScriptletCalls) {
            const splittedRawParameterList = ScriptletBodyParser.splitAbpSnippetParameters(rawScriptletCall).map(
                (param) => param.trim()
            );

            // The scriptlet must be specified (parameters are optional)
            if (!splittedRawParameterList[0] || splittedRawParameterList[0] == EMPTY) {
                throw new SyntaxError(`No scriptlet specified at the following scriptlet call: "${raw}"`);
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

    /**
     * Converts an array of strings into an array of parameter interfaces.
     *
     * @param {string[]} params - Parameter list as array of strings
     * @returns {IScriptletParameter[]} Parameter list as array of parameter interfaces
     */
    private static decodeParameters(params: string[]): IScriptletParameter[] {
        return params.map((param) => {
            let type: ScriptletParameterType = ScriptletParameterType.Unquoted;

            if (param[0] == SINGLE_QUOTE_MARKER && param.endsWith(SINGLE_QUOTE_MARKER)) {
                type = ScriptletParameterType.SingleQuoted;
            } else if (param[0] == DOUBLE_QUOTE_MARKER && param.endsWith(DOUBLE_QUOTE_MARKER)) {
                type = ScriptletParameterType.DoubleQuoted;
            } else if (param[0] == REGEX_MARKER && param.endsWith(REGEX_MARKER)) {
                type = ScriptletParameterType.RegExp;
            }

            return {
                type,

                // If it is not unquoted, the boundaries should be removed:
                value: type != ScriptletParameterType.Unquoted ? param.slice(1, -1) : param,
            };
        });
    }

    /**
     * Converts an array of parameter interfaces into an array of strings.
     *
     * @param {IScriptletParameter[]} params - Parameter list as array of parameter interfaces
     * @returns {string[]} Parameter list as array of strings
     */
    private static encodeParameters(params: IScriptletParameter[]): string[] {
        return params.map(({ value, type }) => {
            switch (type) {
                case ScriptletParameterType.SingleQuoted:
                    return (
                        SINGLE_QUOTE_MARKER +
                        StringUtils.escapeCharacter(value, SINGLE_QUOTE_MARKER) +
                        SINGLE_QUOTE_MARKER
                    );

                case ScriptletParameterType.DoubleQuoted:
                    return (
                        DOUBLE_QUOTE_MARKER +
                        StringUtils.escapeCharacter(value, DOUBLE_QUOTE_MARKER) +
                        DOUBLE_QUOTE_MARKER
                    );

                case ScriptletParameterType.RegExp:
                    return REGEX_MARKER + StringUtils.escapeCharacter(value, REGEX_MARKER) + REGEX_MARKER;
            }

            return value;
        });
    }

    /**
     * Parses a raw cosmetic rule body as a scriptlet injection rule body.
     *
     * @param {string} raw - Raw body
     * @returns {IScriptletRuleBody | null} Scriptlet injection rule body AST
     */
    public static parse(raw: string): IScriptletRuleBody {
        const trimmed = raw.trim();

        // ADG and uBO calls always begins with parenthesis
        if (trimmed[0] == ADG_UBO_CALL_OPEN) {
            return ScriptletBodyParser.parseAdgAndUboScriptletCall(trimmed);
        }

        return ScriptletBodyParser.parseAbpSnippetCall(trimmed);
    }

    /**
     * Converts a scriptlet injection rule body AST to a string.
     *
     * @param {IScriptletRuleBody} ast - Scriptlet injection rule body AST
     * @param {AdblockSyntax} syntax - Desired syntax of the generated result
     * @returns {string} Raw string
     */
    public static generate(ast: IScriptletRuleBody, syntax: AdblockSyntax): string[] {
        const scriptlets = ast.scriptlets.map(({ scriptlet, parameters }) => {
            return ScriptletBodyParser.encodeParameters([scriptlet, ...(parameters || [])]);
        });

        if (syntax == AdblockSyntax.AdGuard || syntax == AdblockSyntax.uBlockOrigin) {
            return scriptlets.map((scriptlet) => `(${scriptlet.join(ADG_UBO_PARAM_SEPARATOR + SPACE)})`);
        }

        // ABP
        return scriptlets.map((scriptlet) => scriptlet.join(ABP_PARAM_SEPARATOR));
    }
}
