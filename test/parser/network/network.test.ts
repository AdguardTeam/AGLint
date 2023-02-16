import { RuleCategory } from "../../../src/parser/categories";
import { NetworkRuleType } from "../../../src/parser/network/types";
import { RemoveHeaderNetworkRule, NetworkRuleParser, UBO_RESPONSEHEADER_INDICATOR } from "../../../src/parser/network";
import { AdblockSyntax } from "../../../src/utils/adblockers";
import { CLOSE_PARENTHESIS } from "../../../src/utils/constants";

describe("NetworkRuleParser", () => {
    test("parse", () => {
        expect(NetworkRuleParser.parse("||example.com")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: false,
            pattern: "||example.com",
            modifiers: [],
        });

        expect(NetworkRuleParser.parse("@@||example.com")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: true,
            pattern: "||example.com",
            modifiers: [],
        });

        expect(NetworkRuleParser.parse("@@||example.com$m1,m2=v2")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: true,
            pattern: "||example.com",
            modifiers: [
                {
                    modifier: "m1",
                    exception: false,
                },
                {
                    modifier: "m2",
                    exception: false,
                    value: "v2",
                },
            ],
        });

        expect(NetworkRuleParser.parse("/example/")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: false,
            pattern: "/example/",
            modifiers: [],
        });

        expect(NetworkRuleParser.parse("@@/example/")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: true,
            pattern: "/example/",
            modifiers: [],
        });

        expect(NetworkRuleParser.parse("@@/example/$m1,m2=v2")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: true,
            pattern: "/example/",
            modifiers: [
                {
                    modifier: "m1",
                    exception: false,
                },
                {
                    modifier: "m2",
                    exception: false,
                    value: "v2",
                },
            ],
        });

        // Last $ in regex pattern
        expect(NetworkRuleParser.parse("@@/example/$m1,m2=v2,m3=/^r3$/")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: true,
            pattern: "/example/",
            modifiers: [
                {
                    modifier: "m1",
                    exception: false,
                },
                {
                    modifier: "m2",
                    exception: false,
                    value: "v2",
                },
                {
                    modifier: "m3",
                    exception: false,
                    value: "/^r3$/",
                },
            ],
        });

        // Escaped $ in regex
        expect(NetworkRuleParser.parse("@@/example/$m1,m2=v2,m3=/^r3\\$/")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: true,
            pattern: "/example/",
            modifiers: [
                {
                    modifier: "m1",
                    exception: false,
                },
                {
                    modifier: "m2",
                    exception: false,
                    value: "v2",
                },
                {
                    modifier: "m3",
                    exception: false,
                    value: "/^r3\\$/",
                },
            ],
        });

        // Escaped separator
        expect(NetworkRuleParser.parse("example.com\\$m1")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: false,
            pattern: "example.com\\$m1",
            modifiers: [],
        });

        // Multiple separators
        expect(NetworkRuleParser.parse("example.com$m1$m2$m3$m4$m5")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: false,
            pattern: "example.com$m1$m2$m3$m4",
            modifiers: [
                {
                    modifier: "m5",
                    exception: false,
                },
            ],
        });

        expect(NetworkRuleParser.parse("example.com$m1=v1$m2$m3=v3$m4$m5=v5")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: false,
            pattern: "example.com$m1=v1$m2$m3=v3$m4",
            modifiers: [
                {
                    modifier: "m5",
                    exception: false,
                    value: "v5",
                },
            ],
        });

        // Starts with "/"
        expect(NetworkRuleParser.parse("/ad.js$m1=v1")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: false,
            pattern: "/ad.js",
            modifiers: [
                {
                    modifier: "m1",
                    exception: false,
                    value: "v1",
                },
            ],
        });

        // Pattern starts with / like regex patterns
        expect(NetworkRuleParser.parse("/ad.js^$m1=v1")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: false,
            pattern: "/ad.js^",
            modifiers: [
                {
                    modifier: "m1",
                    exception: false,
                    value: "v1",
                },
            ],
        });

        expect(NetworkRuleParser.parse("/ad.js^$m1=/^v1$/")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: false,
            pattern: "/ad.js^",
            modifiers: [
                {
                    modifier: "m1",
                    exception: false,
                    value: "/^v1$/",
                },
            ],
        });

        // Pattern contains an odd number of "/" characters
        expect(NetworkRuleParser.parse("example.com/a/b/c$m1=v1")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: false,
            pattern: "example.com/a/b/c",
            modifiers: [
                {
                    modifier: "m1",
                    exception: false,
                    value: "v1",
                },
            ],
        });

        expect(NetworkRuleParser.parse("example.com$m1,m2=/^regex$/")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: false,
            pattern: "example.com",
            modifiers: [
                {
                    modifier: "m1",
                    exception: false,
                },
                {
                    modifier: "m2",
                    exception: false,
                    value: "/^regex$/",
                },
            ],
        });

        // https://github.com/AdguardTeam/AGLint/issues/60
        expect(NetworkRuleParser.parse("||example.com/$aa/bb^$m1,m2=/^regex$/")).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: false,
            pattern: "||example.com/$aa/bb^",
            modifiers: [
                {
                    modifier: "m1",
                    exception: false,
                },
                {
                    modifier: "m2",
                    exception: false,
                    value: "/^regex$/",
                },
            ],
        });

        // Complicated case
        expect(
            NetworkRuleParser.parse("@@/example/scripts/ad.js$m1,m2=v2,m3=/^r3\\$/,m4=/r4\\/r4$/,m5=/^r5\\$/")
        ).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: true,
            pattern: "/example/scripts/ad.js",
            modifiers: [
                {
                    modifier: "m1",
                    exception: false,
                },
                {
                    modifier: "m2",
                    exception: false,
                    value: "v2",
                },
                {
                    modifier: "m3",
                    exception: false,
                    value: "/^r3\\$/",
                },
                {
                    modifier: "m4",
                    exception: false,
                    value: "/r4\\/r4$/",
                },
                {
                    modifier: "m5",
                    exception: false,
                    value: "/^r5\\$/",
                },
            ],
        });

        expect(
            NetworkRuleParser.parse(`@@||example.org^$replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/v\\$1<\\/VAST>/i`)
        ).toEqual({
            category: RuleCategory.Network,
            type: NetworkRuleType.BasicNetworkRule,
            syntax: AdblockSyntax.Common,
            exception: true,
            pattern: "||example.org^",
            modifiers: [
                {
                    modifier: "replace",
                    exception: false,
                    value: "/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/v\\$1<\\/VAST>/i",
                },
            ],
        });

        // ADG removeheader
        expect(NetworkRuleParser.parse(`||example.org^$removeheader=header-name`)).toEqual(<RemoveHeaderNetworkRule>{
            category: RuleCategory.Network,
            type: NetworkRuleType.RemoveHeaderNetworkRule,
            syntax: AdblockSyntax.Adg,
            exception: false,
            pattern: "||example.org^",
            header: "header-name",
        });

        expect(NetworkRuleParser.parse(`@@||example.org^$removeheader=header-name`)).toEqual(<RemoveHeaderNetworkRule>{
            category: RuleCategory.Network,
            type: NetworkRuleType.RemoveHeaderNetworkRule,
            syntax: AdblockSyntax.Adg,
            exception: true,
            pattern: "||example.org^",
            header: "header-name",
        });

        expect(NetworkRuleParser.parse(`||example.org^$removeheader=request:header-name`)).toEqual(<
            RemoveHeaderNetworkRule
        >{
            category: RuleCategory.Network,
            type: NetworkRuleType.RemoveHeaderNetworkRule,
            syntax: AdblockSyntax.Adg,
            exception: false,
            pattern: "||example.org^",
            header: "request:header-name",
        });

        expect(NetworkRuleParser.parse(`@@||example.org^$removeheader=request:header-name`)).toEqual(<
            RemoveHeaderNetworkRule
        >{
            category: RuleCategory.Network,
            type: NetworkRuleType.RemoveHeaderNetworkRule,
            syntax: AdblockSyntax.Adg,
            exception: true,
            pattern: "||example.org^",
            header: "request:header-name",
        });

        expect(() => NetworkRuleParser.parse(`||example.org^$removeheader=`)).toThrowError(
            /^No header name specified in rule/
        );

        // uBO responseheader
        expect(NetworkRuleParser.parse(`example.org##^responseheader(header-name)`)).toEqual(<RemoveHeaderNetworkRule>{
            category: RuleCategory.Network,
            type: NetworkRuleType.RemoveHeaderNetworkRule,
            syntax: AdblockSyntax.Ubo,
            exception: false,
            pattern: "example.org",
            header: "header-name",
        });

        expect(NetworkRuleParser.parse(`example.org#@#^responseheader(header-name)`)).toEqual(<RemoveHeaderNetworkRule>{
            category: RuleCategory.Network,
            type: NetworkRuleType.RemoveHeaderNetworkRule,
            syntax: AdblockSyntax.Ubo,
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
            `uBO responseheader filtering rule body must be end with "${CLOSE_PARENTHESIS}"`
        );

        expect(() => NetworkRuleParser.parse(`example.org#@#^responseheader(header-name`)).toThrowError(
            `uBO responseheader filtering rule body must be end with "${CLOSE_PARENTHESIS}"`
        );

        expect(() => NetworkRuleParser.parse(`example.org#@#^div + responseheader(header-name)`)).toThrowError(
            `uBO responseheader filtering rule body must be start with "${UBO_RESPONSEHEADER_INDICATOR}"`
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

        expect(parseAndGenerate(`||example.org^$removeheader=request:header-name`)).toEqual(
            `||example.org^$removeheader=request:header-name`
        );

        expect(parseAndGenerate(`@@||example.org^$removeheader=request:header-name`)).toEqual(
            `@@||example.org^$removeheader=request:header-name`
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
