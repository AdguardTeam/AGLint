import { GenericPlatform } from '@adguard/agtree';
import { type PseudoClassSelectorPlain } from '@adguard/ecss-tree';
import { search } from 'fast-fuzzy';
import * as v from 'valibot';

import { defineRule, LinterRuleType } from '../linter/rule';
import { type LinterOffsetRange } from '../linter/source-code/source-code';
import { getBuiltInRuleDocumentationUrl } from '../utils/repo-url';

// TODO: Use compatibility tables once they support Extended CSS pseudo-classes.
// https://github.com/AdguardTeam/tsurlfilter/issues/175

/**
 * Supported Extended CSS pseudo-classes.
 *
 * These pseudo-classes are not supported by browsers natively, so we need Extended CSS library to support them.
 *
 * Please keep this list sorted alphabetically.
 */
const SUPPORTED_ADG_PSEUDO_CLASSES: ReadonlySet<string> = new Set([
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
]);

/**
 * Supported ABP Extended CSS pseudo-classes.
 *
 * These pseudo-classes are not supported by browsers natively, so we need Extended CSS library to support them.
 *
 * Please keep this list sorted alphabetically.
 *
 * @see {@link https://help.adblockplus.org/hc/en-us/articles/360062733293-How-to-write-filters#elemhide-emulation}
 */
const SUPPORTED_ABP_PSEUDO_CLASSES: ReadonlySet<string> = new Set([
    '-abp-contains',
    '-abp-has',
    '-abp-properties',
    'xpath',
]);

/**
 * Supported uBlock procedural pseudo-classes.
 *
 * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#procedural-cosmetic-filters}
 * @see {@link https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#action-operators}
 */
const SUPPORTED_UBO_PSEUDO_CLASSES: ReadonlySet<string> = new Set([
    'has',
    'has-text',
    'matches-attr',
    'matches-css',
    'matches-css-after',
    'matches-css-before',
    'matches-media',
    'matches-path',
    'matches-prop',
    'min-text-length',
    'not',
    'others',
    'upward',
    'watch-attr',
    'xpath',

    // Action operators
    'remove',
    'remove-attr',
    'remove-class',
    'style',
]);

/**
 * Supported native CSS pseudo-classes.
 *
 * These pseudo-classes are supported by browsers natively, so we don't need Extended CSS library to support them.
 *
 * The problem with pseudo-classes is that any unknown pseudo-class makes browser ignore the whole CSS rule,
 * which contains a lot more selectors. So, if CSS selector contains a pseudo-class, we should try to validate it.
 * One more problem with pseudo-classes is that they are actively used in uBlock, hence it may mess AG styles.
 *
 * Please keep this list sorted alphabetically.
 */
export const SUPPORTED_CSS_PSEUDO_CLASSES = new Set([
    'active', // https://developer.mozilla.org/en-US/docs/Web/CSS/:active
    'checked', // https://developer.mozilla.org/en-US/docs/Web/CSS/:checked
    'disabled', // https://developer.mozilla.org/en-US/docs/Web/CSS/:disabled
    'empty', // https://developer.mozilla.org/en-US/docs/Web/CSS/:empty
    'enabled', // https://developer.mozilla.org/en-US/docs/Web/CSS/:enabled
    'first-child', // https://developer.mozilla.org/en-US/docs/Web/CSS/:first-child
    'first-of-type', // https://developer.mozilla.org/en-US/docs/Web/CSS/:first-of-type
    'focus', // https://developer.mozilla.org/en-US/docs/Web/CSS/:focus
    'has', // https://developer.mozilla.org/en-US/docs/Web/CSS/:has
    'hover', // https://developer.mozilla.org/en-US/docs/Web/CSS/:hover
    'in-range', // https://developer.mozilla.org/en-US/docs/Web/CSS/:in-range
    'invalid', // https://developer.mozilla.org/en-US/docs/Web/CSS/:invalid
    'is', // https://developer.mozilla.org/en-US/docs/Web/CSS/:is
    'lang', // https://developer.mozilla.org/en-US/docs/Web/CSS/:lang
    'last-child', // https://developer.mozilla.org/en-US/docs/Web/CSS/:last-child
    'last-of-type', // https://developer.mozilla.org/en-US/docs/Web/CSS/:last-of-type
    'link', // https://developer.mozilla.org/en-US/docs/Web/CSS/:link
    'not', // https://developer.mozilla.org/en-US/docs/Web/CSS/:not
    'nth-child', // https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-child
    'nth-last-child', // https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-last-child
    'nth-last-of-type', // https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-last-of-type
    'nth-of-type', // https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-of-type
    'only-child', // https://developer.mozilla.org/en-US/docs/Web/CSS/:only-child
    'only-of-type', // https://developer.mozilla.org/en-US/docs/Web/CSS/:only-of-type
    'optional', // https://developer.mozilla.org/en-US/docs/Web/CSS/:optional
    'out-of-range', // https://developer.mozilla.org/en-US/docs/Web/CSS/:out-of-range
    'read-only', // https://developer.mozilla.org/en-US/docs/Web/CSS/:read-only
    'read-write', // https://developer.mozilla.org/en-US/docs/Web/CSS/:read-write
    'required', // https://developer.mozilla.org/en-US/docs/Web/CSS/:required
    'root', // https://developer.mozilla.org/en-US/docs/Web/CSS/:root
    'target', // https://developer.mozilla.org/en-US/docs/Web/CSS/:target
    'valid', // https://developer.mozilla.org/en-US/docs/Web/CSS/:valid
    'visited', // https://developer.mozilla.org/en-US/docs/Web/CSS/:visited
    'where', // https://developer.mozilla.org/en-US/docs/Web/CSS/:where
]);

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
