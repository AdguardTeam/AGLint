import {
    AdblockSyntax,
    QuoteType,
    QuoteUtils,
    type ScriptletInjectionRule,
    type Value,
} from '@adguard/agtree';
import * as v from 'valibot';

import { defineRule, LinterRuleType } from '../linter/rule';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

export const OPEN_CURLY_DOUBLE_QUOTE = '“';
export const CLOSE_CURLY_DOUBLE_QUOTE = '”';
export const OPEN_CURLY_SINGLE_QUOTE = '‘';
export const CLOSE_CURLY_SINGLE_QUOTE = '’';

/**
 * Check if a string is curly (smart) quoted.
 *
 * @param value The string to check.
 *
 * @returns True if the string is curly quoted, false otherwise.
 */
const isCurlyQuoted = (value: string): boolean => {
    return (value.startsWith(OPEN_CURLY_SINGLE_QUOTE) && value.endsWith(CLOSE_CURLY_SINGLE_QUOTE))
        || (value.startsWith(OPEN_CURLY_DOUBLE_QUOTE) && value.endsWith(CLOSE_CURLY_DOUBLE_QUOTE));
};

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'scriptlet-quotes',
            description: 'Checks quotes in scriptlet',
            recommended: true,
            url: getBuiltInRuleDocumentationUrl('scriptlet-quotes'),
        },
        messages: {
            unexpectedQuote: 'Scriptlet argument should be quoted with {{quote}}, but {{actualQuote}} was found',
            curlyQuotesDisallowed: 'Curly quotes are disallowed',
        },
        configSchema: v.tuple([
            v.strictObject({
                adg: v.enum(QuoteType),
                ubo: v.enum(QuoteType),
                abp: v.enum(QuoteType),
                disallowCurlyQuotes: v.boolean(),
            }),
        ]),
        defaultConfig: [
            {
                adg: QuoteType.Double,
                ubo: QuoteType.None,
                abp: QuoteType.None,
                disallowCurlyQuotes: true,
            },
        ],
        hasFix: true,
        correctExamples: [
            {
                name: 'Correct quotes',
                code: '#%#//scriptlet("scriptlet-name", "arg1", "arg2")',
            },
        ],
        incorrectExamples: [
            {
                name: 'Single quotes instead of double quotes',
                code: "#%#//scriptlet('scriptlet-name', 'arg1', 'arg2')",
            },
        ],
        version: '4.0.0',
    },
    create: (context) => {
        let syntax: AdblockSyntax | undefined;
        const checkScriptletArguments = (expectedQuoteType: QuoteType, scriptletArgument: Value<string>) => {
            // special case: disallow curly quotes on demand
            // note: QuoteUtils does not handle curly quotes, its just important at linter level,
            // not at parser level
            if (context.config[0].disallowCurlyQuotes && isCurlyQuoted(scriptletArgument.value)) {
                context.report({
                    messageId: 'curlyQuotesDisallowed',
                    node: scriptletArgument,
                    fix(fixer) {
                        const range = context.getOffsetRangeForNode(scriptletArgument);
                        if (!range) {
                            return null;
                        }
                        const { value } = scriptletArgument;
                        return fixer.replaceWithText(
                            range,
                            QuoteUtils.setStringQuoteType(value.slice(1, -1), expectedQuoteType),
                        );
                    },
                });
            }
            // handle regular quotes
            const actualQuoteType = QuoteUtils.getStringQuoteType(scriptletArgument.value);
            if (actualQuoteType === expectedQuoteType) {
                return;
            }
            context.report({
                messageId: 'unexpectedQuote',
                data: {
                    quote: expectedQuoteType,
                    actualQuote: actualQuoteType,
                },
                node: scriptletArgument,
                fix(fixer) {
                    const range = context.getOffsetRangeForNode(scriptletArgument);
                    if (!range) {
                        return null;
                    }
                    const { value } = scriptletArgument;

                    return fixer.replaceWithText(
                        range,
                        QuoteUtils.setStringQuoteType(value, expectedQuoteType),
                    );
                },
            });
        };
        return {
            ScriptletInjectionRule: (node: ScriptletInjectionRule) => {
                syntax = node.syntax;
            },
            'ScriptletInjectionRule:exit': () => {
                syntax = undefined;
            },
            'ScriptletInjectionRule ParameterList Value': (node: Value<string>) => {
                switch (syntax) {
                    case AdblockSyntax.Adg:
                        checkScriptletArguments(context.config[0].adg, node);
                        break;
                    case AdblockSyntax.Ubo:
                        checkScriptletArguments(context.config[0].ubo, node);
                        break;
                    case AdblockSyntax.Abp:
                        checkScriptletArguments(context.config[0].abp, node);
                        break;
                    default:
                }
            },
        };
    },
});
