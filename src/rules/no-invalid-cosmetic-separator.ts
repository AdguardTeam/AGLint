import {
    CosmeticRuleSeparator,
    type CssInjectionRule,
    type CssInjectionRuleBody,
    type ElementHidingRule,
    type Value,
} from '@adguard/agtree';
import { type DeclarationPlain, type PseudoClassSelectorPlain } from '@adguard/ecss-tree';

import { defineRule, LinterRuleType } from '../linter/rule';

import { SUPPORTED_EXT_CSS_PSEUDO_CLASSES } from './no-unsupported-css-pseudo-class';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-invalid-cosmetic-separator',
            description: 'Checks that rule separator matches selector/declaration capabilities',
            recommended: true,
        },
        messages: {
            useExtendedSeparator: 'Extended CSS is used in selector, replace "{{current}}" with "{{suggested}}"',
            useNativeSeparator: 'Native CSS selector detected, replace "{{current}}" with "{{suggested}}"',
            removeOnlyWithExtended: 'Declaration { remove: true; } is allowed only with "{{required}}" separator',
            changeSeparator: 'Change separator to "{{suggested}}"',
        },
        hasFix: true,
        hasSuggestions: true,
        correctExamples: [
            {
                name: 'Element hiding with extended selector',
                code: '#?#div:contains(a)',
            },
        ],
        incorrectExamples: [
            {
                name: 'Extended selector with native separator',
                code: '##div:contains(a)',
            },
            {
                name: 'Extended selector nested in :has() with native separator',
                code: '##div:has(> table:contains(a))',
            },
            {
                name: '`remove: true` with native CSS injection separator',
                code: '#$#a[href^="/bnlink/?bnid="] { remove: true; }',
            },
        ],
        version: '4.0.0',
    },
    create: (context) => {
        let currentRuleSeparator: Value;
        let currentRuleException = false;
        let hasPseudoClassSelectors = false;
        let hasExtendedDeclarations = false;

        return {
            ElementHidingRule: (node: ElementHidingRule) => {
                hasPseudoClassSelectors = false;
                hasExtendedDeclarations = false;
                currentRuleSeparator = node.separator;
                currentRuleException = !!node.exception;
            },

            'ElementHidingRuleBody:exit': (node: ElementHidingRule) => {
                if (!currentRuleSeparator) {
                    return;
                }

                const currentSeparatorValue = currentRuleSeparator.value;

                if (hasExtendedDeclarations) {
                    let suggested: string;

                    switch (currentSeparatorValue) {
                        case CosmeticRuleSeparator.AdgExtendedCssInjection:
                            suggested = CosmeticRuleSeparator.AdgExtendedCssInjection;
                            break;
                        case CosmeticRuleSeparator.AdgExtendedCssInjectionException:
                            suggested = CosmeticRuleSeparator.AdgExtendedCssInjectionException;
                            break;
                        default:
                            return;
                    }

                    if (currentRuleSeparator.start === undefined || currentRuleSeparator.end === undefined) {
                        return;
                    }
                    const separatorRange: [number, number] = [currentRuleSeparator.start, currentRuleSeparator.end];

                    context.report({
                        messageId: 'removeOnlyWithExtended',
                        data: {
                            required: suggested,
                        },
                        node,
                        suggest: [
                            {
                                messageId: 'changeSeparator',
                                data: {
                                    suggested,
                                },
                                fix: (fixer) => fixer.replaceWithText(separatorRange, suggested),
                            },
                        ],
                    });
                    return;
                }

                if (hasPseudoClassSelectors) {
                    const suggested = currentRuleException
                        ? CosmeticRuleSeparator.ExtendedElementHidingException
                        : CosmeticRuleSeparator.ExtendedElementHiding;

                    if (currentSeparatorValue === suggested) {
                        return;
                    }

                    if (currentRuleSeparator.start === undefined || currentRuleSeparator.end === undefined) {
                        return;
                    }
                    const separatorRange: [number, number] = [currentRuleSeparator.start, currentRuleSeparator.end];

                    context.report({
                        messageId: 'useExtendedSeparator',
                        data: {
                            current: currentSeparatorValue,
                            suggested,
                        },
                        node,
                        suggest: [
                            {
                                messageId: 'changeSeparator',
                                data: {
                                    suggested,
                                },
                                fix: (fixer) => fixer.replaceWithText(separatorRange, suggested),
                            },
                        ],
                    });
                } else if (currentSeparatorValue === CosmeticRuleSeparator.ExtendedElementHiding
                         || currentSeparatorValue === CosmeticRuleSeparator.ExtendedElementHidingException) {
                    const suggested = currentRuleException
                        ? CosmeticRuleSeparator.ElementHidingException
                        : CosmeticRuleSeparator.ElementHiding;

                    if (currentRuleSeparator.start === undefined || currentRuleSeparator.end === undefined) {
                        return;
                    }
                    const separatorRange: [number, number] = [currentRuleSeparator.start, currentRuleSeparator.end];

                    context.report({
                        messageId: 'useNativeSeparator',
                        data: {
                            current: currentSeparatorValue,
                            suggested,
                        },
                        node,
                        suggest: [
                            {
                                messageId: 'changeSeparator',
                                data: {
                                    suggested,
                                },
                                fix: (fixer) => fixer.replaceWithText(separatorRange, suggested),
                            },
                        ],
                    });
                }
            },

            CssInjectionRule: (node: CssInjectionRule) => {
                hasPseudoClassSelectors = false;
                hasExtendedDeclarations = false;
                currentRuleSeparator = node.separator;
                currentRuleException = !!node.exception;
            },

            'CssInjectionRuleBody:exit': (node: CssInjectionRuleBody) => {
                if (!currentRuleSeparator) {
                    return;
                }

                const needsExtended = hasPseudoClassSelectors || hasExtendedDeclarations;

                // Check if CSS injection rule needs extended separator
                if (needsExtended) {
                    const suggested = currentRuleException
                        ? CosmeticRuleSeparator.AdgExtendedCssInjectionException
                        : CosmeticRuleSeparator.AdgExtendedCssInjection;

                    if (currentRuleSeparator.value === suggested) {
                        return;
                    }

                    if (currentRuleSeparator.start === undefined || currentRuleSeparator.end === undefined) {
                        return;
                    }
                    const separatorRange: [number, number] = [currentRuleSeparator.start, currentRuleSeparator.end];

                    const messageId = hasExtendedDeclarations ? 'removeOnlyWithExtended' : 'useExtendedSeparator';
                    const dataKey = hasExtendedDeclarations ? 'required' : 'suggested';

                    context.report({
                        messageId,
                        data: {
                            [dataKey]: suggested,
                            ...(messageId === 'useExtendedSeparator' && { current: currentRuleSeparator.value }),
                        },
                        node,
                        suggest: [
                            {
                                messageId: 'changeSeparator',
                                data: { suggested },
                                fix: (fixer) => fixer.replaceWithText(separatorRange, suggested),
                            },
                        ],
                    });
                } else if (
                    currentRuleSeparator.value === CosmeticRuleSeparator.AdgExtendedCssInjection
                    || currentRuleSeparator.value === CosmeticRuleSeparator.AdgExtendedCssInjectionException
                ) {
                    const suggested = currentRuleException
                        ? CosmeticRuleSeparator.AdgCssInjectionException
                        : CosmeticRuleSeparator.AdgCssInjection;

                    if (currentRuleSeparator.start === undefined || currentRuleSeparator.end === undefined) {
                        return;
                    }
                    const separatorRange: [number, number] = [currentRuleSeparator.start, currentRuleSeparator.end];

                    context.report({
                        messageId: 'useNativeSeparator',
                        data: { current: currentRuleSeparator.value, suggested },
                        node,
                        suggest: [
                            {
                                messageId: 'changeSeparator',
                                data: { suggested },
                                fix: (fixer) => fixer.replaceWithText(separatorRange, suggested),
                            },
                        ],
                    });
                }
            },

            PseudoClassSelector: (node: PseudoClassSelectorPlain) => {
                const { name } = node;
                if (SUPPORTED_EXT_CSS_PSEUDO_CLASSES.has(name) && name !== 'has') {
                    hasPseudoClassSelectors = true;
                }
            },

            Declaration: (node: DeclarationPlain) => {
                if (node.property !== 'remove') {
                    return;
                }

                if (
                    node.value?.type === 'Value'
                    && node.value?.children.length === 1
                    && node.value.children[0]?.type === 'Identifier'
                    && node.value.children[0].name === 'true'
                ) {
                    hasExtendedDeclarations = true;
                }
            },
        };
    },
});
