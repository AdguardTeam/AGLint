import { EMPTY } from "../../utils/constants";
import { StringUtils } from "../../utils/string";

const DOMAIN_EXCEPTION_MARKER = "~";

/**
 * Example rule:
 * ```adblock
 * ! Domains are separated by ",":
 * example.com,~example.org##.ads
 * ```
 */
const CLASSIC_DOMAIN_SEPARATOR = ",";

/**
 * Example rule:
 * ```adblock
 * ! Domains are separated by "|":
 * ads.js^$script,domains=example.com|~example.org
 * ```
 */
const MODIFIER_DOMAIN_SEPARATOR = "|";

export const DOMAIN_LIST_TYPE = "DomainList";

/** "," for the classic domain list, and "|" for the "domain" modifier parameter  */
export type DomainListSeparator = typeof CLASSIC_DOMAIN_SEPARATOR | typeof MODIFIER_DOMAIN_SEPARATOR;

/** Represents a list of domains, e.g. `example.com,~example.net`. */
export interface IDomainList {
    // Basically, the idea is that each main AST part should have a type
    type: typeof DOMAIN_LIST_TYPE;
    separator: DomainListSeparator;
    domains: IDomain[];
}

/** Represents an element of the domain list (a domain). */
export interface IDomain {
    /** Domain name */
    domain: string;

    /** Is exception (~ applied)? */
    exception: boolean;
}

/**
 * DomainListParser is responsible for parsing a domain list, e.g. `example.com,~example.net`.
 *
 * @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_domains}
 */
export class DomainListParser {
    /**
     * Parses a domain list, eg. `example.com,example.org,~example.org`
     *
     * @param {string} raw - Raw domain list
     * @param {DomainListSeparator} separator - Separator character
     * @returns {IDomainList} Domain list AST
     * @throws If the domain list is syntactically invalid
     */
    public static parse(raw: string, separator: DomainListSeparator = CLASSIC_DOMAIN_SEPARATOR): IDomainList {
        const domains: IDomain[] = [];
        const rawDomains = raw.trim().split(separator);

        for (const rawDomain of rawDomains) {
            const trimmedRawDomain = rawDomain.trim();

            // Handle empty parts
            if (trimmedRawDomain.length < 1 || trimmedRawDomain == DOMAIN_EXCEPTION_MARKER) {
                throw new SyntaxError(`Empty domain specified in domain list "${raw}"`);
            }

            // Handle exceptions
            if (trimmedRawDomain[0] == DOMAIN_EXCEPTION_MARKER) {
                if (StringUtils.isWhitespace(trimmedRawDomain[1])) {
                    throw new Error("Exception marker is followed by a whitespace character");
                } else if (trimmedRawDomain[1] == DOMAIN_EXCEPTION_MARKER) {
                    throw new Error("Exception marker is followed by another exception marker");
                }

                domains.push({ domain: trimmedRawDomain.slice(1), exception: true });
                continue;
            }

            domains.push({ domain: trimmedRawDomain, exception: false });
        }

        return {
            type: DOMAIN_LIST_TYPE,
            separator,
            domains,
        };
    }

    /**
     * Converts a domain list AST to a string.
     *
     * @param {IDomainList} ast - Domain list AST
     * @returns {string} Raw string
     */
    public static generate(ast: IDomainList): string {
        const result = ast.domains
            .map(({ domain, exception }) => {
                let subresult = EMPTY;

                if (exception) {
                    subresult += DOMAIN_EXCEPTION_MARKER;
                }

                subresult += domain.trim();

                return subresult;
            })
            .join(ast.separator);

        return result;
    }
}
