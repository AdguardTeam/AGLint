import { AdblockSyntax } from '../utils/adblockers';
import { EMPTY } from '../utils/constants';
import { locRange } from '../utils/location';
import { CommentRuleParser } from './comment';
import { CosmeticRuleParser } from './cosmetic';
import { NetworkRuleParser } from './network';
import { AnyRule, RuleCategory, defaultLocation } from './common';

/**
 * `RuleParser` is responsible for parsing the rules.
 *
 * It automatically determines the category and syntax of the rule, so you can pass any kind of rule to it.
 */
export class RuleParser {
    /**
     * Parse an adblock rule. You can pass any kind of rule to this method, since it will automatically determine
     * the category and syntax. If the rule is syntactically invalid, then an error will be thrown. If the
     * syntax / compatibility cannot be determined clearly, then the value of the `syntax` property will be
     * `Common`.
     *
     * For example, let's have this network rule:
     * ```adblock
     * ||example.org^$important
     * ```
     * The `syntax` property will be `Common`, since the rule is syntactically correct in every adblockers, but we
     * cannot determine at parsing level whether `important` is an existing option or not, nor if it exists, then
     * which adblocker supports it. This is why the `syntax` property is simply `Common` at this point.
     * The concrete COMPATIBILITY of the rule will be determined later, in a different, higher-level layer, called
     * "Compatibility table".
     *
     * But we can determinate the concrete syntax of this rule:
     * ```adblock
     * example.org#%#//scriptlet("scriptlet0", "arg0")
     * ```
     * since it is clearly an AdGuard-specific rule and no other adblockers uses this syntax natively. However, we also
     * cannot determine the COMPATIBILITY of this rule, as it is not clear at this point whether the `scriptlet0`
     * scriptlet is supported by AdGuard or not. This is also the task of the "Compatibility table". Here, we simply
     * mark the rule with the `AdGuard` syntax in this case.
     *
     * @param raw Raw adblock rule
     * @param loc Base location of the rule
     * @returns Adblock rule AST
     * @throws If the input matches a pattern but syntactically invalid
     * @example
     * Take a look at the following example:
     * ```js
     * // Parse a network rule
     * const ast1 = RuleParser.parse("||example.org^$important");
     *
     * // Parse another network rule
     * const ast2 = RuleParser.parse("/ads.js^$important,third-party,domain=example.org|~example.com");
     *
     * // Parse a cosmetic rule
     * const ast2 = RuleParser.parse("example.org##.banner");
     *
     * // Parse another cosmetic rule
     * const ast3 = RuleParser.parse("example.org#?#.banner:-abp-has(.ad)");
     *
     * // Parse a comment rule
     * const ast4 = RuleParser.parse("! Comment");
     *
     * // Parse an empty rule
     * const ast5 = RuleParser.parse("");
     *
     * // Parse a comment rule (with metadata)
     * const ast6 = RuleParser.parse("! Title: Example");
     *
     * // Parse a pre-processor rule
     * const ast7 = RuleParser.parse("!#if (adguard)");
     * ```
     */
    public static parse(raw: string, loc = defaultLocation): AnyRule {
        // Empty lines / rules (handle it just for convenience)
        if (raw.trim().length === 0) {
            return {
                type: 'EmptyRule',
                loc: locRange(loc, 0, raw.length),
                category: RuleCategory.Empty,
                syntax: AdblockSyntax.Common,
            };
        }

        // Comment rules (agent / metadata / hint / pre-processor / comment)
        const comment = CommentRuleParser.parse(raw, loc);
        if (comment !== null) {
            return comment;
        }

        // Cosmetic rules / non-basic rules
        const cosmetic = CosmeticRuleParser.parse(raw, loc);
        if (cosmetic !== null) {
            return cosmetic;
        }

        // Network / basic rules
        const network = NetworkRuleParser.parse(raw, loc);

        return network;
    }

    /**
     * Converts a rule AST to a string.
     *
     * @param ast - Adblock rule AST
     * @returns Raw string
     * @example
     * Take a look at the following example:
     * ```js
     * // Parse the rule to the AST
     * const ast = RuleParser.parse("example.org##.banner");
     * // Generate the rule from the AST
     * const raw = RuleParser.generate(ast);
     * // Print the generated rule
     * console.log(raw); // "example.org##.banner"
     * ```
     */
    public static generate(ast: AnyRule): string {
        switch (ast.category) {
            // Empty lines
            case RuleCategory.Empty:
                return EMPTY;

            // Comment rules
            case RuleCategory.Comment:
                return CommentRuleParser.generate(ast);

            // Cosmetic / non-basic rules
            case RuleCategory.Cosmetic:
                return CosmeticRuleParser.generate(ast);

            // Network / basic rules
            case RuleCategory.Network:
                return NetworkRuleParser.generate(ast);

            default:
                throw new Error('Unknown rule category');
        }
    }
}
