import { Platform, PlatformExpressionEvaluator, type ProductCode } from '@adguard/agtree';

/**
 * Legacy platform aliases that AGLint configurations may still use.
 *
 * AGTree v5 no longer accepts these names directly:
 * - `*_ext_chromium` is not representable as a single `Platform`;
 * - `adg_safari_any` parses but expands to zero concrete platforms.
 *
 * Each alias is expanded to the equivalent v5 platform identifiers.
 */
const LEGACY_PLATFORM_ALIASES: ReadonlyMap<string, readonly string[]> = new Map([
    ['adg_ext_chromium', ['adg_ext_chrome', 'adg_ext_opera', 'adg_ext_edge']],
    ['ubo_ext_chromium', ['ubo_ext_chrome', 'ubo_ext_opera', 'ubo_ext_edge']],
    ['abp_ext_chromium', ['abp_ext_chrome', 'abp_ext_opera', 'abp_ext_edge']],
    ['adg_safari_any', ['adg_cb_safari', 'adg_cb_ios']],
]);

/**
 * Platform names supported by the linter configuration.
 */
export type PlatformNames = {
    /**
     * Concrete (non-wildcard) platform names.
     */
    specificPlatformNames: readonly string[];

    /**
     * Generic (wildcard) platform names, including legacy aliases.
     */
    genericPlatformNames: readonly string[];
};

let cachedPlatformNames: PlatformNames | null = null;

/**
 * Returns all platform names accepted by the linter configuration.
 *
 * Concrete names come from AGTree, generic names are derived from the
 * concrete platforms (so impossible combinations are not listed), and the
 * legacy aliases are added explicitly for backward compatibility.
 *
 * @returns Object with specific and generic platform names.
 */
export function getPlatformNames(): PlatformNames {
    if (cachedPlatformNames) {
        return cachedPlatformNames;
    }

    const concretePlatforms = Platform.getAllConcretePlatforms();
    const specificPlatformNames = concretePlatforms.map((platform) => platform.toString());

    const products = new Set<ProductCode>();
    const productTypes = new Set<string>();

    for (const platform of concretePlatforms) {
        products.add(platform.product);

        if (platform.type) {
            productTypes.add(`${platform.product}_${platform.type}`);
        }
    }

    const genericNames = new Set<string>();

    for (const product of products) {
        genericNames.add(`${product}_any`);
    }

    for (const productType of productTypes) {
        genericNames.add(`${productType}_any`);
    }

    genericNames.add(Platform.Any.toString());

    for (const alias of LEGACY_PLATFORM_ALIASES.keys()) {
        genericNames.add(alias);
    }

    cachedPlatformNames = {
        specificPlatformNames,
        genericPlatformNames: [...genericNames].sort(),
    };

    return cachedPlatformNames;
}

/**
 * Expands a single configuration entry into v5 platform names.
 *
 * @param entry Platform name, optionally prefixed with `~`.
 *
 * @returns One or more v5 platform names (with the same negation prefix).
 */
function normalizePlatformEntry(entry: string): string[] {
    const negated = entry.startsWith('~');
    const name = negated ? entry.slice(1) : entry;
    const alias = LEGACY_PLATFORM_ALIASES.get(name);

    if (!alias) {
        return [entry];
    }

    return alias.map((expanded) => (negated ? `~${expanded}` : expanded));
}

/**
 * Parses configured platform names into an optimized list of `Platform` objects.
 *
 * @param entries Platform names from the linter configuration.
 *
 * @returns Optimized `Platform` list (wildcards where possible), empty for no configuration.
 *
 * @throws Error if a platform name is unknown or the expression is invalid.
 */
export function parsePlatformExpression(entries: readonly string[]): Platform[] {
    if (entries.length === 0) {
        return [];
    }

    const names = getPlatformNames();
    const knownNames = new Set([
        ...names.specificPlatformNames,
        ...names.genericPlatformNames,
    ]);

    for (const entry of entries) {
        const name = entry.startsWith('~') ? entry.slice(1) : entry;

        if (!knownNames.has(name)) {
            throw new Error(`Unknown platform: ${name}`);
        }
    }

    const expression = entries
        .flatMap((entry) => normalizePlatformEntry(entry))
        .join('|');

    return PlatformExpressionEvaluator.optimize(
        PlatformExpressionEvaluator.evaluate(expression),
    );
}
