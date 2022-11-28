/**
 * Possible adblock syntaxes (supported by this library)
 * It also allows unknown syntax
 */
export enum AdblockSyntax {
    /** Unknown / common */
    Unknown = "Unknown",

    /** Adblock Plus */
    Abp = "Abp",

    /** uBlock Origin */
    Ubo = "Ubo",

    /** AdGuard */
    Adg = "Adg",
}

/**
 * Possible adblock syntaxes (supported by this library)
 */
export enum StrictAdblockSyntax {
    /** Adblock Plus */
    Abp = "Abp",

    /** uBlock Origin */
    Ubo = "Ubo",

    /** AdGuard */
    Adg = "Adg",
}
