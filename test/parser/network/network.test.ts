import { RuleCategories } from "../../../src/parser/common";
import { NetworkRuleType } from "../../../src/parser/network/common";
import {
    IRemoveHeaderNetworkRule,
    NetworkRuleParser,
    UBO_RESPONSEHEADER_INDICATOR,
} from "../../../src/parser/network/network";
import { AdblockSyntax } from "../../../src/utils/adblockers";
import { CLOSE_PARENTHESIS } from "../../../src/utils/constants";

describe("NetworkRuleParser", () => {
    test("parse", () => {
        expect(NetworkRuleParser.parse("||example.com")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            pattern: "||example.com",
            modifiers: [],
        });

        expect(NetworkRuleParser.parse("@@||example.com")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
            pattern: "||example.com",
            modifiers: [],
        });

        expect(NetworkRuleParser.parse("@@||example.com$m1,m2=v2")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
            pattern: "||example.com",
            modifiers: [
                {
                    modifier: "m1",
                },
                {
                    modifier: "m2",
                    value: "v2",
                },
            ],
        });

        expect(NetworkRuleParser.parse("/example/")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            pattern: "/example/",
            modifiers: [],
        });

        expect(NetworkRuleParser.parse("@@/example/")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
            pattern: "/example/",
            modifiers: [],
        });

        expect(NetworkRuleParser.parse("@@/example/$m1,m2=v2")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
            pattern: "/example/",
            modifiers: [
                {
                    modifier: "m1",
                },
                {
                    modifier: "m2",
                    value: "v2",
                },
            ],
        });

        // Last $ in regex pattern
        expect(NetworkRuleParser.parse("@@/example/$m1,m2=v2,m3=/^r3$/")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
            pattern: "/example/",
            modifiers: [
                {
                    modifier: "m1",
                },
                {
                    modifier: "m2",
                    value: "v2",
                },
                {
                    modifier: "m3",
                    value: "/^r3$/",
                },
            ],
        });

        // Escaped $ in regex
        expect(NetworkRuleParser.parse("@@/example/$m1,m2=v2,m3=/^r3\\$/")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
            pattern: "/example/",
            modifiers: [
                {
                    modifier: "m1",
                },
                {
                    modifier: "m2",
                    value: "v2",
                },
                {
                    modifier: "m3",
                    value: "/^r3\\$/",
                },
            ],
        });

        // Escaped separator
        expect(NetworkRuleParser.parse("example.com\\$m1")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            pattern: "example.com\\$m1",
            modifiers: [],
        });

        // Multiple separators
        expect(NetworkRuleParser.parse("example.com$m1$m2$m3$m4$m5")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            pattern: "example.com",
            modifiers: [
                {
                    modifier: "m1$m2$m3$m4$m5",
                },
            ],
        });

        expect(NetworkRuleParser.parse("example.com$m1=v1$m2$m3=v3$m4$m5=v5")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            pattern: "example.com",
            modifiers: [
                {
                    modifier: "m1",
                    value: "v1$m2$m3=v3$m4$m5=v5",
                },
            ],
        });

        // Starts with "/"
        expect(NetworkRuleParser.parse("/ad.js$m1=v1")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            pattern: "/ad.js",
            modifiers: [
                {
                    modifier: "m1",
                    value: "v1",
                },
            ],
        });

        // Pattern starts with / like regex patterns
        expect(NetworkRuleParser.parse("/ad.js^$m1=v1")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            pattern: "/ad.js^",
            modifiers: [
                {
                    modifier: "m1",
                    value: "v1",
                },
            ],
        });

        expect(NetworkRuleParser.parse("/ad.js^$m1=/^v1$/")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            pattern: "/ad.js^",
            modifiers: [
                {
                    modifier: "m1",
                    value: "/^v1$/",
                },
            ],
        });

        // Pattern contains an odd number of "/" characters
        expect(NetworkRuleParser.parse("example.com/a/b/c$m1=v1")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            pattern: "example.com/a/b/c",
            modifiers: [
                {
                    modifier: "m1",
                    value: "v1",
                },
            ],
        });

        expect(NetworkRuleParser.parse("example.com$m1,m2=/^regex$/")).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: false,
            pattern: "example.com",
            modifiers: [
                {
                    modifier: "m1",
                },
                {
                    modifier: "m2",
                    value: "/^regex$/",
                },
            ],
        });

        // Complicated case
        expect(
            NetworkRuleParser.parse("@@/example/scripts/ad.js$m1,m2=v2,m3=/^r3\\$/,m4=/r4\\/r4$/,m5=/^r5\\$/")
        ).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
            pattern: "/example/scripts/ad.js",
            modifiers: [
                {
                    modifier: "m1",
                },
                {
                    modifier: "m2",
                    value: "v2",
                },
                {
                    modifier: "m3",
                    value: "/^r3\\$/",
                },
                {
                    modifier: "m4",
                    value: "/r4\\/r4$/",
                },
                {
                    modifier: "m5",
                    value: "/^r5\\$/",
                },
            ],
        });

        expect(
            NetworkRuleParser.parse(`@@||example.org^$replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/v\\$1<\\/VAST>/i`)
        ).toEqual({
            category: RuleCategories.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Unknown,
            exception: true,
            pattern: "||example.org^",
            modifiers: [
                {
                    modifier: "replace",
                    value: "/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/v\\$1<\\/VAST>/i",
                },
            ],
        });

        // ADG removeheader
        expect(NetworkRuleParser.parse(`||example.org^$removeheader=header-name`)).toEqual(<IRemoveHeaderNetworkRule>{
            category: RuleCategories.Network,
            type: NetworkRuleType.RemoveHeaderNetworkRule,
            syntax: AdblockSyntax.AdGuard,
            exception: false,
            pattern: "||example.org^",
            header: "header-name",
        });

        expect(NetworkRuleParser.parse(`@@||example.org^$removeheader=header-name`)).toEqual(<IRemoveHeaderNetworkRule>{
            category: RuleCategories.Network,
            type: NetworkRuleType.RemoveHeaderNetworkRule,
            syntax: AdblockSyntax.AdGuard,
            exception: true,
            pattern: "||example.org^",
            header: "header-name",
        });

        expect(() => NetworkRuleParser.parse(`||example.org^$removeheader=`)).toThrowError(
            /^No header name specified in rule/
        );

        // uBO responseheader
        expect(NetworkRuleParser.parse(`example.org##^responseheader(header-name)`)).toEqual(<IRemoveHeaderNetworkRule>{
            category: RuleCategories.Network,
            type: NetworkRuleType.RemoveHeaderNetworkRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: false,
            pattern: "example.org",
            header: "header-name",
        });

        expect(NetworkRuleParser.parse(`example.org#@#^responseheader(header-name)`)).toEqual(<
            IRemoveHeaderNetworkRule
        >{
            category: RuleCategories.Network,
            type: NetworkRuleType.RemoveHeaderNetworkRule,
            syntax: AdblockSyntax.uBlockOrigin,
            exception: true,
            pattern: "example.org",
            header: "header-name",
        });

        expect(() => NetworkRuleParser.parse(`responseheader()`)).toThrowError(
            "uBO responseheader filtering requires a valid uBO HTML rule separator"
        );

        expect(() => NetworkRuleParser.parse(`example.org#@#^responseheader()`)).toThrowError(
            /^No header name specified in rule/
        );

        expect(() => NetworkRuleParser.parse(`example.org#@#^responseheader(  )`)).toThrowError(
            /^No header name specified in rule/
        );

        expect(() => NetworkRuleParser.parse(`example.org#@#^responseheader(`)).toThrowError(
            `uBO responseheader filtering rule body must be ends with "${CLOSE_PARENTHESIS}"`
        );

        expect(() => NetworkRuleParser.parse(`example.org#@#^responseheader(header-name`)).toThrowError(
            `uBO responseheader filtering rule body must be ends with "${CLOSE_PARENTHESIS}"`
        );

        expect(() => NetworkRuleParser.parse(`example.org#@#^div + responseheader(header-name)`)).toThrowError(
            `uBO responseheader filtering rule body must be starts with "${UBO_RESPONSEHEADER_INDICATOR}"`
        );
    });

    test("generate", () => {
        const parseAndGenerate = (raw: string) => {
            const ast = NetworkRuleParser.parse(raw);

            if (ast) {
                return NetworkRuleParser.generate(ast);
            }

            return null;
        };

        expect(parseAndGenerate("-ad-350-")).toEqual("-ad-350-");
        expect(parseAndGenerate("||example.com")).toEqual("||example.com");
        expect(parseAndGenerate("@@||example.com")).toEqual("@@||example.com");
        expect(parseAndGenerate("||example.com$third-party")).toEqual("||example.com$third-party");
        expect(parseAndGenerate("||example.com$")).toEqual("||example.com");
        expect(parseAndGenerate("/regex-pattern/")).toEqual("/regex-pattern/");
        expect(parseAndGenerate("/regex-pattern/$script")).toEqual("/regex-pattern/$script");
        expect(parseAndGenerate("@@/regex-pattern/$script")).toEqual("@@/regex-pattern/$script");

        expect(parseAndGenerate("@@/example/scripts/ad.js$m1,m2=v2,m3=/^r3\\$/,m4=/r4\\/r4$/,m5=/^r5\\$/")).toEqual(
            "@@/example/scripts/ad.js$m1,m2=v2,m3=/^r3\\$/,m4=/r4\\/r4$/,m5=/^r5\\$/"
        );

        // ADG removeheader
        expect(parseAndGenerate(`||example.org^$removeheader=header-name`)).toEqual(
            `||example.org^$removeheader=header-name`
        );

        expect(parseAndGenerate(`@@||example.org^$removeheader=header-name`)).toEqual(
            `@@||example.org^$removeheader=header-name`
        );

        // uBO responseheader
        expect(parseAndGenerate(`example.org##^responseheader(header-name)`)).toEqual(
            `example.org##^responseheader(header-name)`
        );

        expect(parseAndGenerate(`example.org##^responseheader( header-name )`)).toEqual(
            `example.org##^responseheader(header-name)`
        );

        expect(parseAndGenerate(`example.org#@#^responseheader(header-name)`)).toEqual(
            `example.org#@#^responseheader(header-name)`
        );
    });
});
