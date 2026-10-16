import {
    hasProduct,
    type Parameter,
    QuoteType,
    QuoteUtils,
    type ScriptletInjectionRule,
    SYNTAX_ABP,
    SYNTAX_ADG,
    SYNTAX_UBO,
} from '@adguard/agtree';
import * as v from 'valibot';

import { defineRule, LinterRuleType } from '../linter/rule';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'scriptlet-quotes',
            description: 'Checks quotes in scriptlet',
            // TODO: make it recommended later
            recommended: false,
            url: getBuiltInRuleDocumentationUrl('scriptlet-quotes'),
        },
        messages: {
            unexpectedQuote: 'Scriptlet argument should be quoted with {{quote}}, but {{actualQuote}} was found',
        },
        configSchema: v.tuple([
            v.strictObject({
                adg: v.enum(QuoteType),
                ubo: v.enum(QuoteType),
                abp: v.enum(QuoteType),
            }),
        ]),
        defaultConfig: [
            {
                adg: QuoteType.Double,
                ubo: QuoteType.None,
                abp: QuoteType.None,
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
        let syntax: ScriptletInjectionRule['syntax'] | undefined;

        /**
         * Returns the expected quote type for the current rule syntax.
         *
         * @returns Expected quote type, or undefined for unknown syntax.
         */
        const getExpectedQuoteType = (): QuoteType | undefined => {
            if (syntax === undefined) {
                return undefined;
            }

            if (hasProduct(syntax, SYNTAX_ADG)) {
                return context.config[0].adg;
            }

            if (hasProduct(syntax, SYNTAX_UBO)) {
                return context.config[0].ubo;
            }

            if (hasProduct(syntax, SYNTAX_ABP)) {
                return context.config[0].abp;
            }

            return undefined;
        };

        const checkScriptletArguments = (expectedQuoteType: QuoteType, scriptletArgument: Parameter) => {
            const actualQuoteType = scriptletArgument.quoteType;

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

                    return fixer.replaceWithText(
                        range,
                        QuoteUtils.setStringQuoteType(scriptletArgument.value, expectedQuoteType),
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
            'ScriptletInjectionRule ParameterList Parameter': (node: Parameter) => {
                const expectedQuoteType = getExpectedQuoteType();

                if (expectedQuoteType !== undefined) {
                    checkScriptletArguments(expectedQuoteType, node);
                }
            },
        };
    },
});
