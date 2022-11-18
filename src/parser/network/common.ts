/** Represents categories of network rules. */
export enum NetworkRuleType {
    BasicNetworkRule = "BasicNetworkRule",

    // TODO: In the future, it will probably be necessary to refine the network rule parser with categories like these:
    // - RedirectNetworkRule,
    // - ResponseHeaderFilteringRule,
    // - etc.
}
