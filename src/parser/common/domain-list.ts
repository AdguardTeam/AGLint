import { EMPTY } from "../../utils/constants";
import { StringUtils } from "../../utils/string";

const DOMAIN_EXCEPTION_MARKER = "~";

/**
 * Classic domain separator.
 *
 * @example
 * ```adblock
 * ! Domains are separated by ",":
 * example.com,~example.org##.ads
 * ```
 */
const CLASSIC_DOMAIN_SEPARATOR = ",";

/**
 * Modifier domain separator.
 *
 * @example
 * ```adblock
 * ! Domains are separated by "|":
 * ads.js^$script,domains=example.com|~example.org
 * ```
 */
const MODIFIER_DOMAIN_SEPARATOR = "|";

export const DOMAIN_LIST_TYPE = "DomainList";

/**
 * Represents the separator used in a domain list.
 *
 * @example
 * "," for the classic domain list, and "|" for the "domain" modifier parameter
 */
export type DomainListSeparator = typeof CLASSIC_DOMAIN_SEPARATOR | typeof MODIFIER_DOMAIN_SEPARATOR;

/**
 * Represents a list of domains
 *
 * @example
 * `example.com,~example.net`.
 */
export interface DomainList {
    /**
     * Type of the node. Basically, the idea is that each main AST part should have a type
     */
    type: typeof DOMAIN_LIST_TYPE;

    /**
     * Separator used in the domain list.
     */
    separator: DomainListSeparator;

    /**
     * List of domains
     */
    domains: Domain[];
}

/** Represents an element of the domain list (a domain). */
export interface Domain {
    /**
     * Domain name
     */
    domain: string;

    /**
     * If the domain is an exception.
     *
     * @example
     * `~example.com` is an exception, but `example.com` is not. `~` is the exception marker here.
     */
    exception: boolean;
}

/**
 * `DomainListParser` is responsible for parsing a domain list.
 *
 * @example
 * - If the rule is `example.com,~example.net##.ads`, the domain list is `example.com,~example.net`.
 * - If the rule is `ads.js^$script,domains=example.com|~example.org`, the domain list is `example.com|~example.org`.
 * This parser is responsible for parsing these domain lists.
 * @see {@link https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide_domains}
 */
export class DomainListParser {
    /**
     * Parses a domain list, eg. `example.com,example.org,~example.org`
     *
     * @param raw - Raw domain list
     * @param separator - Separator character
     * @returns Domain list AST
     * @throws If the domain list is syntactically invalid
     */
    public static parse(raw: string, separator: DomainListSeparator = CLASSIC_DOMAIN_SEPARATOR): DomainList {
        const domains: Domain[] = [];
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
     * @param ast - Domain list AST
     * @returns Raw string
     */
    public static generate(ast: DomainList): string {
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
