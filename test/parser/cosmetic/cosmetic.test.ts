/* eslint-disable max-len */
import { DomainListParser } from "../../../src/parser/common/domain-list";
import { CssInjectionBodyParser } from "../../../src/parser/cosmetic/body/css";
import { ElementHidingBodyParser } from "../../../src/parser/cosmetic/body/elementhiding";
import { HtmlBodyParser } from "../../../src/parser/cosmetic/body/html";
import { ScriptletBodyParser } from "../../../src/parser/cosmetic/body/scriptlet";
import { CosmeticRuleType } from "../../../src/parser/cosmetic/common";
import { CosmeticRuleParser } from "../../../src/parser/cosmetic/cosmetic";
import { AdGuardModifierListParser } from "../../../src/parser/cosmetic/specific/adg-options";
import { UBlockModifierListParser } from "../../../src/parser/cosmetic/specific/ubo-options";
import { AdblockSyntax } from "../../../src/utils/adblockers";
import { EMPTY, SPACE } from "../../../src/utils/constants";

describe("CosmeticRuleParser", () => {
    test("isCosmetic", async () => {
        // Invalid
        expect(CosmeticRuleParser.isCosmetic(EMPTY)).toBe(false);
        expect(CosmeticRuleParser.isCosmetic(SPACE)).toBe(false);

        expect(CosmeticRuleParser.isCosmetic("! This is just a comment")).toBe(false);
        expect(CosmeticRuleParser.isCosmetic("# This is just a comment")).toBe(false);
        expect(CosmeticRuleParser.isCosmetic("! Title: Something")).toBe(false);
        expect(CosmeticRuleParser.isCosmetic("! example.com##.ad")).toBe(false);

        expect(CosmeticRuleParser.isCosmetic("example.com")).toBe(false);
        expect(CosmeticRuleParser.isCosmetic("||example.com")).toBe(false);
        expect(CosmeticRuleParser.isCosmetic("||example.com^$third-party")).toBe(false);
        expect(CosmeticRuleParser.isCosmetic("/ad.js^$script")).toBe(false);
        expect(CosmeticRuleParser.isCosmetic("/^regexp$/")).toBe(false);
        expect(CosmeticRuleParser.isCosmetic("@@/^regexp$/")).toBe(false);

        // Valid
        expect(CosmeticRuleParser.isCosmetic("##.ad")).toBe(true);
        expect(CosmeticRuleParser.isCosmetic("#@#.ad")).toBe(true);
        expect(CosmeticRuleParser.isCosmetic("##+js(something)")).toBe(true);
        expect(CosmeticRuleParser.isCosmetic("#@#+js(something)")).toBe(true);
        expect(CosmeticRuleParser.isCosmetic("##^script:has-text(antiadblock)")).toBe(true);
        expect(CosmeticRuleParser.isCosmetic('$$script[tag-content="antiadblock"]')).toBe(true);
    });

    test("parse", async () => {
        // Valid elemhide
        expect(CosmeticRuleParser.parse("##.ad")).toMatchObject({
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "##",
            body: ElementHidingBodyParser.parse(".ad"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net##.ad")).toMatchObject({
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "##",
            body: ElementHidingBodyParser.parse(".ad"),
        });

        expect(CosmeticRuleParser.parse("#@#.ad")).toMatchObject({
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@#",
            body: ElementHidingBodyParser.parse(".ad"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net#@#.ad")).toMatchObject({
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@#",
            body: ElementHidingBodyParser.parse(".ad"),
        });

        // Valid elemhide (extended)
        expect(CosmeticRuleParser.parse("#?#.ad:-abp-has(.ad)")).toMatchObject({
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "#?#",
            body: ElementHidingBodyParser.parse(".ad:-abp-has(.ad)"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net#?#.ad:-abp-has(.ad)")).toMatchObject({
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#?#",
            body: ElementHidingBodyParser.parse(".ad:-abp-has(.ad)"),
        });

        expect(CosmeticRuleParser.parse("#@?#.ad:-abp-has(.ad)")).toMatchObject({
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@?#",
            body: ElementHidingBodyParser.parse(".ad:-abp-has(.ad)"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net#@?#.ad:-abp-has(.ad)")).toMatchObject({
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@?#",
            body: ElementHidingBodyParser.parse(".ad:-abp-has(.ad)"),
        });

        // Valid CSS inject (AdGuard)
        expect(CosmeticRuleParser.parse("#$#body { padding: 0; }")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "#$#",
            body: CssInjectionBodyParser.parse("body { padding: 0; }"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net#$#body { padding: 0; }")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#$#",
            body: CssInjectionBodyParser.parse("body { padding: 0; }"),
        });

        expect(CosmeticRuleParser.parse("#@$#body { padding: 0; }")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@$#",
            body: CssInjectionBodyParser.parse("body { padding: 0; }"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net#@$#body { padding: 0; }")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@$#",
            body: CssInjectionBodyParser.parse("body { padding: 0; }"),
        });

        // Media queries
        expect(
            CosmeticRuleParser.parse("#$#@media (min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }")
        ).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "#$#",
            body: CssInjectionBodyParser.parse(
                "@media (min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }"
            ),
        });

        expect(
            CosmeticRuleParser.parse("#$#@media(min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }")
        ).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "#$#",
            body: CssInjectionBodyParser.parse(
                "@media(min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }"
            ),
        });

        expect(
            CosmeticRuleParser.parse(
                "example.com,~example.net#$#@media (min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }"
            )
        ).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#$#",
            body: CssInjectionBodyParser.parse(
                "@media (min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }"
            ),
        });

        // Valid ExtendedCSS inject (AdGuard)
        expect(CosmeticRuleParser.parse("#$?#body:-abp-has(.ad) { padding: 0; }")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "#$?#",
            body: CssInjectionBodyParser.parse("body:-abp-has(.ad) { padding: 0; }"),
        });

        expect(
            CosmeticRuleParser.parse("example.com,~example.net#$?#body:-abp-has(.ad) { padding: 0; }")
        ).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#$?#",
            body: CssInjectionBodyParser.parse("body:-abp-has(.ad) { padding: 0; }"),
        });

        expect(CosmeticRuleParser.parse("#@$?#body:-abp-has(.ad) { padding: 0; }")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@$?#",
            body: CssInjectionBodyParser.parse("body:-abp-has(.ad) { padding: 0; }"),
        });

        expect(
            CosmeticRuleParser.parse("example.com,~example.net#@$?#body:-abp-has(.ad) { padding: 0; }")
        ).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@$?#",
            body: CssInjectionBodyParser.parse("body:-abp-has(.ad) { padding: 0; }"),
        });

        // Valid CSS inject (uBlock)
        expect(CosmeticRuleParser.parse("##body:style(padding: 0;)")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "##",
            body: CssInjectionBodyParser.parse("body:style(padding: 0;)"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net##body:style(padding: 0;)")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "##",
            body: CssInjectionBodyParser.parse("body:style(padding: 0;)"),
        });

        expect(CosmeticRuleParser.parse("#@#body:style(padding: 0;)")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@#",
            body: CssInjectionBodyParser.parse("body:style(padding: 0;)"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net#@#body:style(padding: 0;)")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@#",
            body: CssInjectionBodyParser.parse("body:style(padding: 0;)"),
        });

        // Valid ExtendedCSS inject (uBlock)
        expect(CosmeticRuleParser.parse("##body:has(.ad):style(padding: 0;)")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "##",
            body: CssInjectionBodyParser.parse("body:has(.ad):style(padding: 0;)"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net##body:has(.ad):style(padding: 0;)")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "##",
            body: CssInjectionBodyParser.parse("body:has(.ad):style(padding: 0;)"),
        });

        expect(CosmeticRuleParser.parse("#@#body:has(.ad):style(padding: 0;)")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@#",
            body: CssInjectionBodyParser.parse("body:has(.ad):style(padding: 0;)"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net#@#body:has(.ad):style(padding: 0;)")).toMatchObject({
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@#",
            body: CssInjectionBodyParser.parse("body:has(.ad):style(padding: 0;)"),
        });

        // Valid scriptlet inject (AdGuard)
        expect(CosmeticRuleParser.parse("#%#//scriptlet('scriptlet0', 'arg0', 'arg1')")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "#%#//scriptlet",
            body: ScriptletBodyParser.parse("('scriptlet0', 'arg0', 'arg1')"),
        });

        expect(
            CosmeticRuleParser.parse("example.com,~example.net#%#//scriptlet('scriptlet0', 'arg0', 'arg1')")
        ).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#%#//scriptlet",
            body: ScriptletBodyParser.parse("('scriptlet0', 'arg0', 'arg1')"),
        });

        expect(CosmeticRuleParser.parse("#@%#//scriptlet('scriptlet0', 'arg0', 'arg1')")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@%#//scriptlet",
            body: ScriptletBodyParser.parse("('scriptlet0', 'arg0', 'arg1')"),
        });

        expect(
            CosmeticRuleParser.parse("example.com,~example.net#@%#//scriptlet('scriptlet0', 'arg0', 'arg1')")
        ).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@%#//scriptlet",
            body: ScriptletBodyParser.parse("('scriptlet0', 'arg0', 'arg1')"),
        });

        // Valid scriptlet inject (uBlock)
        expect(CosmeticRuleParser.parse("##+js(scriptlet0, arg0, arg1)")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "##+js",
            body: ScriptletBodyParser.parse("(scriptlet0, arg0, arg1)"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net##+js(scriptlet0, arg0, arg1)")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "##+js",
            body: ScriptletBodyParser.parse("(scriptlet0, arg0, arg1)"),
        });

        expect(CosmeticRuleParser.parse("#@#+js(scriptlet0, arg0, arg1)")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@#+js",
            body: ScriptletBodyParser.parse("(scriptlet0, arg0, arg1)"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net#@#+js(scriptlet0, arg0, arg1)")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@#+js",
            body: ScriptletBodyParser.parse("(scriptlet0, arg0, arg1)"),
        });

        // Valid scriptlet inject (ABP)
        expect(CosmeticRuleParser.parse("#$#scriptlet0 arg0 arg1")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "#$#",
            body: ScriptletBodyParser.parse("scriptlet0 arg0 arg1"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net#$#scriptlet0 arg0 arg1")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#$#",
            body: ScriptletBodyParser.parse("scriptlet0 arg0 arg1"),
        });

        expect(CosmeticRuleParser.parse("#@$#scriptlet0 arg0 arg1")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@$#",
            body: ScriptletBodyParser.parse("scriptlet0 arg0 arg1"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net#@$#scriptlet0 arg0 arg1")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@$#",
            body: ScriptletBodyParser.parse("scriptlet0 arg0 arg1"),
        });

        expect(CosmeticRuleParser.parse("#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "#$#",
            body: ScriptletBodyParser.parse("scriptlet0 arg00 arg01; scriptlet1 arg10 arg11"),
        });

        expect(
            CosmeticRuleParser.parse("example.com,~example.net#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11")
        ).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#$#",
            body: ScriptletBodyParser.parse("scriptlet0 arg00 arg01; scriptlet1 arg10 arg11"),
        });

        expect(CosmeticRuleParser.parse("#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@$#",
            body: ScriptletBodyParser.parse("scriptlet0 arg00 arg01; scriptlet1 arg10 arg11"),
        });

        expect(
            CosmeticRuleParser.parse("example.com,~example.net#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;")
        ).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@$#",
            body: ScriptletBodyParser.parse("scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;"),
        });

        expect(CosmeticRuleParser.parse("#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "#$#",
            body: ScriptletBodyParser.parse("scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;"),
        });

        expect(
            CosmeticRuleParser.parse("example.com,~example.net#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;")
        ).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#$#",
            body: ScriptletBodyParser.parse("scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;"),
        });

        expect(CosmeticRuleParser.parse("#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;")).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@$#",
            body: ScriptletBodyParser.parse("scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;"),
        });

        expect(
            CosmeticRuleParser.parse("example.com,~example.net#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;")
        ).toMatchObject({
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@$#",
            body: ScriptletBodyParser.parse("scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;"),
        });

        // Valid HTML filters (AdGuard)
        expect(CosmeticRuleParser.parse('$$script[tag-content="adblock"]')).toMatchObject({
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "$$",
            body: HtmlBodyParser.parse('script[tag-content="adblock"]'),
        });

        expect(CosmeticRuleParser.parse('example.com,~example.net$$script[tag-content="adblock"]')).toMatchObject({
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "$$",
            body: HtmlBodyParser.parse('script[tag-content="adblock"]'),
        });

        expect(CosmeticRuleParser.parse('$@$script[tag-content="adblock"]')).toMatchObject({
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "$@$",
            body: HtmlBodyParser.parse('script[tag-content="adblock"]'),
        });

        expect(CosmeticRuleParser.parse('example.com,~example.net$@$script[tag-content="adblock"]')).toMatchObject({
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "$@$",
            body: HtmlBodyParser.parse('script[tag-content="adblock"]'),
        });

        // Valid HTML filters (uBlock)
        expect(CosmeticRuleParser.parse("##^script:has-text(adblock)")).toMatchObject({
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "##^",
            body: HtmlBodyParser.parse("script:has-text(adblock)"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net##^script:has-text(adblock)")).toMatchObject({
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "##^",
            body: HtmlBodyParser.parse("script:has-text(adblock)"),
        });

        expect(CosmeticRuleParser.parse("#@#^script:has-text(adblock)")).toMatchObject({
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@#^",
            body: HtmlBodyParser.parse("script:has-text(adblock)"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net#@#^script:has-text(adblock)")).toMatchObject({
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@#^",
            body: HtmlBodyParser.parse("script:has-text(adblock)"),
        });

        expect(CosmeticRuleParser.parse("##^script:has-text(adblock), script:has-text(detector)")).toMatchObject({
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "##^",
            body: HtmlBodyParser.parse("script:has-text(adblock), script:has-text(detector)"),
        });

        expect(
            CosmeticRuleParser.parse("example.com,~example.net##^script:has-text(adblock), script:has-text(detector)")
        ).toMatchObject({
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "##^",
            body: HtmlBodyParser.parse("script:has-text(adblock), script:has-text(detector)"),
        });

        expect(CosmeticRuleParser.parse("#@#^script:has-text(adblock), script:has-text(detector)")).toMatchObject({
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@#^",
            body: HtmlBodyParser.parse("script:has-text(adblock), script:has-text(detector)"),
        });

        expect(
            CosmeticRuleParser.parse("example.com,~example.net#@#^script:has-text(adblock), script:has-text(detector)")
        ).toMatchObject({
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@#^",
            body: HtmlBodyParser.parse("script:has-text(adblock), script:has-text(detector)"),
        });

        // Valid JS injections (AdGuard)
        expect(CosmeticRuleParser.parse("#%#const a = 2;")).toMatchObject({
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: [],
            domains: [],
            separator: "#%#",
            body: "const a = 2;",
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net#%#const a = 2;")).toMatchObject({
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#%#",
            body: "const a = 2;",
        });

        expect(CosmeticRuleParser.parse("#@%#const a = 2;")).toMatchObject({
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
            modifiers: [],
            domains: [],
            separator: "#@%#",
            body: "const a = 2;",
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net#@%#const a = 2;")).toMatchObject({
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
            modifiers: [],
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#@%#",
            body: "const a = 2;",
        });

        // AdGuard modifiers/options
        // ! At this point, we aren't yet testing the conflict between the domain modifier and the classic domain list
        expect(CosmeticRuleParser.parse("[$app=com.something]#%#const a = 2;")).toMatchObject({
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: AdGuardModifierListParser.parse("[$app=com.something]").modifiers,
            domains: [],
            separator: "#%#",
            body: "const a = 2;",
        });

        expect(CosmeticRuleParser.parse("[$app=com.something,anything=123]#%#const a = 2;")).toMatchObject({
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: AdGuardModifierListParser.parse("[$app=com.something,anything=123]").modifiers,
            domains: [],
            separator: "#%#",
            body: "const a = 2;",
        });

        expect(CosmeticRuleParser.parse("[$app=com.something]example.com,~example.net#%#const a = 2;")).toMatchObject({
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: AdGuardModifierListParser.parse("[$app=com.something]").modifiers,
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#%#",
            body: "const a = 2;",
        });

        expect(
            CosmeticRuleParser.parse("[$app=com.something,anything=123]example.com,~example.net#%#const a = 2;")
        ).toMatchObject({
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            modifiers: AdGuardModifierListParser.parse("[$app=com.something,anything=123]").modifiers,
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "#%#",
            body: "const a = 2;",
        });

        // uBlock modifiers/options
        expect(CosmeticRuleParser.parse("##:matches-path(/path) .ad")).toMatchObject({
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            modifiers: UBlockModifierListParser.parse(":matches-path(/path)").modifiers,
            domains: [],
            separator: "##",
            body: ElementHidingBodyParser.parse(".ad"),
        });

        expect(CosmeticRuleParser.parse("example.com,~example.net##:matches-path(/path) .ad")).toMatchObject({
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            modifiers: UBlockModifierListParser.parse(":matches-path(/path)").modifiers,
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "##",
            body: ElementHidingBodyParser.parse(".ad"),
        });

        expect(
            CosmeticRuleParser.parse("example.com,~example.net##^:matches-path(/path) script:has-text(detect)")
        ).toMatchObject({
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            modifiers: UBlockModifierListParser.parse(":matches-path(/path)").modifiers,
            domains: DomainListParser.parse("example.com,~example.net").domains,
            separator: "##^",
            body: HtmlBodyParser.parse("script:has-text(detect)"),
        });

        // Invalid
        expect(CosmeticRuleParser.parse(EMPTY)).toBeNull();
        expect(CosmeticRuleParser.parse(SPACE)).toBeNull();

        expect(CosmeticRuleParser.parse("body")).toBeNull();
        expect(CosmeticRuleParser.parse("body > .ad")).toBeNull();
        expect(CosmeticRuleParser.parse("#")).toBeNull();
        expect(CosmeticRuleParser.parse("# test")).toBeNull();
        expect(CosmeticRuleParser.parse("! test")).toBeNull();
        expect(CosmeticRuleParser.parse("-ad-350px-")).toBeNull();

        expect(CosmeticRuleParser.parse("##^responseheader(a)")).toBeNull();
        expect(CosmeticRuleParser.parse("example.com,~example.net##^responseheader(a)")).toBeNull();

        expect(() => CosmeticRuleParser.parse("[$a=b]##:matches-path(/c) .ad")).toThrowError(
            "Cannot use AdGuard modifier list with uBO options"
        );

        expect(() => CosmeticRuleParser.parse("$$:matches-path(/c).ad")).toThrowError(
            "Cannot use uBO options with ADG HTML filtering"
        );

        expect(() => CosmeticRuleParser.parse("[$a=b]##^:matches-path(/c) .ad")).toThrowError(
            "Cannot use AdGuard modifier list with uBO options"
        );

        expect(() => CosmeticRuleParser.parse("[$a=b]##body:style(padding:0)")).toThrowError(
            "Cannot use AdGuard modifier list with uBO's CSS injection"
        );
    });

    test("generate", async () => {
        const parseAndGenerate = (raw: string) => {
            const ast = CosmeticRuleParser.parse(raw);

            if (ast) {
                return CosmeticRuleParser.generate(ast);
            }

            return null;
        };

        // Valid elemhide
        expect(parseAndGenerate("##.ad")).toEqual("##.ad");
        expect(parseAndGenerate("example.com,~example.net##.ad")).toEqual("example.com,~example.net##.ad");
        expect(parseAndGenerate("#@#.ad")).toEqual("#@#.ad");
        expect(parseAndGenerate("example.com,~example.net#@#.ad")).toEqual("example.com,~example.net#@#.ad");

        // Valid elemhide (extended)
        expect(parseAndGenerate("#?#.ad:-abp-has(.ad)")).toEqual("#?#.ad:-abp-has(.ad)");
        expect(parseAndGenerate("example.com,~example.net#?#.ad:-abp-has(.ad)")).toEqual(
            "example.com,~example.net#?#.ad:-abp-has(.ad)"
        );
        expect(parseAndGenerate("#@?#.ad:-abp-has(.ad)")).toEqual("#@?#.ad:-abp-has(.ad)");
        expect(parseAndGenerate("example.com,~example.net#@?#.ad:-abp-has(.ad)")).toEqual(
            "example.com,~example.net#@?#.ad:-abp-has(.ad)"
        );

        // Valid CSS inject (AdGuard)
        expect(parseAndGenerate("#$#body { padding: 0; }")).toEqual("#$#body { padding: 0; }");
        expect(parseAndGenerate("example.com,~example.net#$#body { padding: 0; }")).toEqual(
            "example.com,~example.net#$#body { padding: 0; }"
        );
        expect(parseAndGenerate("#@$#body { padding: 0; }")).toEqual("#@$#body { padding: 0; }");
        expect(parseAndGenerate("example.com,~example.net#@$#body { padding: 0; }")).toEqual(
            "example.com,~example.net#@$#body { padding: 0; }"
        );

        // Valid ExtendedCSS inject (AdGuard)
        expect(parseAndGenerate("#$?#body:-abp-has(.ad) { padding: 0; }")).toEqual(
            "#$?#body:-abp-has(.ad) { padding: 0; }"
        );
        expect(parseAndGenerate("example.com,~example.net#$?#body:-abp-has(.ad) { padding: 0; }")).toEqual(
            "example.com,~example.net#$?#body:-abp-has(.ad) { padding: 0; }"
        );
        expect(parseAndGenerate("#@$?#body:-abp-has(.ad) { padding: 0; }")).toEqual(
            "#@$?#body:-abp-has(.ad) { padding: 0; }"
        );
        expect(parseAndGenerate("example.com,~example.net#@$?#body:-abp-has(.ad) { padding: 0; }")).toEqual(
            "example.com,~example.net#@$?#body:-abp-has(.ad) { padding: 0; }"
        );

        // Media queries
        expect(parseAndGenerate("#$?#@media (min-width: 1024px) { body:-abp-has(.ad) { padding: 0; } }")).toEqual(
            "#$?#@media (min-width:1024px) { body:-abp-has(.ad) { padding: 0; } }"
        );

        // Tolerant
        expect(parseAndGenerate("#$?#@media(min-width: 1024px) { body:-abp-has(.ad) { padding: 0; } }")).toEqual(
            "#$?#@media (min-width:1024px) { body:-abp-has(.ad) { padding: 0; } }"
        );

        expect(
            parseAndGenerate(
                "example.com,~example.net#$?#@media (min-width: 1024px) { body:-abp-has(.ad) { padding: 0; } }"
            )
        ).toEqual("example.com,~example.net#$?#@media (min-width:1024px) { body:-abp-has(.ad) { padding: 0; } }");
        expect(parseAndGenerate("#@$?#@media (min-width: 1024px) { body:-abp-has(.ad) { padding: 0; } }")).toEqual(
            "#@$?#@media (min-width:1024px) { body:-abp-has(.ad) { padding: 0; } }"
        );
        expect(
            parseAndGenerate(
                "example.com,~example.net#@$?#@media (min-width: 1024px) { body:-abp-has(.ad) { padding: 0; } }"
            )
        ).toEqual("example.com,~example.net#@$?#@media (min-width:1024px) { body:-abp-has(.ad) { padding: 0; } }");

        // Valid CSS inject (uBlock)
        expect(parseAndGenerate("##body:style(padding: 0;)")).toEqual("##body:style(padding: 0;)");
        expect(parseAndGenerate("example.com,~example.net##body:style(padding: 0;)")).toEqual(
            "example.com,~example.net##body:style(padding: 0;)"
        );
        expect(parseAndGenerate("#@#body:style(padding: 0;)")).toEqual("#@#body:style(padding: 0;)");
        expect(parseAndGenerate("example.com,~example.net#@#body:style(padding: 0;)")).toEqual(
            "example.com,~example.net#@#body:style(padding: 0;)"
        );
        expect(parseAndGenerate("#@#:matches-path(/path) body:style(padding: 0;)")).toEqual(
            "#@#:matches-path(/path) body:style(padding: 0;)"
        );
        expect(parseAndGenerate("example.com,~example.net#@#:matches-path(/path) body:style(padding: 0;)")).toEqual(
            "example.com,~example.net#@#:matches-path(/path) body:style(padding: 0;)"
        );

        // Valid ExtendedCSS inject (uBlock)
        expect(parseAndGenerate("##body:has(.ad):style(padding: 0;)")).toEqual("##body:has(.ad):style(padding: 0;)");
        expect(parseAndGenerate("example.com,~example.net##body:has(.ad):style(padding: 0;)")).toEqual(
            "example.com,~example.net##body:has(.ad):style(padding: 0;)"
        );
        expect(parseAndGenerate("#@#body:has(.ad):style(padding: 0;)")).toEqual("#@#body:has(.ad):style(padding: 0;)");
        expect(parseAndGenerate("example.com,~example.net#@#body:has(.ad):style(padding: 0;)")).toEqual(
            "example.com,~example.net#@#body:has(.ad):style(padding: 0;)"
        );

        // Valid scriptlet inject (AdGuard)
        expect(parseAndGenerate("#%#//scriptlet('scriptlet0', 'arg0', 'arg1')")).toEqual(
            "#%#//scriptlet('scriptlet0', 'arg0', 'arg1')"
        );
        expect(parseAndGenerate("example.com,~example.net#%#//scriptlet('scriptlet0', 'arg0', 'arg1')")).toEqual(
            "example.com,~example.net#%#//scriptlet('scriptlet0', 'arg0', 'arg1')"
        );
        expect(parseAndGenerate("#@%#//scriptlet('scriptlet0', 'arg0', 'arg1')")).toEqual(
            "#@%#//scriptlet('scriptlet0', 'arg0', 'arg1')"
        );
        expect(parseAndGenerate("example.com,~example.net#@%#//scriptlet('scriptlet0', 'arg0', 'arg1')")).toEqual(
            "example.com,~example.net#@%#//scriptlet('scriptlet0', 'arg0', 'arg1')"
        );

        // Valid scriptlet inject (uBlock)
        expect(parseAndGenerate("##+js(scriptlet0, arg0, arg1)")).toEqual("##+js(scriptlet0, arg0, arg1)");
        expect(parseAndGenerate("example.com,~example.net##+js(scriptlet0, arg0, arg1)")).toEqual(
            "example.com,~example.net##+js(scriptlet0, arg0, arg1)"
        );
        expect(parseAndGenerate("#@#+js(scriptlet0, arg0, arg1)")).toEqual("#@#+js(scriptlet0, arg0, arg1)");
        expect(parseAndGenerate("example.com,~example.net#@#+js(scriptlet0, arg0, arg1)")).toEqual(
            "example.com,~example.net#@#+js(scriptlet0, arg0, arg1)"
        );

        // Valid scriptlet inject (ABP)
        expect(parseAndGenerate("#$#scriptlet0 arg0 arg1")).toEqual("#$#scriptlet0 arg0 arg1");
        expect(parseAndGenerate("example.com,~example.net#$#scriptlet0 arg0 arg1")).toEqual(
            "example.com,~example.net#$#scriptlet0 arg0 arg1"
        );
        expect(parseAndGenerate("#@$#scriptlet0 arg0 arg1")).toEqual("#@$#scriptlet0 arg0 arg1");
        expect(parseAndGenerate("example.com,~example.net#@$#scriptlet0 arg0 arg1")).toEqual(
            "example.com,~example.net#@$#scriptlet0 arg0 arg1"
        );
        expect(parseAndGenerate("#$#scriptlet0 arg0 arg1;")).toEqual("#$#scriptlet0 arg0 arg1");
        expect(parseAndGenerate("example.com,~example.net#$#scriptlet0 arg0 arg1;")).toEqual(
            "example.com,~example.net#$#scriptlet0 arg0 arg1"
        );
        expect(parseAndGenerate("#@$#scriptlet0 arg0 arg1;")).toEqual("#@$#scriptlet0 arg0 arg1");
        expect(parseAndGenerate("example.com,~example.net#@$#scriptlet0 arg0 arg1;")).toEqual(
            "example.com,~example.net#@$#scriptlet0 arg0 arg1"
        );

        // Multiple ABP snippets
        expect(parseAndGenerate("#$#scriptlet0 arg01 arg01; scriptlet1; scriptlet2 arg21")).toEqual(
            "#$#scriptlet0 arg01 arg01; scriptlet1; scriptlet2 arg21"
        );
        expect(
            parseAndGenerate("example.com,~example.net#$#scriptlet0 arg01 arg01; scriptlet1; scriptlet2 arg21")
        ).toEqual("example.com,~example.net#$#scriptlet0 arg01 arg01; scriptlet1; scriptlet2 arg21");
        expect(parseAndGenerate("#@$#scriptlet0 arg01 arg01; scriptlet1; scriptlet2 arg21")).toEqual(
            "#@$#scriptlet0 arg01 arg01; scriptlet1; scriptlet2 arg21"
        );
        expect(
            parseAndGenerate("example.com,~example.net#@$#scriptlet0 arg01 arg01; scriptlet1; scriptlet2 arg21")
        ).toEqual("example.com,~example.net#@$#scriptlet0 arg01 arg01; scriptlet1; scriptlet2 arg21");

        // Valid HTML filters (AdGuard)
        expect(parseAndGenerate('$$script[tag-content="adblock"]')).toEqual('$$script[tag-content="adblock"]');
        expect(parseAndGenerate('example.com,~example.net$$script[tag-content="adblock"]')).toEqual(
            'example.com,~example.net$$script[tag-content="adblock"]'
        );
        expect(parseAndGenerate('$@$script[tag-content="adblock"]')).toEqual('$@$script[tag-content="adblock"]');
        expect(parseAndGenerate('example.com,~example.net$@$script[tag-content="adblock"]')).toEqual(
            'example.com,~example.net$@$script[tag-content="adblock"]'
        );

        // Valid HTML filters (uBlock)
        expect(parseAndGenerate("##^script:has-text(adblock)")).toEqual("##^script:has-text(adblock)");
        expect(parseAndGenerate("example.com,~example.net##^script:has-text(adblock)")).toEqual(
            "example.com,~example.net##^script:has-text(adblock)"
        );
        expect(parseAndGenerate("#@#^script:has-text(adblock)")).toEqual("#@#^script:has-text(adblock)");
        expect(parseAndGenerate("example.com,~example.net#@#^script:has-text(adblock)")).toEqual(
            "example.com,~example.net#@#^script:has-text(adblock)"
        );
        expect(parseAndGenerate("##^script:has-text(adblock), script:has-text(detector)")).toEqual(
            "##^script:has-text(adblock), script:has-text(detector)"
        );
        expect(
            parseAndGenerate("example.com,~example.net##^script:has-text(adblock), script:has-text(detector)")
        ).toEqual("example.com,~example.net##^script:has-text(adblock), script:has-text(detector)");
        expect(parseAndGenerate("#@#^script:has-text(adblock), script:has-text(detector)")).toEqual(
            "#@#^script:has-text(adblock), script:has-text(detector)"
        );
        expect(
            parseAndGenerate("example.com,~example.net#@#^script:has-text(adblock), script:has-text(detector)")
        ).toEqual("example.com,~example.net#@#^script:has-text(adblock), script:has-text(detector)");

        // Valid JS injections (AdGuard)
        expect(parseAndGenerate("#%#const a = 2;")).toEqual("#%#const a = 2;");
        expect(parseAndGenerate("example.com,~example.net#%#const a = 2;")).toEqual(
            "example.com,~example.net#%#const a = 2;"
        );
        expect(parseAndGenerate("#@%#const a = 2;")).toEqual("#@%#const a = 2;");
        expect(parseAndGenerate("example.com,~example.net#@%#const a = 2;")).toEqual(
            "example.com,~example.net#@%#const a = 2;"
        );

        // AdGuard modifiers/options
        expect(parseAndGenerate("[$app=com.something]#%#const a = 2;")).toEqual("[$app=com.something]#%#const a = 2;");
        expect(parseAndGenerate("[$app=com.something,anything=123]#%#const a = 2;")).toEqual(
            "[$app=com.something,anything=123]#%#const a = 2;"
        );
        expect(parseAndGenerate("[$app=com.something,anything=123]example.com,~example.net#%#const a = 2;")).toEqual(
            "[$app=com.something,anything=123]example.com,~example.net#%#const a = 2;"
        );

        // uBlock modifiers/options
        expect(parseAndGenerate("##:matches-path(/path) .ad")).toEqual("##:matches-path(/path) .ad");
        expect(parseAndGenerate("example.com,~example.net##:matches-path(/path) .ad")).toEqual(
            "example.com,~example.net##:matches-path(/path) .ad"
        );
        expect(parseAndGenerate("example.com,~example.net##^:matches-path(/path) script:has-text(detect)")).toEqual(
            "example.com,~example.net##^:matches-path(/path) script:has-text(detect)"
        );
    });
});
