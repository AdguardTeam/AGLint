import { AdblockSyntax } from "../utils/adblockers";

export enum RuleCategories {
    Comment = "Comment",
    Cosmetic = "Cosmetic",
    Network = "Network",
}

export interface IRule {
    syntax: AdblockSyntax;
    category: RuleCategories;
    type: string;
}
