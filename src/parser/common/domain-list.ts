import { StringUtils } from "../../utils/string";

const DOMAIN_EXCEPTION_MARKER = "~";
const CLASSIC_DOMAIN_SEPARATOR = ",";
const MODIFIER_DOMAIN_SEPARATOR = "|";

/** "," for the classic domain list, and "|" for the "domain" modifier parameter  */
export type DomainListSeparator = typeof CLASSIC_DOMAIN_SEPARATOR | typeof MODIFIER_DOMAIN_SEPARATOR;

export interface IDomainList {
    type: "DomainList";
    separator: DomainListSeparator;
    domains: IDomain[];
}

export interface IDomain {
    /** Domain name */
    domain: string;

    /** Is exception? */
    exception: boolean;
}

export class DomainListParser {
    /**
     * Parses a domain list, eg. `example.com,example.org`
     *
     * @param {string} raw - Raw domain list
     * @param {DomainListSeparator} separator - Separator character
     * @returns {IDomainList} Domain list AST
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
            type: "DomainList",
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
                let subresult = "";

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
