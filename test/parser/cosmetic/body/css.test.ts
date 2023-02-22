/* eslint-disable max-len */
import { MediaQueryListPlain, SelectorPlain } from "@adguard/ecss-tree";
import { CssInjectionBodyParser, CssRuleBody, REMOVE_BLOCK_TYPE } from "../../../../src/parser/cosmetic/body/css";
import { AdblockSyntax } from "../../../../src/utils/adblockers";
import { EMPTY, SPACE } from "../../../../src/utils/constants";
import { CssTree } from "../../../../src/utils/csstree";
import { CssTreeParserContext } from "../../../../src/utils/csstree-constants";

describe("CssInjectionBodyParser", () => {
    test("isUboCssInjection", () => {
        expect(CssInjectionBodyParser.isUboCssInjection(EMPTY)).toBe(false);
        expect(CssInjectionBodyParser.isUboCssInjection(SPACE)).toBe(false);

        expect(CssInjectionBodyParser.isUboCssInjection(".ad")).toBe(false);

        expect(CssInjectionBodyParser.isUboCssInjection("body {}")).toBe(false);

        expect(CssInjectionBodyParser.isUboCssInjection("body { padding-top: 0 !important; }")).toBe(false);

        expect(
            CssInjectionBodyParser.isUboCssInjection(
                "@media (min-width: 1024px) { body { padding-top: 0 !important; } }"
            )
        ).toBe(false);

        // Empty
        expect(CssInjectionBodyParser.isUboCssInjection("body:style()")).toBe(false);

        expect(CssInjectionBodyParser.isUboCssInjection("body:style(padding-top: 0 !important;)")).toBe(true);

        expect(CssInjectionBodyParser.isUboCssInjection("body:ad-component:remove()")).toBe(true);
    });

    test("isAdgCssInjection", () => {
        expect(CssInjectionBodyParser.isAdgCssInjection(EMPTY)).toBe(false);
        expect(CssInjectionBodyParser.isAdgCssInjection(SPACE)).toBe(false);

        expect(CssInjectionBodyParser.isAdgCssInjection(".ad")).toBe(false);

        // Empty
        expect(CssInjectionBodyParser.isAdgCssInjection("body {}")).toBe(false);

        expect(CssInjectionBodyParser.isAdgCssInjection("body { padding-top: 0 !important; }")).toBe(true);

        expect(
            CssInjectionBodyParser.isAdgCssInjection(
                "@media (min-width: 1024px) { body { padding-top: 0 !important; } }"
            )
        ).toBe(true);

        expect(CssInjectionBodyParser.isAdgCssInjection("body:style()")).toBe(false);

        expect(CssInjectionBodyParser.isAdgCssInjection("body:style(padding-top: 0 !important;)")).toBe(false);

        expect(CssInjectionBodyParser.isAdgCssInjection("body:ad-component:remove()")).toBe(false);
    });

    test("parseAdgCssInjection", () => {
        expect(CssInjectionBodyParser.parseAdgCssInjection("body { padding-top: 0 !important; }")).toEqual(<
            CssRuleBody
        >{
            selectors: [CssTree.parsePlain("body", CssTreeParserContext.selector)],
            block: CssTree.parsePlain("{ padding-top: 0 !important; }", CssTreeParserContext.block),
        });

        expect(
            CssInjectionBodyParser.parseAdgCssInjection(
                // eslint-disable-next-line max-len
                "body, section:has(.something) { padding-top: 0 !important; padding-bottom: 0 !important; color: red !important; }"
            )
        ).toEqual(<CssRuleBody>{
            selectors: [
                CssTree.parsePlain("body", CssTreeParserContext.selector),
                CssTree.parsePlain("section:has(.something)", CssTreeParserContext.selector),
            ],
            block: CssTree.parsePlain(
                "{ padding-top: 0 !important; padding-bottom: 0 !important; color: red !important; }",
                CssTreeParserContext.block
            ),
        });

        // Complicated case: Media query, ExtCss selector
        expect(
            CssInjectionBodyParser.parseAdgCssInjection(
                // eslint-disable-next-line max-len
                "@media (min-width: 1000px) and (max-width: 2000px) { body, section:has(.something) { padding-top: 0 !important; padding-bottom: 0 !important; color: red !important; } }"
            )
        ).toEqual(<CssRuleBody>{
            mediaQueryList: CssTree.parsePlain(
                "(min-width: 1000px) and (max-width: 2000px)",
                CssTreeParserContext.mediaQueryList
            ),
            selectors: [
                CssTree.parsePlain("body", CssTreeParserContext.selector),
                CssTree.parsePlain("section:has(.something)", CssTreeParserContext.selector),
            ],
            block: CssTree.parsePlain(
                "{ padding-top: 0 !important; padding-bottom: 0 !important; color: red !important; }",
                CssTreeParserContext.block
            ),
        });

        // Remove
        expect(CssInjectionBodyParser.parseAdgCssInjection("body > section[ad-source] { remove: true; }")).toEqual(<
            CssRuleBody
        >{
            selectors: [CssTree.parsePlain("body > section[ad-source]", CssTreeParserContext.selector)],
            block: REMOVE_BLOCK_TYPE,
        });

        // Invalid cases
        expect(() =>
            CssInjectionBodyParser.parseAdgCssInjection("body > section[ad-source] { remove: true; remove: true; }")
        ).toThrowError(/^Multiple remove property found in the following CSS injection body:/);

        expect(() =>
            CssInjectionBodyParser.parseAdgCssInjection("body > section[ad-source] { remove: true; padding: 0; }")
        ).toThrowError(
            /^In addition to the remove property, the following CSS injection body also uses other properties:/
        );

        expect(() =>
            CssInjectionBodyParser.parseAdgCssInjection("body > section[ad-source] { padding: 0; remove: true; }")
        ).toThrowError(
            /^In addition to the remove property, the following CSS injection body also uses other properties:/
        );

        expect(() =>
            CssInjectionBodyParser.parseAdgCssInjection(
                "body > section[ad-source] { margin: 0; remove: true; padding: 0; }"
            )
        ).toThrowError(
            /^In addition to the remove property, the following CSS injection body also uses other properties:/
        );

        expect(() => CssInjectionBodyParser.parseAdgCssInjection("body > section[ad-source] { asd }")).toThrowError();
    });

    test("parseUboCssInjection", () => {
        expect(CssInjectionBodyParser.parseUboCssInjection("body:style(padding-top: 0 !important;)")).toEqual(<
            CssRuleBody
        >{
            selectors: [CssTree.parsePlain("body", CssTreeParserContext.selector)],
            block: CssTree.parsePlain("{ padding-top: 0 !important; }", CssTreeParserContext.block),
        });

        expect(
            CssInjectionBodyParser.parseUboCssInjection(
                // eslint-disable-next-line max-len
                "body, section:has(.something):style(padding-top: 0 !important; padding-bottom: 0 !important; color: red !important;)"
            )
        ).toEqual(<CssRuleBody>{
            selectors: [
                CssTree.parsePlain("body", CssTreeParserContext.selector),
                CssTree.parsePlain("section:has(.something)", CssTreeParserContext.selector),
            ],
            block: CssTree.parsePlain(
                "{ padding-top: 0 !important; padding-bottom: 0 !important; color: red !important; }",
                CssTreeParserContext.block
            ),
        });

        // Remove
        expect(CssInjectionBodyParser.parseUboCssInjection("body > section[ad-source]:remove()")).toEqual(<CssRuleBody>{
            selectors: [CssTree.parsePlain("body > section[ad-source]", CssTreeParserContext.selector)],
            block: REMOVE_BLOCK_TYPE,
        });

        // Invalid
        expect(CssInjectionBodyParser.parseUboCssInjection("body { padding: 0; }")).toBe(null);
    });

    test("parse", () => {
        expect(
            CssInjectionBodyParser.parse(
                // eslint-disable-next-line max-len
                "body, section:has(.something):style(padding-top: 0 !important; padding-bottom: 0 !important; color: red !important;)"
            )
        ).toEqual(<CssRuleBody>{
            selectors: [
                CssTree.parsePlain("body", CssTreeParserContext.selector),
                CssTree.parsePlain("section:has(.something)", CssTreeParserContext.selector),
            ],
            block: CssTree.parsePlain(
                "{ padding-top: 0 !important; padding-bottom: 0 !important; color: red !important; }",
                CssTreeParserContext.block
            ),
        });

        expect(CssInjectionBodyParser.parse("body, section:has(.something):remove()")).toEqual(<CssRuleBody>{
            selectors: [
                CssTree.parsePlain("body", CssTreeParserContext.selector),
                CssTree.parsePlain("section:has(.something)", CssTreeParserContext.selector),
            ],
            block: REMOVE_BLOCK_TYPE,
        });

        expect(
            CssInjectionBodyParser.parse(
                // eslint-disable-next-line max-len
                "@media (min-width: 1000px) and (max-width: 2000px) { body, section:has(.something) { padding-top: 0 !important; padding-bottom: 0 !important; color: red !important; } }"
            )
        ).toEqual(<CssRuleBody>{
            mediaQueryList: <MediaQueryListPlain>(
                CssTree.parsePlain("(min-width: 1000px) and (max-width: 2000px)", CssTreeParserContext.mediaQueryList)
            ),
            selectors: [
                CssTree.parsePlain("body", CssTreeParserContext.selector),
                CssTree.parsePlain("section:has(.something)", CssTreeParserContext.selector),
            ],
            block: CssTree.parsePlain(
                "{ padding-top: 0 !important; padding-bottom: 0 !important; color: red !important; }",
                CssTreeParserContext.block
            ),
        });

        expect(
            CssInjectionBodyParser.parse(
                "@media (min-width: 1000px) and (max-width: 2000px) { body, section:has(.something) { remove: true; } }"
            )
        ).toEqual(<CssRuleBody>{
            mediaQueryList: <MediaQueryListPlain>(
                CssTree.parsePlain("(min-width: 1000px) and (max-width: 2000px)", CssTreeParserContext.mediaQueryList)
            ),
            selectors: [
                CssTree.parsePlain("body", CssTreeParserContext.selector),
                CssTree.parsePlain("section:has(.something)", CssTreeParserContext.selector),
            ],
            block: REMOVE_BLOCK_TYPE,
        });
    });

    test("generate", () => {
        const parseAndGenerate = (raw: string, syntax: AdblockSyntax) => {
            const ast = CssInjectionBodyParser.parse(raw);

            if (ast) {
                return CssInjectionBodyParser.generate(ast, syntax);
            }

            return null;
        };

        expect(parseAndGenerate("body { padding: 0!important; }", AdblockSyntax.Adg)).toEqual(
            "body { padding: 0 !important; }"
        );

        expect(parseAndGenerate("body > .ad:remove()", AdblockSyntax.Ubo)).toEqual("body > .ad:remove()");

        expect(
            parseAndGenerate(
                // eslint-disable-next-line max-len
                "@media (min-width: 1000px) and (max-width: 2000px) { body, section:has(.something) { remove: true; } }",
                AdblockSyntax.Adg
            )
        ).toEqual(
            "@media (min-width:1000px) and (max-width:2000px) { body, section:has(.something) { remove: true; } }"
        );

        expect(
            CssInjectionBodyParser.generate(
                {
                    selectors: [<SelectorPlain>CssTree.parsePlain(".test", CssTreeParserContext.selector)],
                },
                AdblockSyntax.Adg
            )
        ).toEqual(".test { }");

        expect(
            CssInjectionBodyParser.generate(
                {
                    selectors: [<SelectorPlain>CssTree.parsePlain(".test", CssTreeParserContext.selector)],
                },
                AdblockSyntax.Ubo
            )
        ).toEqual(".test:style()");

        expect(() =>
            CssInjectionBodyParser.generate(
                {
                    selectors: [<SelectorPlain>CssTree.parsePlain(".test", CssTreeParserContext.selector)],
                },
                AdblockSyntax.Abp
            )
        ).toThrowError(/^Unsupported syntax:/);

        expect(() =>
            parseAndGenerate(
                "@media (min-width: 1000px) and (max-width: 2000px) { body, section:has(.something) { remove: true; } }",
                AdblockSyntax.Ubo
            )
        ).toThrowError("uBlock doesn't support media queries");
    });
});
