import {
    CosmeticRuleSeparator,
    type CssInjectionRule,
    type CssInjectionRuleBody,
    type ElementHidingRule,
    type Value,
} from '@adguard/agtree';
import { type DeclarationPlain, type PseudoClassSelectorPlain } from '@adguard/ecss-tree';

import { REMOVE_PROPERTY, REMOVE_VALUE } from '../common/constants';
import { defineRule, LinterRuleType } from '../linter/rule';

/**
 * Supported Extended CSS pseudo-classes.
 *
 * These pseudo-classes are not supported by browsers natively, so we need Extended CSS library to support them.
 *
 * Please keep this list sorted alphabetically.
 */
export const SUPPORTED_EXT_CSS_PSEUDO_CLASSES = new Set([
    /**
     * Pseudo-classes :is(), and :not() may use native implementation.
     *
     * @see {@link https://github.com/AdguardTeam/ExtendedCss#extended-css-is}
     * @see {@link https://github.com/AdguardTeam/ExtendedCss#extended-css-not}
     */
    /**
     * :has() should also be conditionally considered as extended and should not be in this list,
     * for details check: https://github.com/AdguardTeam/ExtendedCss#extended-css-has,
     * but there is a bug with content blocker in safari:
     * for details check: https://bugs.webkit.org/show_bug.cgi?id=248868.
     *
     * TODO: remove 'has' later.
     */
    '-abp-contains', // alias for 'contains'
    '-abp-has', // alias for 'has'
    'contains',
    'has', // some browsers support 'has' natively
    'has-text', // alias for 'contains'
    'if',
    'if-not',
    'matches-attr',
    'matches-css',
    'matches-css-after', // deprecated, replaced by 'matches-css'
    'matches-css-before', // deprecated, replaced by 'matches-css'
    'matches-property',
    'nth-ancestor',
    'remove',
    'upward',
    'xpath',
    'style',
    'matches-media',
]);

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
            {
                name: '`remove: true` with extended CSS injection separator',
                code: '#?$#a[href^="/bnlink/?bnid="] { remove: true; }',
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
                    let suggestedSeparator: string;

                    switch (currentSeparatorValue) {
                        case CosmeticRuleSeparator.AdgExtendedCssInjection:
                            suggestedSeparator = CosmeticRuleSeparator.AdgExtendedCssInjection;
                            break;
                        case CosmeticRuleSeparator.AdgExtendedCssInjectionException:
                            suggestedSeparator = CosmeticRuleSeparator.AdgExtendedCssInjectionException;
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
                            required: suggestedSeparator,
                        },
                        node,
                        suggest: [
                            {
                                messageId: 'changeSeparator',
                                data: {
                                    suggested: suggestedSeparator,
                                },
                                fix: (fixer) => fixer.replaceWithText(separatorRange, suggestedSeparator),
                            },
                        ],
                    });
                    return;
                }

                if (hasPseudoClassSelectors) {
                    const suggestedSeparator = currentRuleException
                        ? CosmeticRuleSeparator.ExtendedElementHidingException
                        : CosmeticRuleSeparator.ExtendedElementHiding;

                    if (currentSeparatorValue === suggestedSeparator) {
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
                            suggested: suggestedSeparator,
                        },
                        node,
                        suggest: [
                            {
                                messageId: 'changeSeparator',
                                data: {
                                    suggested: suggestedSeparator,
                                },
                                fix: (fixer) => fixer.replaceWithText(separatorRange, suggestedSeparator),
                            },
                        ],
                    });
                } else if (currentSeparatorValue === CosmeticRuleSeparator.ExtendedElementHiding
                         || currentSeparatorValue === CosmeticRuleSeparator.ExtendedElementHidingException) {
                    const suggestedSeparator = currentRuleException
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
                            suggested: suggestedSeparator,
                        },
                        node,
                        suggest: [
                            {
                                messageId: 'changeSeparator',
                                data: {
                                    suggested: suggestedSeparator,
                                },
                                fix: (fixer) => fixer.replaceWithText(separatorRange, suggestedSeparator),
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
                    const suggestedSeparator = currentRuleException
                        ? CosmeticRuleSeparator.AdgExtendedCssInjectionException
                        : CosmeticRuleSeparator.AdgExtendedCssInjection;

                    if (currentRuleSeparator.value === suggestedSeparator) {
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
                            [dataKey]: suggestedSeparator,
                            ...(messageId === 'useExtendedSeparator' && { current: currentRuleSeparator.value }),
                        },
                        node,
                        suggest: [
                            {
                                messageId: 'changeSeparator',
                                data: { suggested: suggestedSeparator },
                                fix: (fixer) => fixer.replaceWithText(separatorRange, suggestedSeparator),
                            },
                        ],
                    });
                } else if (
                    currentRuleSeparator.value === CosmeticRuleSeparator.AdgExtendedCssInjection
                    || currentRuleSeparator.value === CosmeticRuleSeparator.AdgExtendedCssInjectionException
                ) {
                    const suggestedSeparator = currentRuleException
                        ? CosmeticRuleSeparator.AdgCssInjectionException
                        : CosmeticRuleSeparator.AdgCssInjection;

                    if (currentRuleSeparator.start === undefined || currentRuleSeparator.end === undefined) {
                        return;
                    }
                    const separatorRange: [number, number] = [currentRuleSeparator.start, currentRuleSeparator.end];

                    context.report({
                        messageId: 'useNativeSeparator',
                        data: { current: currentRuleSeparator.value, suggested: suggestedSeparator },
                        node,
                        suggest: [
                            {
                                messageId: 'changeSeparator',
                                data: { suggested: suggestedSeparator },
                                fix: (fixer) => fixer.replaceWithText(separatorRange, suggestedSeparator),
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
                if (node.property !== REMOVE_PROPERTY) {
                    return;
                }

                if (
                    node.value?.type === 'Value'
                    && node.value?.children.length === 1
                    && node.value.children[0]?.type === 'Identifier'
                    && node.value.children[0].name === REMOVE_VALUE
                ) {
                    hasExtendedDeclarations = true;
                }
            },
        };
    },
});
