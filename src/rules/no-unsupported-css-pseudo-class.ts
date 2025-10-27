import { type PseudoClassSelectorPlain } from '@adguard/ecss-tree';
import { search } from 'fast-fuzzy';
import * as v from 'valibot';

import { defineRule, LinterRuleType } from '../linter/rule';
import { type LinterOffsetRange } from '../linter/source-code/source-code';

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

const DEFAULT_OPTIONS = {
    fuzzyThreshold: 0.6,
    additionalSupportedCssPseudoClasses: [],
    additionalSupportedExtCssPseudoClasses: [],
};

export default defineRule({
    meta: {
        type: LinterRuleType.Problem,
        docs: {
            name: 'no-unsupported-css-pseudo-class',
            description: 'Checks that CSS pseudo-classes are supported',
            recommended: true,
        },
        messages: {
            unsupportedPseudoClass: 'Unsupported CSS pseudo-class: {{pseudoClass}}',
            changePseudoClass: 'Change pseudo-class to {{suggestedPseudoClass}}',
        },
        configSchema: v.tuple([
            v.optional(
                v.object({
                    fuzzyThreshold: v.optional(v.pipe(
                        v.number(),
                        v.minValue(0),
                        v.maxValue(1),
                    ), DEFAULT_OPTIONS.fuzzyThreshold),
                    additionalSupportedCssPseudoClasses: v.optional(
                        v.array(v.string()),
                        DEFAULT_OPTIONS.additionalSupportedCssPseudoClasses,
                    ),
                    additionalSupportedExtCssPseudoClasses: v.optional(
                        v.array(v.string()),
                        DEFAULT_OPTIONS.additionalSupportedExtCssPseudoClasses,
                    ),
                }),
                DEFAULT_OPTIONS,
            ),
        ]),
        hasSuggestions: true,
    },
    create: (context) => {
        const config = context.config[0];
        const supportedCssPseudoClasses = new Set(
            [...SUPPORTED_CSS_PSEUDO_CLASSES, ...config.additionalSupportedCssPseudoClasses],
        );
        const supportedExtCssPseudoClasses = new Set(
            [...SUPPORTED_EXT_CSS_PSEUDO_CLASSES, ...config.additionalSupportedExtCssPseudoClasses],
        );
        const allSupportedPseudoClasses = [
            ...supportedCssPseudoClasses,
            ...supportedExtCssPseudoClasses,
        ];

        return {
            PseudoClassSelector: (node: PseudoClassSelectorPlain) => {
                if (supportedCssPseudoClasses.has(node.name) || supportedExtCssPseudoClasses.has(node.name)) {
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
