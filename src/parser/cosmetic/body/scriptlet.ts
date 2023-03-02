/**
 * Scriptlet injection rule body parser
 */

import { AdblockSyntax } from '../../../utils/adblockers';
import { EMPTY, SPACE } from '../../../utils/constants';
import {
    DOUBLE_QUOTE_MARKER, REGEX_MARKER, SINGLE_QUOTE_MARKER, StringUtils,
} from '../../../utils/string';

const ADG_UBO_CALL_OPEN = '(';
const ADG_UBO_CALL_CLOSE = ')';
const ADG_UBO_PARAM_SEPARATOR = ',';
const ABP_SNIPPETS_SEPARATOR = ';';
const ABP_PARAM_SEPARATOR = ' ';

/**
 * Represents the body of an scriptlet injection rule.
 *
 * Adblock Plus supports multiple scriptlets within a rule, so the data structure represents the
 * scriptlets as an array. AdGuard and uBlock Origin ONLY support one scriptlet per rule.
 */
export interface ScriptletRuleBody {
    /**
     * Scriptlet(s) to inject.
     */
    scriptlets: Scriptlet[];
}

/**
 * Represents a specific scriptlet and its parameters.
 */
export interface Scriptlet {
    /**
     * Scriptlet name. For example, if the rule is `example.com#%#//scriptlet('scriptlet0', 'arg0')`,
     * then the name is `scriptlet0`.
     */
    scriptlet: ScriptletParameter;

    /**
     * Scriptlet parameters. For example, if the rule is `example.com#%#//scriptlet('scriptlet0', 'arg0')`,
     * then the parameters are `[{type: 'SingleQuoted', value: 'arg0'}]`.
     */
    parameters?: ScriptletParameter[];
}

/** Represents a scriptlet parameter. */
export interface ScriptletParameter {
    /**
     * Parameter type. For example, if the parameter is `'arg0'`, then its type is `SingleQuoted`.
     */
    type: ScriptletParameterType;

    /**
     * Parameter value. For example, if the parameter is `'arg0'`, then its value is `arg0`.
     */
    value: string;
}

/**
 * Represents a scriptlet parameter type.
 *
 * For example, let's have the following rule: `example.com#%#//scriptlet('scriptlet0', 'arg0')`
 * Then the value of `'arg0'` is `arg0` and its type is `SingleQuoted`.
 */
export enum ScriptletParameterType {
    /**
     * Unquoted parameter.
     *
     * @example `value`
     */
    Unquoted = 'Unquoted',

    /**
     * Single-quoted parameter.
     *
     * @example `'value'`
     */
    SingleQuoted = 'SingleQuoted',

    /**
     * Double-quoted parameter.
     *
     * @example `"value"`
     */
    DoubleQuoted = 'DoubleQuoted',

    /**
     * Regular expression parameter.
     *
     * @example `/value/`
     */
    RegExp = 'RegExp',
}

/**
 * `ScriptletBodyParser` is responsible for parsing the body of a scriptlet rule.
 *
 * Please note that the parser will parse any scriptlet rule if it is syntactically correct.
 * For example, it will parse this:
 * ```adblock
 * example.com#%#//scriptlet('scriptlet0', 'arg0')
 * ```
 *
 * but it didn't check if the scriptlet `scriptlet0` actually supported by any adblocker.
 *
 * @see {@link https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#scriptlets}
 * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#scriptlet-injection}
 * @see {@link https://help.eyeo.com/adblockplus/snippet-filters-tutorial}
 */
