/**
 * Represents currently supported inline config comments
 */
export enum ConfigCommentType {
    /** Main config comment with configuration object */
    Main = "aglint",

    /** Disables AGLint until the next enable comment */
    Disable = "aglint-disable",

    /** Enables AGLint */
    Enable = "aglint-enable",

    /** Disables AGLint for next line */
    DisableNextLine = "aglint-disable-next-line",

    /** Enables AGLint for next line */
    EnableNextLine = "aglint-enable-next-line",
}
