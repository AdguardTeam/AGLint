/* eslint-disable max-len */

import { CommentRuleType } from "../../src/parser/comment/common";
import { RuleCategories } from "../../src/parser/common";
import { CosmeticRuleType } from "../../src/parser/cosmetic/common";
import { NetworkRuleType } from "../../src/parser/network/common";
import { RuleParser } from "../../src/parser/rule";
import { AdblockSyntax } from "../../src/utils/adblockers";

describe("RuleParser", () => {
    test("parse", () => {
        // ! It is enough just to look at the basics, each unit is tested in detail elsewhere

        // Agents
        expect(RuleParser.parse("[Adblock Plus 2.0]")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.Agent,
        });

        expect(RuleParser.parse("[Adblock Plus]")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.Agent,
        });

        expect(RuleParser.parse("[AdGuard]")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.Agent,
        });

        // Hints
        expect(RuleParser.parse("!+NOT_OPTIMIZED")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.Hint,
        });

        expect(RuleParser.parse("!+ NOT_OPTIMIZED")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.Hint,
        });

        expect(RuleParser.parse("!+ NOT_OPTIMIZED PLATFORM(windows, mac) NOT_PLATFORM(android, ios)")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.Hint,
        });

        // Pre-processors
        expect(RuleParser.parse("!#if (adguard)")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.PreProcessor,
        });

        expect(RuleParser.parse("!#if (adguard && !adguard_ext_safari)")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.PreProcessor,
        });

        expect(RuleParser.parse("!#safari_cb_affinity")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.PreProcessor,
        });

        expect(RuleParser.parse("!#safari_cb_affinity(content_blockers)")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.PreProcessor,
        });

        // Metadata comments
        expect(RuleParser.parse("! Title: My List")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.Metadata,
        });

        expect(RuleParser.parse("! Version: 2.0.150")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.Metadata,
        });

        // Simple comments
        expect(RuleParser.parse("! This is just a comment")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.Comment,
        });

        expect(RuleParser.parse("# This is just a comment")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.Comment,
        });

        expect(RuleParser.parse("! https://github.com/AdguardTeam/AdguardFilters/issues/134623")).toMatchObject({
            category: RuleCategories.Comment,
            type: CommentRuleType.Comment,
        });

        // Element hiding rules
        expect(RuleParser.parse("##.ad")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ElementHidingRule,
            exception: false,
        });

        expect(RuleParser.parse("example.com,~example.net##.ad")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ElementHidingRule,
            exception: false,
        });

        expect(RuleParser.parse("#@#.ad")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ElementHidingRule,
            exception: true,
        });

        expect(RuleParser.parse("example.com,~example.net#@#.ad")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ElementHidingRule,
            exception: true,
        });

        expect(RuleParser.parse("##.ad:-abp-has(.ad)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ElementHidingRule,
            exception: false,
        });

        expect(RuleParser.parse("example.com,~example.net##.ad:-abp-has(.ad)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ElementHidingRule,
            exception: false,
        });

        expect(RuleParser.parse("#@#.ad:-abp-has(.ad)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ElementHidingRule,
            exception: true,
        });

        expect(RuleParser.parse("example.com,~example.net#@#.ad:-abp-has(.ad)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ElementHidingRule,
            exception: true,
        });

        // CSS injections (AdGuard)
        expect(RuleParser.parse("#$#body { padding: 0; }")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(RuleParser.parse("example.com,~example.net#$#body { padding: 0; }")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(RuleParser.parse("#$#.ads { remove: true; }")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(RuleParser.parse("#@$#body { padding: 0; }")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        expect(RuleParser.parse("example.com,~example.net#@$#body { padding: 0; }")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        expect(RuleParser.parse("#@$#.ads { remove: true; }")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        expect(
            RuleParser.parse("#$#@media (min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }")
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(
            RuleParser.parse(
                "example.com,~example.net#$#@media (min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }"
            )
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(
            RuleParser.parse("#@$#@media (min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }")
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        expect(
            RuleParser.parse(
                "example.com,~example.net#@$#@media (min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }"
            )
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        expect(RuleParser.parse("#$?#body:has(.ads) { padding: 0; }")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(RuleParser.parse("example.com,~example.net#$?#body:has(.ads) { padding: 0; }")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(RuleParser.parse("#@$?#body:has(.ads) { padding: 0; }")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        expect(RuleParser.parse("example.com,~example.net#@$?#body:has(.ads) { padding: 0; }")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        expect(
            RuleParser.parse(
                "#$?#@media (min-height: 1024px) and (max-height: 1920px) { body:has(.ads) { padding: 0; } }"
            )
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(
            RuleParser.parse(
                "example.com,~example.net#$?#@media (min-height: 1024px) and (max-height: 1920px) { body:has(.ads) { padding: 0; } }"
            )
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(
            RuleParser.parse(
                "#@$?#@media (min-height: 1024px) and (max-height: 1920px) { body:has(.ads) { padding: 0; } }"
            )
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        expect(
            RuleParser.parse(
                "example.com,~example.net#@$?#@media (min-height: 1024px) and (max-height: 1920px) { body:has(.ads) { padding: 0; } }"
            )
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        // CSS injections (uBlock)
        expect(RuleParser.parse("##body:style(padding: 0;)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
        });

        expect(RuleParser.parse("example.com,~example.net##body:style(padding: 0;)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
        });

        expect(RuleParser.parse("##.ads:remove()")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
        });

        expect(RuleParser.parse("#@#body:style(padding: 0;)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
        });

        expect(RuleParser.parse("example.com,~example.net#@#body:style(padding: 0;)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
        });

        expect(RuleParser.parse("#@#.ads:remove()")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
        });

        expect(RuleParser.parse("##body:has(.ads):style(padding: 0;)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
        });

        expect(RuleParser.parse("example.com,~example.net##body:has(.ads):style(padding: 0;)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
        });

        expect(RuleParser.parse("#@#body:has(.ads):style(padding: 0;)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
        });

        expect(RuleParser.parse("example.com,~example.net#@#body:has(.ads):style(padding: 0;)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.CssRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
        });

        // Scriptlets (AdGuard)
        expect(RuleParser.parse("#%#//scriptlet('scriptlet0', 'arg0', 'arg1')")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(RuleParser.parse("example.com,~example.net#%#//scriptlet('scriptlet0', 'arg0', 'arg1')")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(RuleParser.parse("#@%#//scriptlet('scriptlet0', 'arg0', 'arg1')")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        expect(RuleParser.parse("example.com,~example.net#@%#//scriptlet('scriptlet0', 'arg0', 'arg1')")).toMatchObject(
            {
                category: RuleCategories.Cosmetic,
                type: CosmeticRuleType.ScriptletRule,
                syntax: AdblockSyntax.AdGuard,
                exception: true,
            }
        );

        // Scriptlets (uBlock)
        expect(RuleParser.parse("##+js(scriptlet0, arg0, arg1)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
        });

        expect(RuleParser.parse("example.com,~example.net##+js(scriptlet0, arg0, arg1)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
        });

        expect(RuleParser.parse("#@#+js(scriptlet0, arg0, arg1)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
        });

        expect(RuleParser.parse("example.com,~example.net#@#+js(scriptlet0, arg0, arg1)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
        });

        // Snippets (Adblock Plus)
        expect(RuleParser.parse("#$#scriptlet0 arg0 arg1")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: false,
        });

        expect(RuleParser.parse("example.com,~example.net#$#scriptlet0 arg0 arg1")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: false,
        });

        expect(RuleParser.parse("#@$#scriptlet0 arg0 arg1")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
        });

        expect(RuleParser.parse("example.com,~example.net#@$#scriptlet0 arg0 arg1")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
        });

        // ; at end
        expect(RuleParser.parse("#$#scriptlet0 arg0 arg1;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: false,
        });

        expect(RuleParser.parse("example.com,~example.net#$#scriptlet0 arg0 arg1;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: false,
        });

        expect(RuleParser.parse("#@$#scriptlet0 arg0 arg1;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
        });

        expect(RuleParser.parse("example.com,~example.net#@$#scriptlet0 arg0 arg1;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
        });

        // Multiple snippets (Adblock Plus)
        expect(RuleParser.parse("#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: false,
        });

        expect(
            RuleParser.parse("example.com,~example.net#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11")
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: false,
        });

        expect(RuleParser.parse("#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
        });

        expect(
            RuleParser.parse("example.com,~example.net#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11")
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
        });

        // ; at end
        expect(RuleParser.parse("#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
        });

        expect(
            RuleParser.parse("example.com,~example.net#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;")
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: false,
        });

        expect(RuleParser.parse("#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
        });

        expect(
            RuleParser.parse("example.com,~example.net#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;")
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ScriptletRule,
            syntax: AdblockSyntax.AdblockPlus,
            exception: true,
        });

        // HTML filters (AdGuard)
        expect(RuleParser.parse('$$script[tag-content="adblock"]')).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(RuleParser.parse('example.com,~example.net$$script[tag-content="adblock"]')).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(RuleParser.parse('$@$script[tag-content="adblock"]')).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        expect(RuleParser.parse('example.com,~example.net$@$script[tag-content="adblock"]')).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        // HTML filters (uBlock)
        expect(RuleParser.parse("##^script:has-text(adblock)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
        });

        expect(RuleParser.parse("example.com,~example.net##^script:has-text(adblock)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
        });

        expect(RuleParser.parse("#@#^script:has-text(adblock)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
        });

        expect(RuleParser.parse("example.com,~example.net#@#^script:has-text(adblock)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
        });

        expect(RuleParser.parse("##^script:has-text(adblock), script:has-text(detector)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
        });

        expect(
            RuleParser.parse("example.com,~example.net##^script:has-text(adblock), script:has-text(detector)")
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
        });

        expect(RuleParser.parse("#@#^script:has-text(adblock), script:has-text(detector)")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
        });

        expect(
            RuleParser.parse("example.com,~example.net#@#^script:has-text(adblock), script:has-text(detector)")
        ).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.HtmlRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
        });

        // JS inject (AdGuard)
        expect(RuleParser.parse("#%#const a = 2;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(RuleParser.parse("example.com,~example.net#%#const a = 2;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(RuleParser.parse("#@%#const a = 2;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        expect(RuleParser.parse("example.com,~example.net#@%#const a = 2;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        // AdGuard modifiers/options
        expect(RuleParser.parse("[$app=com.something]#%#const a = 2;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(RuleParser.parse("[$app=com.something]example.com,~example.net#%#const a = 2;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
        });

        expect(RuleParser.parse("[$app=com.something]#@%#const a = 2;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        expect(RuleParser.parse("[$app=com.something]example.com,~example.net#@%#const a = 2;")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.JsRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
        });

        // uBlock modifiers/options
        expect(RuleParser.parse("##:matches-path(/path) .ad")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
        });

        expect(RuleParser.parse("example.com,~example.net##:matches-path(/path) .ad")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
        });

        expect(RuleParser.parse("#@#:matches-path(/path) .ad")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
        });

        expect(RuleParser.parse("example.com,~example.net#@#:matches-path(/path) .ad")).toMatchObject({
            category: RuleCategories.Cosmetic,
            type: CosmeticRuleType.ElementHidingRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
        });

        // Network rules
        expect(RuleParser.parse("||example.com")).toMatchObject({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
        });

        expect(RuleParser.parse("@@||example.com")).toMatchObject({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
        });

        expect(RuleParser.parse("/regex/")).toMatchObject({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
        });

        expect(RuleParser.parse("@@/regex/")).toMatchObject({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
        });

        expect(RuleParser.parse("/regex/$m1,m2=v2")).toMatchObject({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
        });

        expect(RuleParser.parse("@@/regex/$m1,m2=v2")).toMatchObject({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
        });

        expect(RuleParser.parse("/example/$m1,m2=v2,m3=/^r3$/")).toMatchObject({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
        });

        expect(RuleParser.parse("@@/example/$m1,m2=v2,m3=/^r3$/")).toMatchObject({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
        });

        expect(RuleParser.parse("/ad.js^$m1=/^v1$/")).toMatchObject({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
        });

        expect(
            RuleParser.parse("@@/example/scripts/ad.js$m1,m2=v2,m3=/^r3\\$/,m4=/r4\\/r4$/,m5=/^r5\\$/")
        ).toMatchObject({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
        });

        expect(
            RuleParser.parse("@@||example.org^$replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/v\\$1<\\/VAST>/i")
        ).toMatchObject({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
        });
    });

    test("generate", () => {
        const parseAndGenerate = (raw: string) => {
            const ast = RuleParser.parse(raw);

            if (ast) {
                return RuleParser.generate(ast);
            }

            return null;
        };

        // Agents
        expect(parseAndGenerate("[Adblock Plus 2.0]")).toEqual("[Adblock Plus 2.0]");
        expect(parseAndGenerate("[Adblock Plus]")).toEqual("[Adblock Plus]");
        expect(parseAndGenerate("[AdGuard]")).toEqual("[AdGuard]");

        // Hints
        expect(parseAndGenerate("!+NOT_OPTIMIZED")).toEqual("!+ NOT_OPTIMIZED");
        expect(parseAndGenerate("!+ NOT_OPTIMIZED")).toEqual("!+ NOT_OPTIMIZED");
        expect(parseAndGenerate("!+ NOT_OPTIMIZED PLATFORM(windows, mac) NOT_PLATFORM(android, ios)")).toEqual(
            "!+ NOT_OPTIMIZED PLATFORM(windows, mac) NOT_PLATFORM(android, ios)"
        );

        // Pre-processors
        expect(parseAndGenerate("!#if (adguard)")).toEqual("!#if (adguard)");
        expect(parseAndGenerate("!#if (adguard && !adguard_ext_safari)")).toEqual(
            "!#if (adguard && !adguard_ext_safari)"
        );
        expect(parseAndGenerate("!#safari_cb_affinity")).toEqual("!#safari_cb_affinity");
        expect(parseAndGenerate("!#safari_cb_affinity(content_blockers)")).toEqual(
            "!#safari_cb_affinity(content_blockers)"
        );

        // Metadata comments
        expect(parseAndGenerate("! Title: My List")).toEqual("! Title: My List");
        expect(parseAndGenerate("! Version: 2.0.150")).toEqual("! Version: 2.0.150");

        // Simple comments
        expect(parseAndGenerate("! This is just a comment")).toEqual("! This is just a comment");
        expect(parseAndGenerate("# This is just a comment")).toEqual("# This is just a comment");

        // Element hiding rules
        expect(parseAndGenerate("##.ad")).toEqual("##.ad");
        expect(parseAndGenerate("example.com,~example.net##.ad")).toEqual("example.com,~example.net##.ad");
        expect(parseAndGenerate("#@#.ad")).toEqual("#@#.ad");
        expect(parseAndGenerate("example.com,~example.net#@#.ad")).toEqual("example.com,~example.net#@#.ad");
        expect(parseAndGenerate("##.ad:-abp-has(.ad)")).toEqual("##.ad:-abp-has(.ad)");
        expect(parseAndGenerate("example.com,~example.net##.ad:-abp-has(.ad)")).toEqual(
            "example.com,~example.net##.ad:-abp-has(.ad)"
        );
        expect(parseAndGenerate("#@#.ad:-abp-has(.ad)")).toEqual("#@#.ad:-abp-has(.ad)");
        expect(parseAndGenerate("example.com,~example.net#@#.ad:-abp-has(.ad)")).toEqual(
            "example.com,~example.net#@#.ad:-abp-has(.ad)"
        );

        // CSS injections (AdGuard)
        expect(parseAndGenerate("#$#body { padding: 0; }")).toEqual("#$#body { padding: 0; }");
        expect(parseAndGenerate("example.com,~example.net#$#body { padding: 0; }")).toEqual(
            "example.com,~example.net#$#body { padding: 0; }"
        );
        expect(parseAndGenerate("#$#.ads { remove: true; }")).toEqual("#$#.ads { remove: true; }");
        expect(parseAndGenerate("#@$#body { padding: 0; }")).toEqual("#@$#body { padding: 0; }");
        expect(parseAndGenerate("example.com,~example.net#@$#body { padding: 0; }")).toEqual(
            "example.com,~example.net#@$#body { padding: 0; }"
        );
        expect(parseAndGenerate("#@$#.ads { remove: true; }")).toEqual("#@$#.ads { remove: true; }");

        expect(
            parseAndGenerate("#$#@media (min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }")
        ).toEqual("#$#@media (min-height:1024px) and (max-height:1920px) { body { padding: 0; } }");
        expect(
            parseAndGenerate(
                "example.com,~example.net#$#@media (min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }"
            )
        ).toEqual(
            "example.com,~example.net#$#@media (min-height:1024px) and (max-height:1920px) { body { padding: 0; } }"
        );
        expect(
            parseAndGenerate("#@$#@media (min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }")
        ).toEqual("#@$#@media (min-height:1024px) and (max-height:1920px) { body { padding: 0; } }");
        expect(
            parseAndGenerate(
                "example.com,~example.net#@$#@media (min-height: 1024px) and (max-height: 1920px) { body { padding: 0; } }"
            )
        ).toEqual(
            "example.com,~example.net#@$#@media (min-height:1024px) and (max-height:1920px) { body { padding: 0; } }"
        );
        expect(parseAndGenerate("#$?#body:has(.ads) { padding: 0; }")).toEqual("#$?#body:has(.ads) { padding: 0; }");
        expect(parseAndGenerate("example.com,~example.net#$?#body:has(.ads) { padding: 0; }")).toEqual(
            "example.com,~example.net#$?#body:has(.ads) { padding: 0; }"
        );
        expect(parseAndGenerate("#@$?#body:has(.ads) { padding: 0; }")).toEqual("#@$?#body:has(.ads) { padding: 0; }");
        expect(parseAndGenerate("example.com,~example.net#@$?#body:has(.ads) { padding: 0; }")).toEqual(
            "example.com,~example.net#@$?#body:has(.ads) { padding: 0; }"
        );
        expect(
            parseAndGenerate(
                "#$?#@media (min-height: 1024px) and (max-height:1920px) { body:has(.ads) { padding: 0; } }"
            )
        ).toEqual("#$?#@media (min-height:1024px) and (max-height:1920px) { body:has(.ads) { padding: 0; } }");
        expect(
            parseAndGenerate(
                "example.com,~example.net#$?#@media (min-height: 1024px) and (max-height: 1920px) { body:has(.ads) { padding: 0; } }"
            )
        ).toEqual(
            "example.com,~example.net#$?#@media (min-height:1024px) and (max-height:1920px) { body:has(.ads) { padding: 0; } }"
        );
        expect(
            parseAndGenerate(
                "#@$?#@media (min-height: 1024px) and (max-height: 1920px) { body:has(.ads) { padding: 0; } }"
            )
        ).toEqual("#@$?#@media (min-height:1024px) and (max-height:1920px) { body:has(.ads) { padding: 0; } }");
        expect(
            parseAndGenerate(
                "example.com,~example.net#@$?#@media (min-height: 1024px) and (max-height: 1920px) { body:has(.ads) { padding: 0; } }"
            )
        ).toEqual(
            "example.com,~example.net#@$?#@media (min-height:1024px) and (max-height:1920px) { body:has(.ads) { padding: 0; } }"
        );

        // CSS injections (uBlock)
        expect(parseAndGenerate("##body:style(padding: 0;)")).toEqual("##body:style(padding: 0;)");
        expect(parseAndGenerate("example.com,~example.net##body:style(padding: 0;)")).toEqual(
            "example.com,~example.net##body:style(padding: 0;)"
        );
        expect(parseAndGenerate("##.ads:remove()")).toEqual("##.ads:remove()");
        expect(parseAndGenerate("#@#body:style(padding: 0;)")).toEqual("#@#body:style(padding: 0;)");
        expect(parseAndGenerate("example.com,~example.net#@#body:style(padding: 0;)")).toEqual(
            "example.com,~example.net#@#body:style(padding: 0;)"
        );
        expect(parseAndGenerate("#@#.ads:remove()")).toEqual("#@#.ads:remove()");

        expect(parseAndGenerate("##body:has(.ads):style(padding: 0;)")).toEqual("##body:has(.ads):style(padding: 0;)");
        expect(parseAndGenerate("example.com,~example.net##body:has(.ads):style(padding: 0;)")).toEqual(
            "example.com,~example.net##body:has(.ads):style(padding: 0;)"
        );
        expect(parseAndGenerate("##.ads:has(.ads):remove()")).toEqual("##.ads:has(.ads):remove()");
        expect(parseAndGenerate("#@#body:has(.ads):style(padding: 0;)")).toEqual(
            "#@#body:has(.ads):style(padding: 0;)"
        );
        expect(parseAndGenerate("example.com,~example.net#@#body:has(.ads):style(padding: 0;)")).toEqual(
            "example.com,~example.net#@#body:has(.ads):style(padding: 0;)"
        );
        expect(parseAndGenerate("#@#.ads:has(.ads):remove()")).toEqual("#@#.ads:has(.ads):remove()");

        // Scriptlets (AdGuard)
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

        // Scriptlets (uBlock)
        expect(parseAndGenerate("##+js(scriptlet0, arg0, arg1)")).toEqual("##+js(scriptlet0, arg0, arg1)");
        expect(parseAndGenerate("example.com,~example.net##+js(scriptlet0, arg0, arg1)")).toEqual(
            "example.com,~example.net##+js(scriptlet0, arg0, arg1)"
        );
        expect(parseAndGenerate("#@#+js(scriptlet0, arg0, arg1)")).toEqual("#@#+js(scriptlet0, arg0, arg1)");
        expect(parseAndGenerate("example.com,~example.net#@#+js(scriptlet0, arg0, arg1)")).toEqual(
            "example.com,~example.net#@#+js(scriptlet0, arg0, arg1)"
        );

        // Snippets (Adblock Plus)
        expect(parseAndGenerate("#$#scriptlet0 arg0 arg1")).toEqual("#$#scriptlet0 arg0 arg1");
        expect(parseAndGenerate("example.com,~example.net#$#scriptlet0 arg0 arg1")).toEqual(
            "example.com,~example.net#$#scriptlet0 arg0 arg1"
        );
        expect(parseAndGenerate("#@$#scriptlet0 arg0 arg1")).toEqual("#@$#scriptlet0 arg0 arg1");
        expect(parseAndGenerate("example.com,~example.net#@$#scriptlet0 arg0 arg1")).toEqual(
            "example.com,~example.net#@$#scriptlet0 arg0 arg1"
        );

        // ; at end
        expect(parseAndGenerate("#$#scriptlet0 arg0 arg1;")).toEqual("#$#scriptlet0 arg0 arg1");
        expect(parseAndGenerate("example.com,~example.net#$#scriptlet0 arg0 arg1;")).toEqual(
            "example.com,~example.net#$#scriptlet0 arg0 arg1"
        );
        expect(parseAndGenerate("#@$#scriptlet0 arg0 arg1;")).toEqual("#@$#scriptlet0 arg0 arg1");
        expect(parseAndGenerate("example.com,~example.net#@$#scriptlet0 arg0 arg1;")).toEqual(
            "example.com,~example.net#@$#scriptlet0 arg0 arg1"
        );

        // Multiple snippets (Adblock Plus)
        expect(parseAndGenerate("#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11")).toEqual(
            "#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11"
        );
        expect(parseAndGenerate("example.com,~example.net#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11")).toEqual(
            "example.com,~example.net#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11"
        );
        expect(parseAndGenerate("#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11")).toEqual(
            "#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11"
        );
        expect(parseAndGenerate("example.com,~example.net#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11")).toEqual(
            "example.com,~example.net#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11"
        );

        // ; at end
        expect(parseAndGenerate("#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;")).toEqual(
            "#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11"
        );
        expect(parseAndGenerate("example.com,~example.net#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;")).toEqual(
            "example.com,~example.net#$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11"
        );
        expect(parseAndGenerate("#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;")).toEqual(
            "#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11"
        );
        expect(parseAndGenerate("example.com,~example.net#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11;")).toEqual(
            "example.com,~example.net#@$#scriptlet0 arg00 arg01; scriptlet1 arg10 arg11"
        );

        // HTML filters (AdGuard)
        expect(parseAndGenerate('$$script[tag-content="adblock"]')).toEqual('$$script[tag-content="adblock"]');
        expect(parseAndGenerate('example.com,~example.net$$script[tag-content="adblock"]')).toEqual(
            'example.com,~example.net$$script[tag-content="adblock"]'
        );
        expect(parseAndGenerate('$@$script[tag-content="adblock"]')).toEqual('$@$script[tag-content="adblock"]');
        expect(parseAndGenerate('example.com,~example.net$@$script[tag-content="adblock"]')).toEqual(
            'example.com,~example.net$@$script[tag-content="adblock"]'
        );

        // HTML filters (uBlock)
        expect(parseAndGenerate("##^script:has-text(adblock)")).toEqual("##^script:has-text(adblock)");
        expect(parseAndGenerate("example.com,~example.net##^script:has-text(adblock)")).toEqual(
            "example.com,~example.net##^script:has-text(adblock)"
        );
        expect(parseAndGenerate("#@#^script:has-text(adblock)")).toEqual("#@#^script:has-text(adblock)");
        expect(parseAndGenerate("example.com,~example.net#@#^script:has-text(adblock)")).toEqual(
            "example.com,~example.net#@#^script:has-text(adblock)"
        );

        // Multiple selectors
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

        // JS inject (AdGuard)
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
        expect(parseAndGenerate("[$app=com.something]example.com,~example.net#%#const a = 2;")).toEqual(
            "[$app=com.something]example.com,~example.net#%#const a = 2;"
        );
        expect(parseAndGenerate("[$app=com.something]#@%#const a = 2;")).toEqual(
            "[$app=com.something]#@%#const a = 2;"
        );
        expect(parseAndGenerate("[$app=com.something]example.com,~example.net#@%#const a = 2;")).toEqual(
            "[$app=com.something]example.com,~example.net#@%#const a = 2;"
        );

        // uBlock modifiers/options
        expect(parseAndGenerate("##:matches-path(/path) .ad")).toEqual("##:matches-path(/path) .ad");
        expect(parseAndGenerate("example.com,~example.net##:matches-path(/path) .ad")).toEqual(
            "example.com,~example.net##:matches-path(/path) .ad"
        );
        expect(parseAndGenerate("#@#:matches-path(/path) .ad")).toEqual("#@#:matches-path(/path) .ad");
        expect(parseAndGenerate("example.com,~example.net#@#:matches-path(/path) .ad")).toEqual(
            "example.com,~example.net#@#:matches-path(/path) .ad"
        );

        // Network rules
        expect(parseAndGenerate("||example.com")).toEqual("||example.com");
        expect(parseAndGenerate("@@||example.com")).toEqual("@@||example.com");
        expect(parseAndGenerate("/regex/")).toEqual("/regex/");
        expect(parseAndGenerate("@@/regex/")).toEqual("@@/regex/");
        expect(parseAndGenerate("/regex/$m1,m2=v2")).toEqual("/regex/$m1,m2=v2");
        expect(parseAndGenerate("@@/regex/$m1,m2=v2")).toEqual("@@/regex/$m1,m2=v2");
        expect(parseAndGenerate("/example/$m1,m2=v2,m3=/^r3$/")).toEqual("/example/$m1,m2=v2,m3=/^r3$/");
        expect(parseAndGenerate("@@/example/$m1,m2=v2,m3=/^r3$/")).toEqual("@@/example/$m1,m2=v2,m3=/^r3$/");
        expect(parseAndGenerate("/ad.js^$m1=/^v1$/")).toEqual("/ad.js^$m1=/^v1$/");
        expect(parseAndGenerate("@@/example/scripts/ad.js$m1,m2=v2,m3=/^r3\\$/,m4=/r4\\/r4$/,m5=/^r5\\$/")).toEqual(
            "@@/example/scripts/ad.js$m1,m2=v2,m3=/^r3\\$/,m4=/r4\\/r4$/,m5=/^r5\\$/"
        );
        expect(
            parseAndGenerate("@@||example.org^$replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/v\\$1<\\/VAST>/i")
        ).toEqual("@@||example.org^$replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/v\\$1<\\/VAST>/i");
    });
});