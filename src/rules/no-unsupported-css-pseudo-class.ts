import { GenericPlatform } from '@adguard/agtree';
import { type PseudoClassSelectorPlain } from '@adguard/ecss-tree';
import { search } from 'fast-fuzzy';
import * as v from 'valibot';

import {
    SUPPORTED_ABP_PSEUDO_CLASSES,
    SUPPORTED_ADG_PSEUDO_CLASSES,
    SUPPORTED_CSS_PSEUDO_CLASSES,
    SUPPORTED_UBO_PSEUDO_CLASSES,
} from '../common/constants';
import { defineRule, LinterRuleType } from '../linter/rule';
import { type LinterOffsetRange } from '../linter/source-code/source-code';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-unsupported-css-pseudo-class',
            description: 'Checks that CSS pseudo-classes are supported',
            recommended: true,
            url: getBuiltInRuleDocumentationUrl('no-unsupported-css-pseudo-class'),
        },
        messages: {
            unsupportedPseudoClass: 'Unsupported CSS pseudo-class: {{pseudoClass}}',
            changePseudoClass: 'Change pseudo-class to {{suggestedPseudoClass}}',
        },
        configSchema: v.tuple([
            v.strictObject({
                fuzzyThreshold: v.pipe(
                    v.number(),
                    v.minValue(0),
                    v.maxValue(1),
                    v.description('Minimum similarity threshold for fuzzy matching'),
                ),
                additionalSupportedCssPseudoClasses: v.optional(
                    v.pipe(
                        v.array(v.string()),
                        v.description('Additional supported CSS pseudo-classes'),
                    ),
                ),
                additionalSupportedExtCssPseudoClasses: v.optional(
                    v.pipe(
                        v.array(v.string()),
                        v.description('Additional supported Extended CSS pseudo-classes'),
                    ),
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
                name: 'Known pseudo-class',
                code: '#?#*:has(.selector)',
            },
        ],
        incorrectExamples: [
            {
                name: 'Almost correct pseudo-class, but misspelled',
                code: '#?#*:contians(foo)',
            },
        ],
        version: '4.0.0',
    },
    create: (context) => {
        const config = context.config[0];

        // Build a unified set of all supported pseudo-classes based on platforms
        const allSupportedPseudoClassesSet = new Set<string>([
            ...SUPPORTED_CSS_PSEUDO_CLASSES,
            ...(config.additionalSupportedCssPseudoClasses ?? []),
            ...(config.additionalSupportedExtCssPseudoClasses ?? []),
        ]);

        if (context.platforms & GenericPlatform.AbpAny) {
            SUPPORTED_ABP_PSEUDO_CLASSES.forEach((cls) => allSupportedPseudoClassesSet.add(cls));
        }

        if (context.platforms & GenericPlatform.AdgAny) {
            SUPPORTED_ADG_PSEUDO_CLASSES.forEach((cls) => allSupportedPseudoClassesSet.add(cls));
        }

        if (context.platforms & GenericPlatform.UboAny) {
            SUPPORTED_UBO_PSEUDO_CLASSES.forEach((cls) => allSupportedPseudoClassesSet.add(cls));
        }

        // Convert to array for fuzzy search
        const allSupportedPseudoClasses = [...allSupportedPseudoClassesSet];

        return {
            PseudoClassSelector: (node: PseudoClassSelectorPlain) => {
                // Single set lookup replaces multiple conditional checks
                if (allSupportedPseudoClassesSet.has(node.name)) {
                    return;
                }

                const possibleMatches = search(
                    node.name,
                    allSupportedPseudoClasses,
                    {
                        threshold: config.fuzzyThreshold,
                    },
                );

                context.report({
                    messageId: 'unsupportedPseudoClass',
                    data: {
                        pseudoClass: node.name,
                    },
                    node,
                    suggest: possibleMatches.map((match) => ({
                        messageId: 'changePseudoClass',
                        data: {
                            suggestedPseudoClass: match,
                        },
                        fix(fixer) {
                            // +1 because of the colon
                            const start = node.loc!.start.offset + 1;
                            const range: LinterOffsetRange = [
                                start,
                                start + node.name.length,
                            ];
                            return fixer.replaceWithText(range, match);
                        },
                        node,
                    })),
                });
            },
        };
    },
});
