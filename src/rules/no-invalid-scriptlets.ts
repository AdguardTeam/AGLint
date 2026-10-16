import {
    hasProduct,
    type Parameter,
    Platform,
    QuoteUtils,
    type ScriptletInjectionRule,
    type ScriptletInjectionRuleBody,
    scriptletsCompatibilityTable,
    SYNTAX_ABP,
    SYNTAX_ADG,
    SYNTAX_UBO,
} from '@adguard/agtree';
import { search } from 'fast-fuzzy';
import * as v from 'valibot';

import { defineRule, LinterRuleType } from '../linter/rule';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

/**
 * Converts rule syntax flags to a product-level platform.
 *
 * @param syntax Rule syntax flags.
 *
 * @returns Product-level platform or null if the syntax is not supported.
 */
const convertSyntaxToProductLevelPlatform = (syntax: ScriptletInjectionRule['syntax']): Platform | null => {
    if (hasProduct(syntax, SYNTAX_ADG)) {
        return Platform.AdgAny;
    }

    if (hasProduct(syntax, SYNTAX_UBO)) {
        return Platform.UboAny;
    }

    if (hasProduct(syntax, SYNTAX_ABP)) {
        return Platform.AbpAny;
    }

    return null;
};

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-invalid-scriptlets',
            description: 'Checks if scriptlets are valid based on compatibility tables',
            // TODO: Make it recommended before v4 stable
            recommended: false,
            url: getBuiltInRuleDocumentationUrl('no-invalid-scriptlets'),
        },
        messages: {
            unknownScriptlet: "Unknown scriptlet '{{scriptlet}}' for '{{platform}}'",
            changeScriptlet: "Change scriptlet to '{{suggestedScriptlet}}'",
            // eslint-disable-next-line max-len
            scriptletShouldNotHaveParameters: "Scriptlet '{{scriptlet}}' should not have parameters, but {{actual}} parameters found",
            scriptletShouldHaveParameter: "Scriptlet '{{scriptlet}}' should have parameter '{{parameter}}'",
            // eslint-disable-next-line max-len
            invalidValueForParameter: "Invalid value '{{value}}' for parameter '{{parameter}}' in scriptlet '{{scriptlet}}'",
            // eslint-disable-next-line max-len
            tooManyParameters: "Scriptlet '{{scriptlet}}' has too many parameters, expected maximum {{max}}, got {{actual}}",
        },
        configSchema: v.tuple([
            v.strictObject({
                fuzzyThreshold: v.pipe(
                    v.number(),
                    v.minValue(0),
                    v.maxValue(1),
                    v.description('Minimum similarity threshold for fuzzy matching'),
                ),
            }),
        ]),
        defaultConfig: [
            {
                fuzzyThreshold: 0.6,
            },
        ],
        hasSuggestions: true,
        correctExamples: [
            {
                name: 'Valid AdGuard scriptlet call',
                code: '#%#//scriptlet("set-constant", "foo", "bar")',
            },
            {
                name: 'Valid uBlock Origin scriptlet call',
                code: '##+js(set.js, foo, bar)',
            },
            {
                name: 'Valid Adblock Plus scriptlet call',
                code: '#$#override-property-read foo bar',
            },
        ],
        incorrectExamples: [
            {
                name: 'Unknown AdGuard scriptlet',
                code: '#%#//scriptlet("unknown-scriptlet", "foo", "bar")',
            },
            {
                name: 'Unknown uBlock Origin scriptlet',
                code: '##+js(unknown-scriptlet.js, foo, bar)',
            },
            {
                name: 'Unknown Adblock Plus scriptlet',
                code: '#$#unknown-scriptlet foo bar',
            },
            {
                name: 'Required parameters are missing',
                code: '#%#//scriptlet("set-constant")',
            },
            {
                name: 'Parameters are specified for scriptlet that does not accept any',
                code: '#%#//scriptlet("log-addEventListener", "foo", "bar")',
            },
            {
                name: 'Too many parameters specified',
                code: '#%#//scriptlet("debug-on-property-read", "foo", "bar")',
            },
            {
                name: 'Almost correct scriptlet name, but misspelled',
                code: '#%#//scriptlet("pardot1.0")',
            },
        ],
        version: '4.0.0',
    },
    create: (context) => {
        const config = context.config[0];
        const regexCache = new Map<string, RegExp>();
        const nameCache = new Map<string, string[]>();

        let scriptletName: string | null = null;
        let scriptletRuleBody: ScriptletInjectionRuleBody | null = null;
        let platform: Platform | null = null;
        let scriptletData: ReturnType<typeof scriptletsCompatibilityTable.query> = null;
        let parameterIndex = 0;

        const getScriptletNames = (targetPlatform: Platform): string[] => {
            const cacheKey = targetPlatform.toString();

            if (!nameCache.has(cacheKey)) {
                const scriptlets = [...scriptletsCompatibilityTable.getAll(targetPlatform).values()].flat();
                const allScriptletNames = scriptlets.flatMap((scriptlet) => {
                    return scriptlet.aliases ? [scriptlet.name, ...scriptlet.aliases] : [scriptlet.name];
                });

                nameCache.set(cacheKey, Array.from(new Set(allScriptletNames)));
            }

            return nameCache.get(cacheKey)!;
        };

        return {
            'FilterList:exit': () => {
                regexCache.clear();
                nameCache.clear();
            },
            'ScriptletInjectionRule:exit': () => {
                scriptletName = null;
                scriptletRuleBody = null;
                platform = null;
                scriptletData = null;
                parameterIndex = 0;
            },
            ScriptletInjectionRule: (node: ScriptletInjectionRule) => {
                scriptletData = null;
                parameterIndex = 0;
                platform = convertSyntaxToProductLevelPlatform(node.syntax);
            },
            ScriptletInjectionRuleBody: (node: ScriptletInjectionRuleBody) => {
                scriptletRuleBody = node;
            },
            'ScriptletInjectionRuleBody:exit': () => {
                if (!scriptletData) {
                    return;
                }

                if (!scriptletData.parameters) {
                    // any other parameters are not allowed, only scriptlet name
                    if (parameterIndex > 0) {
                        context.report({
                            messageId: 'scriptletShouldNotHaveParameters',
                            data: {
                                scriptlet: scriptletName,
                                actual: parameterIndex,
                            },
                            node: scriptletRuleBody,
                        });
                    }

                    return;
                }

                if (parameterIndex > scriptletData.parameters.length) {
                    context.report({
                        messageId: 'tooManyParameters',
                        data: {
                            scriptlet: scriptletName,
                            max: scriptletData.parameters.length,
                            actual: parameterIndex,
                        },
                        node: scriptletRuleBody,
                    });

                    return;
                }

                // check if next possible parameters are required
                if (parameterIndex < scriptletData.parameters.length) {
                    let i = parameterIndex;
                    let nextParameterData = scriptletData.parameters[i];

                    // if its required, continue searching for required parameters
                    // note: required parameters are always come first in the array
                    while (nextParameterData && nextParameterData.required) {
                        context.report({
                            messageId: 'scriptletShouldHaveParameter',
                            data: {
                                scriptlet: scriptletName,
                                parameter: nextParameterData.name,
                            },
                            node: scriptletRuleBody,
                        });

                        i += 1;
                        nextParameterData = scriptletData.parameters[i];
                    }
                }
            },
            'ScriptletInjectionRule ParameterList Parameter': (node: Parameter) => {
                if (platform === null) {
                    return;
                }

                const valueUnquoted = node.value;

                if (scriptletName === null) {
                    scriptletName = valueUnquoted;
                    scriptletData = scriptletsCompatibilityTable.query(scriptletName, platform);

                    if (scriptletData === null) {
                        const range = context.getOffsetRangeForNode(node);

                        if (range === null) {
                            return;
                        }

                        const names = getScriptletNames(platform);
                        const possibleMatches = search(
                            scriptletName,
                            names,
                            {
                                threshold: config.fuzzyThreshold,
                            },
                        );

                        const actualQuote = node.quoteType;

                        context.report({
                            messageId: 'unknownScriptlet',
                            data: {
                                scriptlet: scriptletName,
                                platform: platform.toHumanReadable(),
                            },
                            node: scriptletRuleBody,
                            suggest: possibleMatches.map((match) => ({
                                messageId: 'changeScriptlet',
                                data: {
                                    suggestedScriptlet: match,
                                },
                                fix(fixer) {
                                    return fixer.replaceWithText(
                                        range,
                                        QuoteUtils.setStringQuoteType(match, actualQuote),
                                    );
                                },
                                node: scriptletRuleBody,
                            })),
                        });
                    }

                    return;
                }

                if (scriptletData?.parameters) {
                    const parameterData = scriptletData.parameters[parameterIndex];

                    if (parameterData && parameterData.pattern) {
                        if (!regexCache.has(parameterData.pattern)) {
                            regexCache.set(parameterData.pattern, new RegExp(parameterData.pattern));
                        }

                        if (!regexCache.get(parameterData.pattern)!.test(valueUnquoted)) {
                            context.report({
                                messageId: 'invalidValueForParameter',
                                data: {
                                    value: valueUnquoted,
                                    parameter: parameterData.name,
                                    scriptlet: scriptletName,
                                },
                                node,
                            });
                        }
                    }
                }

                parameterIndex += 1;
            },
        };
    },
});
