import { parse } from "tldts";

// Linter stuff
import { GenericRuleContext } from "..";
import { LinterRule } from "../rule";
import { SEVERITY } from "../severity";

// Parser stuff
import { AnyRule } from "../../parser";
import { RuleCategory } from "../../parser/categories";

const WILDCARD = "*";
const WILDCARD_TLD = "." + WILDCARD;
const WILDCARD_SUBDOMAIN = WILDCARD + ".";

/**
 * Check if the input is a valid domain or hostname.
 *
 * @param domain Domain to check
 * @returns `true` if the domain is valid, `false` otherwise
 */
function isValidDomainOrHostname(domain: string): boolean {
    let domainToCheck = domain;

    // Wildcard-only domain, typically a generic rule
    if (domainToCheck === WILDCARD) {
        return true;
    }

    // https://adguard.com/kb/general/ad-filtering/create-own-filters/#wildcard-for-tld
    if (domainToCheck.endsWith(WILDCARD_TLD)) {
        // Remove the wildcard TLD
        domainToCheck = domainToCheck.substring(0, domainToCheck.length - WILDCARD_TLD.length);
    }

    if (domainToCheck.startsWith(WILDCARD_SUBDOMAIN)) {
        // Remove the wildcard subdomain
        domainToCheck = domainToCheck.substring(WILDCARD_SUBDOMAIN.length);
    }

    // Parse the domain with tldts
    const tldtsResult = parse(domainToCheck);

    // Check if the domain is valid
    return domainToCheck === tldtsResult.domain || domainToCheck === tldtsResult.hostname;
}

/**
 * Rule that checks if a preprocessor directive is known
 */
export const InvalidDomainList = <LinterRule>{
    meta: {
        severity: SEVERITY.error,
    },
    events: {
        onRule: (context: GenericRuleContext): void => {
            // TODO: Remove type assertion
            // Get actually iterated adblock rule
            const ast = <AnyRule>context.getActualAdblockRuleAst();
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            // Check if the rule is a cosmetic rule (any cosmetic rule)
            if (ast.category === RuleCategory.Cosmetic) {
                for (const { domain } of ast.domains) {
                    if (!isValidDomainOrHostname(domain)) {
                        context.report({
                            message: `Invalid domain "${domain}"`,
                            position: {
                                startLine: line,
                                startColumn: 0,
                                endLine: line,
                                endColumn: raw.length,
                            },
                        });
                    }
                }
            }
        },
    },
};
