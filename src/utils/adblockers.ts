/**
 * Possible adblock syntaxes (supported by this library)
 * It also allows unknown syntax
 */
export enum AdblockSyntax {
    /** Unknown / common syntax */
    Unknown = "Unknown",

    /**
     * Adblock Plus
     *
     * @see {@link https://adblockplus.org/}
     */
    Abp = "AdblockPlus",

    /**
     * uBlock Origin
     *
     * @see {@link https://github.com/gorhill/uBlock}
     */
    Ubo = "UblockOrigin",

    /**
     * AdGuard
     *
     * @see {@link https://adguard.com/}
     */
    Adg = "AdGuard",
}

/**
 * Possible adblock syntaxes (supported by this library)
 */
export enum StrictAdblockSyntax {
    /**
     * Adblock Plus
     *
     * @see {@link https://adblockplus.org/}
     */
    Abp = "AdblockPlus",

    /**
     * uBlock Origin
     *
     * @see {@link https://github.com/gorhill/uBlock}
     */
    Ubo = "UblockOrigin",

    /**
     * AdGuard
     *
     * @see {@link https://adguard.com/}
     */
    Adg = "AdGuard",
}
