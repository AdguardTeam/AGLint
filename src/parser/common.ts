import { AdblockSyntax } from "../utils/adblockers";

/**
 * Represents the main categories that an adblock rule can belong to.
 * Of course, these include additional subcategories.
 */
export enum RuleCategory {
    Comment = "Comment",
    Cosmetic = "Cosmetic",
    Network = "Network",
}

/**
 * Specifies the general structure of a rule. This information must
 * be included in all rules, regardless of category.
 */
export interface Rule {
    syntax: AdblockSyntax;
    category: RuleCategory;
    type: string;
}
