import { AdblockSyntax } from '../utils/adblockers';

/**
 * Represents the main categories that an adblock rule can belong to.
 * Of course, these include additional subcategories.
 */
export enum RuleCategory {
    /**
     * Empty "rules" that are only containing whitespaces. These rules are handled just for convenience.
     */
    Empty = 'Empty',

    /**
     * Comment rules, such as comment rules, metadata rules, preprocessor rules, etc.
     */
    Comment = 'Comment',

    /**
     * Cosmetic rules, such as element hiding rules, CSS rules, scriptlet rules, HTML rules, and JS rules.
     */
    Cosmetic = 'Cosmetic',

    /**
     * Network rules, such as basic network rules, header remover network rules, redirect network rules,
     * response header filtering rules, etc.
     */
    Network = 'Network',
}

/**
 * Specifies the general structure of an adblock rule. This information must
 * be included in all rules, regardless of category.
 */
export interface Rule {
    /**
     * Syntax of the adblock rule (if cannot be clearly determined then the value is `Common`)
     */
    syntax: AdblockSyntax;

    /**
     * Category of the adblock rule (should be always present)
     */
    category: RuleCategory;

    /**
     * Type of the adblock rule (should be always present)
     */
    type: string;
}
