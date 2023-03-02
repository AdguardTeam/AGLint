/**
 * Represents categories of network rules.
 */
export enum NetworkRuleType {
    /**
     * Represents a basic network rule. Also known as "basic rule".
     *
     * @example
     * Example rules:
     *  - ```adblock
     *    /ads.js^$script
     *    ```
     * - ```adblock
     *   ||example.com^$third-party
     *   ```
     * - etc.
     */
    BasicNetworkRule = 'BasicNetworkRule',

    /**
     * Represents a header remover network rule.
     *
     * @example
     * Example rules:
     * - ```adblock
     *   ! AdGuard syntax
     *   ||example.org^$removeheader=header-name
     *   ```
     * - ```adblock
     *   ! uBlock syntax
     *   example.org##^responseheader(header-name)
     *   ```
     */
    RemoveHeaderNetworkRule = 'RemoveHeaderNetworkRule',

    // TODO: In the future, it will probably be necessary to refine the network rule parser with categories like these:
    // - RedirectNetworkRule,
    // - ResponseHeaderFilteringRule,
    // - etc.
}
