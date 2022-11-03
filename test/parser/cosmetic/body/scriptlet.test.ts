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
                            value: "some",
                        },
                        {
                            type: "Unquoted",
                            value: "'thing",
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

        expect(parseAndGenerate("()", AdblockSyntax.AdGuard)).toEqual([]);

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
                AdblockSyntax.AdGuard
            )
        ).toEqual(["(scriptlet1)"]);

        expect(parseAndGenerate("(scriptlet0, arg0, /a;b/, 'a;b', \"a;b\")", AdblockSyntax.AdGuard)).toEqual([
            "(scriptlet0, arg0, /a;b/, 'a;b', \"a;b\")",
        ]);

        expect(
            parseAndGenerate(
                "scriptlet0 arg0 /a;b/ 'a;b' \"a;b\"; scriptlet-1; scriptlet2 'arg0' arg1\\ something;",
                AdblockSyntax.AdblockPlus
            )
        ).toEqual(["scriptlet0 arg0 /a;b/ 'a;b' \"a;b\"", "scriptlet-1", "scriptlet2 'arg0' arg1\\ something"]);

        expect(
            parseAndGenerate("scriptlet0 arg0 arg1; scriptlet1; scriptlet2 arg0", AdblockSyntax.AdblockPlus)
        ).toEqual(["scriptlet0 arg0 arg1", "scriptlet1", "scriptlet2 arg0"]);
    });
});
