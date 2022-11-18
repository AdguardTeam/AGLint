import { AdblockSyntax } from "../utils/adblockers";

/**
 * Represents the main categories that an adblock rule can belong to.
 * Of course, these include additional subcategories.
 */
export enum RuleCategories {
    Comment = "Comment",
    Cosmetic = "Cosmetic",
    Network = "Network",
}

/**
 * Specifies the general structure of a rule. This information must
 * be included in all rules, regardless of category.
 */
export interface IRule {
    syntax: AdblockSyntax;
    category: RuleCategories;
    type: string;
}
