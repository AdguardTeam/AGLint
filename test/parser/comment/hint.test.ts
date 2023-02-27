import { CommentRuleType } from '../../../src/parser/comment/types';
import { HintParser, Hint } from '../../../src/parser/comment/hint';
import { RuleCategory } from '../../../src/parser/common';
import { AdblockSyntax } from '../../../src/utils/adblockers';
import { EMPTY, SPACE } from '../../../src/utils/constants';

describe('HintParser', () => {
    test('isHint', () => {
        expect(HintParser.isHint(EMPTY)).toBe(false);
        expect(HintParser.isHint(SPACE)).toBe(false);
        expect(HintParser.isHint('! comment')).toBe(false);
        expect(HintParser.isHint('# comment')).toBe(false);
        expect(HintParser.isHint('#+')).toBe(false);
        expect(HintParser.isHint('#+ HINT_NAME1(PARAMS) HINT_NAME2(PARAMS)')).toBe(false);

        expect(HintParser.isHint('!+NOT_OPTIMIZED')).toBe(true);
        expect(HintParser.isHint('!+ NOT_OPTIMIZED')).toBe(true);
        expect(HintParser.isHint('!+ HINT_NAME1(PARAMS) HINT_NAME2(PARAMS)')).toBe(true);
    });

    test('parse', () => {
        // Empty
        expect(HintParser.parse('!+')).toEqual(<Hint>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Adg,
            type: CommentRuleType.Hint,
            hints: [],
        });

        expect(HintParser.parse('!+ ')).toEqual(<Hint>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Adg,
            type: CommentRuleType.Hint,
            hints: [],
        });

        // Without parameters
        expect(HintParser.parse('!+NOT_OPTIMIZED')).toEqual(<Hint>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Adg,
            type: CommentRuleType.Hint,
            hints: [
                {
                    name: 'NOT_OPTIMIZED',
                    params: [],
                },
            ],
        });

        expect(HintParser.parse('!+ NOT_OPTIMIZED')).toEqual(<Hint>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Adg,
            type: CommentRuleType.Hint,
            hints: [
                {
                    name: 'NOT_OPTIMIZED',
                    params: [],
                },
            ],
        });

        // Multiple, without parameters
        expect(HintParser.parse('!+ HINT_NAME1 HINT_NAME2')).toEqual(<Hint>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Adg,
            type: CommentRuleType.Hint,
            hints: [
                {
                    name: 'HINT_NAME1',
                    params: [],
                },
                {
                    name: 'HINT_NAME2',
                    params: [],
                },
            ],
        });

        // Without parameters, but with empty parameter list ()
        expect(HintParser.parse('!+ HINT_NAME1()')).toEqual(<Hint>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Adg,
            type: CommentRuleType.Hint,
            hints: [
                {
                    name: 'HINT_NAME1',
                    params: [EMPTY],
                },
            ],
        });

        expect(HintParser.parse('!+ HINT_NAME1(     )')).toEqual(<Hint>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Adg,
            type: CommentRuleType.Hint,
            hints: [
                {
                    name: 'HINT_NAME1',
                    params: [EMPTY],
                },
            ],
        });

        expect(HintParser.parse('!+ HINT_NAME1() HINT_NAME2()')).toEqual(<Hint>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Adg,
            type: CommentRuleType.Hint,
            hints: [
                {
                    name: 'HINT_NAME1',
                    params: [EMPTY],
                },
                {
                    name: 'HINT_NAME2',
                    params: [EMPTY],
                },
            ],
        });

        // Variadic
        expect(HintParser.parse('!+ HINT_NAME1(param0, param1) HINT_NAME2()')).toEqual(<Hint>{
            category: RuleCategory.Comment,
            syntax: AdblockSyntax.Adg,
            type: CommentRuleType.Hint,
            hints: [
                {
                    name: 'HINT_NAME1',
                    params: ['param0', 'param1'],
                },
                {
                    name: 'HINT_NAME2',
                    params: [EMPTY],
                },
            ],
        });

        expect(HintParser.parse('!+ HINT_NAME1(param0, param1) HINT_NAME2(param0)')).toEqual(
            <Hint>{
                category: RuleCategory.Comment,
                syntax: AdblockSyntax.Adg,
                type: CommentRuleType.Hint,
                hints: [
                    {
                        name: 'HINT_NAME1',
                        params: ['param0', 'param1'],
                    },
                    {
                        name: 'HINT_NAME2',
                        params: ['param0'],
                    },
                ],
            },
        );

        // Skipped parameters
        expect(HintParser.parse('!+ HINT_NAME(param0, , param1)')).toEqual(
            <Hint>{
                category: RuleCategory.Comment,
                syntax: AdblockSyntax.Adg,
                type: CommentRuleType.Hint,
                hints: [
                    {
                        name: 'HINT_NAME',
                        params: ['param0', EMPTY, 'param1'],
                    },
                ],
            },
        );

        expect(HintParser.parse('!+ HINT_NAME(param0, , , )')).toEqual(
            <Hint>{
                category: RuleCategory.Comment,
                syntax: AdblockSyntax.Adg,
                type: CommentRuleType.Hint,
                hints: [
                    {
                        name: 'HINT_NAME',
                        params: ['param0', EMPTY, EMPTY, EMPTY],
                    },
                ],
            },
        );

        expect(HintParser.parse('!+ HINT_NAME( , , , )')).toEqual(
            <Hint>{
                category: RuleCategory.Comment,
                syntax: AdblockSyntax.Adg,
                type: CommentRuleType.Hint,
                hints: [
                    {
                        name: 'HINT_NAME',
                        params: [EMPTY, EMPTY, EMPTY, EMPTY],
                    },
                ],
            },
        );

        expect(HintParser.parse('!+ HINT_NAME(,,,)')).toEqual(
            <Hint>{
                category: RuleCategory.Comment,
                syntax: AdblockSyntax.Adg,
                type: CommentRuleType.Hint,
                hints: [
                    {
                        name: 'HINT_NAME',
                        params: [EMPTY, EMPTY, EMPTY, EMPTY],
                    },
                ],
            },
        );

        // Spaces
        expect(HintParser.parse('!+ HINT_NAME(    p0  ,   p1 ,   p2 ,     p3)')).toEqual(
            <Hint>{
                category: RuleCategory.Comment,
                syntax: AdblockSyntax.Adg,
                type: CommentRuleType.Hint,
                hints: [
                    {
                        name: 'HINT_NAME',
                        params: ['p0', 'p1', 'p2', 'p3'],
                    },
                ],
            },
        );

        expect(HintParser.parse('!+ HINT_NAME(hello world, hello   world)')).toEqual(
            <Hint>{
                category: RuleCategory.Comment,
                syntax: AdblockSyntax.Adg,
                type: CommentRuleType.Hint,
                hints: [
                    {
                        name: 'HINT_NAME',
                        params: ['hello world', 'hello   world'],
                    },
                ],
            },
        );

        expect(HintParser.parse('!+ hint_name(hello world, hello   world)')).toEqual(
            <Hint>{
                category: RuleCategory.Comment,
                syntax: AdblockSyntax.Adg,
                type: CommentRuleType.Hint,
                hints: [
                    {
                        name: 'hint_name',
                        params: ['hello world', 'hello   world'],
                    },
                ],
            },
        );

        // Invalid hints
        expect(() => HintParser.parse('!++')).toThrowError(
            'Invalid character + in hint name at position 2 in comment "!++"',
        );

        expect(() => HintParser.parse('!+ (arg0)')).toThrowError(/^Missing hint name, invalid opening bracket found/);

        // Missing parentheses
        expect(() => HintParser.parse('!+ HINT_NAME(')).toThrowError(/^Unclosed opening bracket at/);

        expect(() => HintParser.parse('!+ HINT_NAME)')).toThrowError(
            /^No opening bracket found for closing bracket at position/,
        );

        // Nesting isn't supported
        expect(() => HintParser.parse('!+ HINT_NAME1(HINT_NAME2(PARAM0))')).toThrowError(
            /^Nesting hints isn't supported/,
        );
    });

    test('generate', () => {
        const parseAndGenerate = (raw: string) => {
            const ast = HintParser.parse(raw);

            if (ast) {
                return HintParser.generate(ast);
            }

            return null;
        };

        expect(parseAndGenerate('!+ NOT_OPTIMIZED')).toEqual('!+ NOT_OPTIMIZED');
        expect(parseAndGenerate('!+NOT_OPTIMIZED')).toEqual('!+ NOT_OPTIMIZED');
        expect(parseAndGenerate('!+ NOT_OPTIMIZED()')).toEqual('!+ NOT_OPTIMIZED()');
        expect(parseAndGenerate('!+    NOT_OPTIMIZED   ')).toEqual('!+ NOT_OPTIMIZED');

        expect(parseAndGenerate('!+ NOT_OPTIMIZED PLATFORM(windows)')).toEqual('!+ NOT_OPTIMIZED PLATFORM(windows)');

        expect(parseAndGenerate('!+      NOT_OPTIMIZED     PLATFORM(     windows   )    ')).toEqual(
            '!+ NOT_OPTIMIZED PLATFORM(windows)',
        );

        expect(parseAndGenerate('!+ NOT_OPTIMIZED PLATFORM(windows) NOT_PLATFORM(mac)')).toEqual(
            '!+ NOT_OPTIMIZED PLATFORM(windows) NOT_PLATFORM(mac)',
        );

        expect(parseAndGenerate('!+  NOT_OPTIMIZED  PLATFORM( windows )  NOT_PLATFORM( mac )')).toEqual(
            '!+ NOT_OPTIMIZED PLATFORM(windows) NOT_PLATFORM(mac)',
        );
    });
});
