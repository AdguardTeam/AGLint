export const AGLINT_REPO_URL = 'https://github.com/AdguardTeam/AGLint';

/**
 * Get the documentation URL for the given AGLint rule.
 *
 * @param ruleId Rule ID.
 *
 * @returns Documentation URL.
 */
export const getAglintRuleDocumentationUrl = (ruleId: string): string => {
    return `${AGLINT_REPO_URL}/blob/master/docs/rules/${ruleId}.md`;
};