export class ScriptletBodyParser {
    /**
     * Parses a raw ADG/uBO scriptlet call body.
     *
     * @param raw - Raw body
     * @returns Scriptlet rule body AST
     * @throws If there is no opening/closing parenthesis
     */
    public static parseAdgAndUboScriptletCall(raw: string): ScriptletRuleBody {
        const trimmed = raw.trim();

        // Call should contain: (arg0, arg1,...)
        if (trimmed[0] !== ADG_UBO_CALL_OPEN) {
            throw new Error(
                // eslint-disable-next-line max-len
                `Invalid uBlock/AdGuard scriptlet call, no opening parentheses "${ADG_UBO_CALL_OPEN}" at call: "${raw}"`,
            );
        } else if (!trimmed.endsWith(ADG_UBO_CALL_CLOSE)) {
            throw new Error(
                // eslint-disable-next-line max-len
                `Invalid uBlock/AdGuard scriptlet call, no closing parentheses "${ADG_UBO_CALL_CLOSE}" at call: "${raw}"`,
            );
        }

        // Remove parentheses
        const rawParameterList = trimmed.slice(1, -1);

        const splittedRawParameterList = StringUtils.splitStringByUnquotedUnescapedCharacter(
            rawParameterList,
            ADG_UBO_PARAM_SEPARATOR,
        ).map((param) => param.trim());

        // Empty case
        if (splittedRawParameterList[0] === EMPTY) {
            return {
                scriptlets: [],
            };
        }

        const parameterList = ScriptletBodyParser.decodeParameters(splittedRawParameterList);

        // Only one scriptlet is supported in AdGuard/uBlock Origin
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
     * Parses a raw ABP snippet call body.
     *
     * @param raw - Raw body
     * @returns Scriptlet rule body AST
     * @throws If no scriptlet is specified
     */
    public static parseAbpSnippetCall(raw: string): ScriptletRuleBody {
        const scriptlets: Scriptlet[] = [];

        let trimmed = raw.trim();

        // Remove unnecessary ending semicolon (if present)
        if (trimmed.endsWith(ABP_SNIPPETS_SEPARATOR)) {
            trimmed = trimmed.slice(0, -1);
        }

        // It can contain multiple scriptlet calls delimeted by semicolon
        const rawScriptletCalls = StringUtils.splitStringByUnescapedNonStringNonRegexChar(
            trimmed,
            ABP_SNIPPETS_SEPARATOR,
        );

        for (const rawScriptletCall of rawScriptletCalls) {
            const splittedRawParameterList = StringUtils.splitStringByUnescapedNonStringNonRegexChar(
                rawScriptletCall.trim(),
                ABP_PARAM_SEPARATOR,
            ).map((param) => param.trim());

            // The scriptlet must be specified (parameters are optional)
            if (!splittedRawParameterList[0] || splittedRawParameterList[0] === EMPTY) {
                throw new SyntaxError(`No scriptlet specified at the following scriptlet call: "${raw}"`);
            }

            const parameterList = ScriptletBodyParser.decodeParameters(splittedRawParameterList);

            scriptlets.push({
                scriptlet: parameterList[0],
                parameters: parameterList.slice(1),
            });
        }

        // Adblock Plus snippet call can contain multiple scriptlets
        return {
            scriptlets,
        };
    }

    /**
     * Converts an array of strings into an array of parameter interfaces.
     *
     * @param params - Parameter list as array of strings
     * @returns Parameter list as array of parameter interfaces
     */
    private static decodeParameters(params: string[]): ScriptletParameter[] {
        return params.map((param) => {
            let type: ScriptletParameterType = ScriptletParameterType.Unquoted;

            if (param[0] === SINGLE_QUOTE_MARKER && param.endsWith(SINGLE_QUOTE_MARKER)) {
                type = ScriptletParameterType.SingleQuoted;
            } else if (param[0] === DOUBLE_QUOTE_MARKER && param.endsWith(DOUBLE_QUOTE_MARKER)) {
                type = ScriptletParameterType.DoubleQuoted;
            } else if (param[0] === REGEX_MARKER && param.endsWith(REGEX_MARKER)) {
                type = ScriptletParameterType.RegExp;
            }

            return {
                type,

                // If it is not unquoted, the boundaries should be removed:
                value: type !== ScriptletParameterType.Unquoted ? param.slice(1, -1) : param,
            };
        });
    }

    /**
     * Converts an array of parameter interfaces into an array of strings.
     *
     * @param params - Parameter list as array of parameter interfaces
     * @returns Parameter list as array of strings
     */
    private static encodeParameters(params: ScriptletParameter[]): string[] {
        return params.map(({ value, type }) => {
            switch (type) {
                case ScriptletParameterType.SingleQuoted:
                    return (
                        SINGLE_QUOTE_MARKER
                        + StringUtils.escapeCharacter(value, SINGLE_QUOTE_MARKER)
                        + SINGLE_QUOTE_MARKER
                    );

                case ScriptletParameterType.DoubleQuoted:
                    return (
                        DOUBLE_QUOTE_MARKER
                        + StringUtils.escapeCharacter(value, DOUBLE_QUOTE_MARKER)
                        + DOUBLE_QUOTE_MARKER
                    );

                case ScriptletParameterType.RegExp:
                    return REGEX_MARKER + StringUtils.escapeCharacter(value, REGEX_MARKER) + REGEX_MARKER;

                default:
                    return value;
            }
        });
    }

    /**
     * Parses a raw cosmetic rule body as a scriptlet injection rule body.
     *
     * @param raw - Raw body
     * @returns Scriptlet injection rule body AST
     */
    public static parse(raw: string): ScriptletRuleBody {
        const trimmed = raw.trim();

        // ADG and uBO calls always begins with parenthesis
        if (trimmed[0] === ADG_UBO_CALL_OPEN) {
            return ScriptletBodyParser.parseAdgAndUboScriptletCall(trimmed);
        }

        return ScriptletBodyParser.parseAbpSnippetCall(trimmed);
    }

    /**
     * Converts a scriptlet injection rule body AST to a string.
     *
     * @param ast - Scriptlet injection rule body AST
     * @param syntax - Desired syntax of the generated result
     * @returns Raw string
     */
    public static generate(ast: ScriptletRuleBody, syntax: AdblockSyntax): string[] {
        const scriptlets = ast.scriptlets.map(({ scriptlet, parameters }) => {
            return ScriptletBodyParser.encodeParameters([scriptlet, ...(parameters || [])]);
        });

        if (syntax === AdblockSyntax.Adg || syntax === AdblockSyntax.Ubo) {
            return scriptlets.map((scriptlet) => `(${scriptlet.join(ADG_UBO_PARAM_SEPARATOR + SPACE)})`);
        }

        // ABP
        return scriptlets.map((scriptlet) => scriptlet.join(ABP_PARAM_SEPARATOR));
    }
}
