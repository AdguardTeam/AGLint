import { EMPTY, SPACE } from "../../src/utils/constants";
import { CosmeticRuleSeparatorUtils } from "../../src/utils/cosmetic-rule-separator";

describe("CosmeticRuleSeparator", () => {
    test("find", () => {
        // Elemhide
        expect(CosmeticRuleSeparatorUtils.find("##.ad")).toEqual([0, 2, "##", false]);
        expect(CosmeticRuleSeparatorUtils.find("example.com##.ad")).toEqual([11, 13, "##", false]);
        expect(CosmeticRuleSeparatorUtils.find("example.com#@#.ad")).toEqual([11, 14, "#@#", true]);

        expect(CosmeticRuleSeparatorUtils.find("example.com,example.org#@#.ad")).toEqual([23, 26, "#@#", true]);

        expect(CosmeticRuleSeparatorUtils.find("example.com,example.org#?##ad:contains(ad)")).toEqual([
            23,
            26,
            "#?#",
            false,
        ]);

        expect(CosmeticRuleSeparatorUtils.find("example.com,example.org#@?##ad:contains(ad)")).toEqual([
            23,
            27,
            "#@?#",
            true,
        ]);

        // CSS inject
        expect(
            CosmeticRuleSeparatorUtils.find("example.com,example.org#$##ad { padding-top: 0px !important }")
        ).toEqual([23, 26, "#$#", false]);

        expect(
            CosmeticRuleSeparatorUtils.find("example.com,example.org#@$##ad { padding-top: 0px !important }")
        ).toEqual([23, 27, "#@$#", true]);

        // CSS inject with extended CSS selectors
        expect(
            CosmeticRuleSeparatorUtils.find(
                "example.com,example.org#$?##ad:has(>script) { padding-top: 0px !important }"
            )
        ).toEqual([23, 27, "#$?#", false]);

        expect(
            CosmeticRuleSeparatorUtils.find(
                "example.com,example.org#@$?##ad:has(>script) { padding-top: 0px !important }"
            )
        ).toEqual([23, 28, "#@$?#", true]);

        // uBO scriptlet
        expect(CosmeticRuleSeparatorUtils.find("example.com,example.org##+js(scriptlet, param0, param1)")).toEqual([
            23,
            28,
            "##+js",
            false,
        ]);

        expect(CosmeticRuleSeparatorUtils.find("example.com,example.org#@#+js(scriptlet, param0, param1)")).toEqual([
            23,
            29,
            "#@#+js",
            true,
        ]);

        // uBO HTML
        expect(CosmeticRuleSeparatorUtils.find("example.com,example.org##^script:has-text(advert)")).toEqual([
            23,
            26,
            "##^",
            false,
        ]);

        expect(CosmeticRuleSeparatorUtils.find("example.com,example.org#@#^script:has-text(advert)")).toEqual([
            23,
            27,
            "#@#^",
            true,
        ]);

        // ADG scriptlet
        expect(CosmeticRuleSeparatorUtils.find("example.com,example.org#%#//scriptlet('scriptlet', 'param0')")).toEqual(
            [23, 37, "#%#//scriptlet", false]
        );

        expect(
            CosmeticRuleSeparatorUtils.find("example.com,example.org#@%#//scriptlet('scriptlet', 'param0')")
        ).toEqual([23, 38, "#@%#//scriptlet", true]);

        // ADG HTML
        expect(CosmeticRuleSeparatorUtils.find('example.com,example.org$$script[tag-content="advert"]')).toEqual([
            23,
            25,
            "$$",
            false,
        ]);

        expect(CosmeticRuleSeparatorUtils.find('example.com,example.org$@$script[tag-content="advert"]')).toEqual([
            23,
            26,
            "$@$",
            true,
        ]);

        // ADG JS
        expect(CosmeticRuleSeparatorUtils.find("example.com,example.org#%#var a = 1;")).toEqual([23, 26, "#%#", false]);

        expect(CosmeticRuleSeparatorUtils.find("example.com,example.org#@%#var a = 1;")).toEqual([
            23,
            27,
            "#@%#",
            true,
        ]);

        // Handle conflicts
        expect(CosmeticRuleSeparatorUtils.find('example.com$$script[tag-content="#example"]')).toEqual([
            11,
            13,
            "$$",
            false,
        ]);

        // Invalid rules
        expect(CosmeticRuleSeparatorUtils.find(EMPTY)).toEqual([-1, -1, null, null]);
        expect(CosmeticRuleSeparatorUtils.find(SPACE)).toEqual([-1, -1, null, null]);

        expect(CosmeticRuleSeparatorUtils.find("#")).toEqual([-1, -1, null, null]);
        expect(CosmeticRuleSeparatorUtils.find("$")).toEqual([-1, -1, null, null]);
        expect(CosmeticRuleSeparatorUtils.find("$ $")).toEqual([-1, -1, null, null]);

        expect(
            CosmeticRuleSeparatorUtils.find("example.com,example.org# @%#//scriptlet('scriptlet', 'param0')")
        ).toEqual([-1, -1, null, null]);

        expect(
            CosmeticRuleSeparatorUtils.find("example.com,example.org#!@%#//scriptlet('scriptlet', 'param0')")
        ).toEqual([-1, -1, null, null]);

        expect(CosmeticRuleSeparatorUtils.find("example.com#.ad")).toEqual([-1, -1, null, null]);

        expect(CosmeticRuleSeparatorUtils.find("example.com#{}#.ad")).toEqual([-1, -1, null, null]);

        expect(CosmeticRuleSeparatorUtils.find("127.0.0.1 localhost ## comment")).toEqual([-1, -1, null, null]);
    });
});
