import { ScriptletBodyParser, ScriptletParameterType } from "../../../../src/parser/cosmetic/body/scriptlet";
import { AdblockSyntax } from "../../../../src/utils/adblockers";
import { EMPTY } from "../../../../src/utils/constants";

describe("ScriptletBodyParser", () => {
    test("parseAdgAndUboScriptletCall", () => {
        // Empty cases
        expect(ScriptletBodyParser.parseAdgAndUboScriptletCall("()")).toEqual({
            scriptlets: [],
        });

        expect(ScriptletBodyParser.parseAdgAndUboScriptletCall("(  )")).toEqual({
            scriptlets: [],
        });

        // Valid cases
        expect(ScriptletBodyParser.parseAdgAndUboScriptletCall("(scriptlet0)")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [],
                },
            ],
        });

        expect(ScriptletBodyParser.parseAdgAndUboScriptletCall("(scriptlet0,arg0)")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "arg0",
                        },
                    ],
                },
            ],
        });

        // Spaces
        expect(ScriptletBodyParser.parseAdgAndUboScriptletCall("(scriptlet0, arg0)")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "arg0",
                        },
                    ],
                },
            ],
        });

        expect(ScriptletBodyParser.parseAdgAndUboScriptletCall("( scriptlet0 , arg0 )")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "arg0",
                        },
                    ],
                },
            ],
        });

        expect(ScriptletBodyParser.parseAdgAndUboScriptletCall("(scriptlet0, arg0, arg1, arg2)")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "arg0",
                        },
                        {
                            type: "Unquoted",
                            value: "arg1",
                        },
                        {
                            type: "Unquoted",
                            value: "arg2",
                        },
                    ],
                },
            ],
        });

        expect(ScriptletBodyParser.parseAdgAndUboScriptletCall("(scriptlet0, 'arg0', \"arg1\", /arg2/, arg3)")).toEqual(
            {
                scriptlets: [
                    {
                        scriptlet: {
                            type: "Unquoted",
                            value: "scriptlet0",
                        },
                        parameters: [
                            {
                                type: "SingleQuoted",
                                value: "arg0",
                            },
                            {
                                type: "DoubleQuoted",
                                value: "arg1",
                            },
                            {
                                type: "RegExp",
                                value: "arg2",
                            },
                            {
                                type: "Unquoted",
                                value: "arg3",
                            },
                        ],
                    },
                ],
            }
        );

        expect(
            ScriptletBodyParser.parseAdgAndUboScriptletCall("(scriptlet0, 'ar\\'g0', \"ar\\\"g1\", /ar\\/g2/)")
        ).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "SingleQuoted",
                            value: "ar\\'g0",
                        },
                        {
                            type: "DoubleQuoted",
                            value: 'ar\\"g1',
                        },
                        {
                            type: "RegExp",
                            value: "ar\\/g2",
                        },
                    ],
                },
            ],
        });

        // Invalid cases
        expect(() => ScriptletBodyParser.parseAdgAndUboScriptletCall("scriptlet0, arg0, arg1, arg2")).toThrowError(
            /^Invalid uBlock\/AdGuard scriptlet call, no opening parentheses "\(" at call:/
        );

        expect(() => ScriptletBodyParser.parseAdgAndUboScriptletCall("(scriptlet0, arg0, arg1, arg2")).toThrowError(
            /^Invalid uBlock\/AdGuard scriptlet call, no closing parentheses "\)" at call:/
        );
    });

    test("splitAbpSnippetParameters & parseAbpSnippetCall", () => {
        // Valid cases
        expect(ScriptletBodyParser.parseAbpSnippetCall("scriptlet0")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [],
                },
            ],
        });

        expect(ScriptletBodyParser.parseAbpSnippetCall("scriptlet0 arg0")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "arg0",
                        },
                    ],
                },
            ],
        });

        expect(ScriptletBodyParser.parseAbpSnippetCall("scriptlet0 arg0 arg1")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "arg0",
                        },
                        {
                            type: "Unquoted",
                            value: "arg1",
                        },
                    ],
                },
            ],
        });

        // Escaped space
        expect(ScriptletBodyParser.parseAbpSnippetCall("scriptlet0 arg0\\ arg1 arg2")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "arg0\\ arg1",
                        },
                        {
                            type: "Unquoted",
                            value: "arg2",
                        },
                    ],
                },
            ],
        });

        // ; at end
        expect(ScriptletBodyParser.parseAbpSnippetCall("scriptlet0 arg0 arg1;")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "arg0",
                        },
                        {
                            type: "Unquoted",
                            value: "arg1",
                        },
                    ],
                },
            ],
        });

        // Unfinished strings
        expect(ScriptletBodyParser.parseAbpSnippetCall("scriptlet0 'arg0 arg1;")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "'arg0 arg1",
                        },
                    ],
                },
            ],
        });

        expect(ScriptletBodyParser.parseAbpSnippetCall('scriptlet0 "arg0 arg1;')).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: '"arg0 arg1',
                        },
                    ],
                },
            ],
        });

        // Multiple scriptlets
        expect(ScriptletBodyParser.parseAbpSnippetCall("scriptlet0 arg0 arg1; scriptlet1; scriptlet2 arg0")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "arg0",
                        },
                        {
                            type: "Unquoted",
                            value: "arg1",
                        },
                    ],
                },
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet1",
                    },
                    parameters: [],
                },
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet2",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "arg0",
                        },
                    ],
                },
            ],
        });

        expect(ScriptletBodyParser.parseAbpSnippetCall("scriptlet0 some'thing")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "some'thing",
                        },
                    ],
                },
            ],
        });

        // Complicated case
        expect(
            ScriptletBodyParser.parseAbpSnippetCall(
                "scriptlet0 arg0 /a;b/ 'a;b' \"a;b\"; scriptlet-1; scriptlet2 'arg0' arg1\\ something;"
            )
        ).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "arg0",
                        },
                        {
                            type: "RegExp",
                            value: "a;b",
                        },
                        {
                            type: "SingleQuoted",
                            value: "a;b",
                        },
                        {
                            type: "DoubleQuoted",
                            value: "a;b",
                        },
                    ],
                },
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet-1",
                    },
                    parameters: [],
                },
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet2",
                    },
                    parameters: [
                        {
                            type: "SingleQuoted",
                            value: "arg0",
                        },
                        {
                            type: "Unquoted",
                            value: "arg1\\ something",
                        },
                    ],
                },
            ],
        });

        // Another complicated case
        expect(
            ScriptletBodyParser.parseAbpSnippetCall(
                // eslint-disable-next-line max-len
                `hide-if-matches-xpath './/*[@class="test-xpath-class"]'; hide-if-matches-xpath './/div[@id="aaa"]//div[starts-with(@id,"aaa")][.//h1//span/text()="aaa"]'; hide-if-matches-xpath './/div[@id="bbb"]//div[starts-with(@id,"bbb")][.//h1//span/text()="bbb"]'`
            )
        ).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "hide-if-matches-xpath",
                    },
                    parameters: [
                        {
                            type: "SingleQuoted",
                            value: './/*[@class="test-xpath-class"]',
                        },
                    ],
                },
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "hide-if-matches-xpath",
                    },
                    parameters: [
                        {
                            type: "SingleQuoted",
                            value: './/div[@id="aaa"]//div[starts-with(@id,"aaa")][.//h1//span/text()="aaa"]',
                        },
                    ],
                },
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "hide-if-matches-xpath",
                    },
                    parameters: [
                        {
                            type: "SingleQuoted",
                            value: './/div[@id="bbb"]//div[starts-with(@id,"bbb")][.//h1//span/text()="bbb"]',
                        },
                    ],
                },
            ],
        });

        // Complicated "real world" example
        // eslint-disable-next-line max-len
        // Source: https://github.com/abp-filters/abp-filters-anti-cv/blob/4474f3aafcdb87bb7dd4053f1950068f7e3906ef/fb_non-graph.txt#L2
        expect(
            ScriptletBodyParser.parseAbpSnippetCall(
                // eslint-disable-next-line max-len
                `race start; hide-if-contains-visible-text /[Sponsred]{9}|[Gesponrtd]{10}|[Sponrisé]{10}|[Comandité]{9}|[Publicda]{10}|[Sponsrwae]{12}|[Patrocind]{11}|[Sponsrizat]{13}/ 'div[role=feed] div[role=article]' a[href="#"][role="link"]; hide-if-contains-visible-text /[Sponsred]{9}|[Gesponrtd]{10}|[Sponrisé]{10}|[Comandité]{9}|[Publicda]{10}|[Sponsrwae]{12}|[Patrocind]{11}|[Sponsrizat]{13}/ 'div[role=feed] div[role=article]' a[href^="?__cft__"]; hide-if-contains-visible-text /[Sponsred]{9}|[Gesponrtd]{10}|[Sponrisé]{10}|[Comandité]{9}|[Publicda]{10}|[Sponsrwae]{12}|[Patrocind]{11}|[Sponsrizat]{13}/ 'div[role=feed] div[role=article]' a[href="#"][role="link"]>span>span>b; hide-if-matches-xpath './/div[@role="feed"]//div[@role="article"]//a[@aria-label[.="Patrocinado" or .="Sponsa" or .="Bersponsor" or .="Commandité" or .="Ditaja" or .="Gesponsert" or .="Gesponsord" or .="Sponsrad" or .="Publicidad" or .="Sponsoreret" or .="Sponset" or .="Sponsored" or .="Sponsorisé" or .="Sponsorizat" or .="Sponsorizzato" or .="Sponsorlu" or .="Sponsorowane" or .="Реклама" or .="ממומן" or .="تمويل شوي" or .="دارای پشتیبانی مالی" or .="سپانسرڈ" or .="مُموَّل" or .="प्रायोजित" or .="সৌজন্যে" or .="ได้รับการสนับสนุน" or .="内容" or .="贊助" or .="Sponsoroitu" or .="May Sponsor" or .="Được tài trợ"]]/ancestor::div[@role="article"]'; race stop;`
            )
        ).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "race",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "start",
                        },
                    ],
                },
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "hide-if-contains-visible-text",
                    },
                    parameters: [
                        {
                            type: "RegExp",
                            // eslint-disable-next-line max-len
                            value: "[Sponsred]{9}|[Gesponrtd]{10}|[Sponrisé]{10}|[Comandité]{9}|[Publicda]{10}|[Sponsrwae]{12}|[Patrocind]{11}|[Sponsrizat]{13}",
                        },
                        {
                            type: "SingleQuoted",
                            value: "div[role=feed] div[role=article]",
                        },
                        {
                            type: "Unquoted",
                            value: 'a[href="#"][role="link"]',
                        },
                    ],
                },
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "hide-if-contains-visible-text",
                    },
                    parameters: [
                        {
                            type: "RegExp",
                            // eslint-disable-next-line max-len
                            value: "[Sponsred]{9}|[Gesponrtd]{10}|[Sponrisé]{10}|[Comandité]{9}|[Publicda]{10}|[Sponsrwae]{12}|[Patrocind]{11}|[Sponsrizat]{13}",
                        },
                        {
                            type: "SingleQuoted",
                            value: "div[role=feed] div[role=article]",
                        },
                        {
                            type: "Unquoted",
                            value: 'a[href^="?__cft__"]',
                        },
                    ],
                },
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "hide-if-contains-visible-text",
                    },
                    parameters: [
                        {
                            type: "RegExp",
                            // eslint-disable-next-line max-len
                            value: "[Sponsred]{9}|[Gesponrtd]{10}|[Sponrisé]{10}|[Comandité]{9}|[Publicda]{10}|[Sponsrwae]{12}|[Patrocind]{11}|[Sponsrizat]{13}",
                        },
                        {
                            type: "SingleQuoted",
                            value: "div[role=feed] div[role=article]",
                        },
                        {
                            type: "Unquoted",
                            value: 'a[href="#"][role="link"]>span>span>b',
                        },
                    ],
                },
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "hide-if-matches-xpath",
                    },
                    parameters: [
                        {
                            type: "SingleQuoted",
                            // eslint-disable-next-line max-len
                            value: `.//div[@role="feed"]//div[@role="article"]//a[@aria-label[.="Patrocinado" or .="Sponsa" or .="Bersponsor" or .="Commandité" or .="Ditaja" or .="Gesponsert" or .="Gesponsord" or .="Sponsrad" or .="Publicidad" or .="Sponsoreret" or .="Sponset" or .="Sponsored" or .="Sponsorisé" or .="Sponsorizat" or .="Sponsorizzato" or .="Sponsorlu" or .="Sponsorowane" or .="Реклама" or .="ממומן" or .="تمويل شوي" or .="دارای پشتیبانی مالی" or .="سپانسرڈ" or .="مُموَّل" or .="प्रायोजित" or .="সৌজন্যে" or .="ได้รับการสนับสนุน" or .="内容" or .="贊助" or .="Sponsoroitu" or .="May Sponsor" or .="Được tài trợ"]]/ancestor::div[@role="article"]`,
                        },
                    ],
                },
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "race",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "stop",
                        },
                    ],
                },
            ],
        });

        // Empty case
        expect(() => ScriptletBodyParser.parseAbpSnippetCall(EMPTY)).toThrowError(
            /^No scriptlet specified at the following scriptlet call/
        );
    });

    test("parse", () => {
        // ADG & uBO
        expect(ScriptletBodyParser.parse("(scriptlet0, arg0, /a;b/, 'a;b', \"a;b\")")).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "arg0",
                        },
                        {
                            type: "RegExp",
                            value: "a;b",
                        },
                        {
                            type: "SingleQuoted",
                            value: "a;b",
                        },
                        {
                            type: "DoubleQuoted",
                            value: "a;b",
                        },
                    ],
                },
            ],
        });

        // ABP
        expect(
            ScriptletBodyParser.parse(
                "scriptlet0 arg0 /a;b/ 'a;b' \"a;b\"; scriptlet-1; scriptlet2 'arg0' arg1\\ something;"
            )
        ).toEqual({
            scriptlets: [
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet0",
                    },
                    parameters: [
                        {
                            type: "Unquoted",
                            value: "arg0",
                        },
                        {
                            type: "RegExp",
                            value: "a;b",
                        },
                        {
                            type: "SingleQuoted",
                            value: "a;b",
                        },
                        {
                            type: "DoubleQuoted",
                            value: "a;b",
                        },
                    ],
                },
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet-1",
                    },
                    parameters: [],
                },
                {
                    scriptlet: {
                        type: "Unquoted",
                        value: "scriptlet2",
                    },
                    parameters: [
                        {
                            type: "SingleQuoted",
                            value: "arg0",
                        },
                        {
                            type: "Unquoted",
                            value: "arg1\\ something",
                        },
                    ],
                },
            ],
        });
    });

    test("generate", () => {
        const parseAndGenerate = (raw: string, syntax: AdblockSyntax) => {
            const ast = ScriptletBodyParser.parse(raw);

            if (ast) {
                return ScriptletBodyParser.generate(ast, syntax);
            }

            return null;
        };

        expect(parseAndGenerate("()", AdblockSyntax.Adg)).toEqual([]);

        expect(
            ScriptletBodyParser.generate(
                {
                    scriptlets: [
                        {
                            scriptlet: {
                                type: ScriptletParameterType.Unquoted,
                                value: "scriptlet1",
                            },
                        },
                    ],
                },
                AdblockSyntax.Adg
            )
        ).toEqual(["(scriptlet1)"]);

        expect(parseAndGenerate("(scriptlet0, arg0, /a;b/, 'a;b', \"a;b\")", AdblockSyntax.Adg)).toEqual([
            "(scriptlet0, arg0, /a;b/, 'a;b', \"a;b\")",
        ]);

        expect(
            parseAndGenerate(
                "scriptlet0 arg0 /a;b/ 'a;b' \"a;b\"; scriptlet-1; scriptlet2 'arg0' arg1\\ something;",
                AdblockSyntax.Abp
            )
        ).toEqual(["scriptlet0 arg0 /a;b/ 'a;b' \"a;b\"", "scriptlet-1", "scriptlet2 'arg0' arg1\\ something"]);

        expect(parseAndGenerate("scriptlet0 arg0 arg1; scriptlet1; scriptlet2 arg0", AdblockSyntax.Abp)).toEqual([
            "scriptlet0 arg0 arg1",
            "scriptlet1",
            "scriptlet2 arg0",
        ]);

        // Complicated "real world" example
        // eslint-disable-next-line max-len
        // Source: https://github.com/abp-filters/abp-filters-anti-cv/blob/4474f3aafcdb87bb7dd4053f1950068f7e3906ef/fb_non-graph.txt#L2
        expect(
            parseAndGenerate(
                // eslint-disable-next-line max-len
                `race start; hide-if-contains-visible-text /[Sponsred]{9}|[Gesponrtd]{10}|[Sponrisé]{10}|[Comandité]{9}|[Publicda]{10}|[Sponsrwae]{12}|[Patrocind]{11}|[Sponsrizat]{13}/ 'div[role=feed] div[role=article]' a[href="#"][role="link"]; hide-if-contains-visible-text /[Sponsred]{9}|[Gesponrtd]{10}|[Sponrisé]{10}|[Comandité]{9}|[Publicda]{10}|[Sponsrwae]{12}|[Patrocind]{11}|[Sponsrizat]{13}/ 'div[role=feed] div[role=article]' a[href^="?__cft__"]; hide-if-contains-visible-text /[Sponsred]{9}|[Gesponrtd]{10}|[Sponrisé]{10}|[Comandité]{9}|[Publicda]{10}|[Sponsrwae]{12}|[Patrocind]{11}|[Sponsrizat]{13}/ 'div[role=feed] div[role=article]' a[href="#"][role="link"]>span>span>b; hide-if-matches-xpath './/div[@role="feed"]//div[@role="article"]//a[@aria-label[.="Patrocinado" or .="Sponsa" or .="Bersponsor" or .="Commandité" or .="Ditaja" or .="Gesponsert" or .="Gesponsord" or .="Sponsrad" or .="Publicidad" or .="Sponsoreret" or .="Sponset" or .="Sponsored" or .="Sponsorisé" or .="Sponsorizat" or .="Sponsorizzato" or .="Sponsorlu" or .="Sponsorowane" or .="Реклама" or .="ממומן" or .="تمويل شوي" or .="دارای پشتیبانی مالی" or .="سپانسرڈ" or .="مُموَّل" or .="प्रायोजित" or .="সৌজন্যে" or .="ได้รับการสนับสนุน" or .="内容" or .="贊助" or .="Sponsoroitu" or .="May Sponsor" or .="Được tài trợ"]]/ancestor::div[@role="article"]'; race stop;`,
                AdblockSyntax.Abp
            )
        ).toEqual([
            "race start",
            // eslint-disable-next-line max-len
            `hide-if-contains-visible-text /[Sponsred]{9}|[Gesponrtd]{10}|[Sponrisé]{10}|[Comandité]{9}|[Publicda]{10}|[Sponsrwae]{12}|[Patrocind]{11}|[Sponsrizat]{13}/ 'div[role=feed] div[role=article]' a[href="#"][role="link"]`,
            // eslint-disable-next-line max-len
            `hide-if-contains-visible-text /[Sponsred]{9}|[Gesponrtd]{10}|[Sponrisé]{10}|[Comandité]{9}|[Publicda]{10}|[Sponsrwae]{12}|[Patrocind]{11}|[Sponsrizat]{13}/ 'div[role=feed] div[role=article]' a[href^="?__cft__"]`,
            // eslint-disable-next-line max-len
            `hide-if-contains-visible-text /[Sponsred]{9}|[Gesponrtd]{10}|[Sponrisé]{10}|[Comandité]{9}|[Publicda]{10}|[Sponsrwae]{12}|[Patrocind]{11}|[Sponsrizat]{13}/ 'div[role=feed] div[role=article]' a[href="#"][role="link"]>span>span>b`,
            // eslint-disable-next-line max-len
            `hide-if-matches-xpath './/div[@role="feed"]//div[@role="article"]//a[@aria-label[.="Patrocinado" or .="Sponsa" or .="Bersponsor" or .="Commandité" or .="Ditaja" or .="Gesponsert" or .="Gesponsord" or .="Sponsrad" or .="Publicidad" or .="Sponsoreret" or .="Sponset" or .="Sponsored" or .="Sponsorisé" or .="Sponsorizat" or .="Sponsorizzato" or .="Sponsorlu" or .="Sponsorowane" or .="Реклама" or .="ממומן" or .="تمويل شوي" or .="دارای پشتیبانی مالی" or .="سپانسرڈ" or .="مُموَّل" or .="प्रायोजित" or .="সৌজন্যে" or .="ได้รับการสนับสนุน" or .="内容" or .="贊助" or .="Sponsoroitu" or .="May Sponsor" or .="Được tài trợ"]]/ancestor::div[@role="article"]'`,
            `race stop`,
        ]);
    });
});
