import { CommentRuleParser } from '../../../src/parser/comment';
import { EMPTY, SPACE } from '../../../src/utils/constants';

describe('CommentRuleParser', () => {
    test('isCommentRule', () => {
        // Empty
        expect(CommentRuleParser.isCommentRule(EMPTY)).toBe(false);
        expect(CommentRuleParser.isCommentRule(SPACE)).toBe(false);

        // Begins with !
        expect(CommentRuleParser.isCommentRule('!')).toBe(true);
        expect(CommentRuleParser.isCommentRule('!!')).toBe(true);
        expect(CommentRuleParser.isCommentRule('!comment')).toBe(true);
        expect(CommentRuleParser.isCommentRule('! comment')).toBe(true);
        expect(CommentRuleParser.isCommentRule('!+comment')).toBe(true);
        expect(CommentRuleParser.isCommentRule('!#comment')).toBe(true);
        expect(CommentRuleParser.isCommentRule('!#########################')).toBe(true);
        expect(CommentRuleParser.isCommentRule('! #########################')).toBe(true);
        expect(CommentRuleParser.isCommentRule(' !')).toBe(true);
        expect(CommentRuleParser.isCommentRule('  !')).toBe(true);

        // Begins with #
        expect(CommentRuleParser.isCommentRule('#')).toBe(true);
        expect(CommentRuleParser.isCommentRule('##')).toBe(true);
        expect(CommentRuleParser.isCommentRule('# #')).toBe(true);
        expect(CommentRuleParser.isCommentRule('#comment')).toBe(true);
        expect(CommentRuleParser.isCommentRule('# comment')).toBe(true);
        expect(CommentRuleParser.isCommentRule('#+comment')).toBe(true);
        expect(CommentRuleParser.isCommentRule('#########################')).toBe(true);
        expect(CommentRuleParser.isCommentRule('# ########################')).toBe(true);
        expect(CommentRuleParser.isCommentRule(' #')).toBe(true);
        expect(CommentRuleParser.isCommentRule('  ##')).toBe(true);

        // Cosmetic rules (also begins with #)
        expect(CommentRuleParser.isCommentRule('##.selector')).toBe(false);
        expect(CommentRuleParser.isCommentRule('#@#.selector')).toBe(false);
        expect(CommentRuleParser.isCommentRule("#%#//scriptlet('scriptlet')")).toBe(false);
        expect(CommentRuleParser.isCommentRule(" #%#//scriptlet('scriptlet')")).toBe(false);

        // Adblock agents
        expect(CommentRuleParser.isCommentRule('[Adblock Plus 2.0]')).toBe(true);
        expect(CommentRuleParser.isCommentRule('[Adblock]')).toBe(true);
        expect(CommentRuleParser.isCommentRule('[Adblock Plus 2.0; AdGuard]')).toBe(true);
        expect(CommentRuleParser.isCommentRule('[Adblock Plus 2.0; AdGuard 1.0]')).toBe(true);
        expect(CommentRuleParser.isCommentRule('[uBlock]')).toBe(true);
        expect(CommentRuleParser.isCommentRule('[uBlock Origin]')).toBe(true);
        expect(CommentRuleParser.isCommentRule('[Adblock Plus 2.0]')).toBe(true);
        expect(CommentRuleParser.isCommentRule('  [Adblock Plus 2.0]')).toBe(true);
    });

    test('parse', () => {
        // Empty / not comment
        expect(CommentRuleParser.parse(EMPTY)).toBe(null);
        expect(CommentRuleParser.parse(SPACE)).toBe(null);
        expect(CommentRuleParser.parse('##.ad')).toBe(null);
        expect(CommentRuleParser.parse('#@#.ad')).toBe(null);

        // Agents
        expect(CommentRuleParser.parse('[Adblock Plus 2.0]')).toEqual({
            type: 'AgentCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 18,
                    line: 1,
                    column: 19,
                },
            },
            syntax: 'Common',
            category: 'Comment',
            agents: {
                type: 'AgentList',
                loc: {
                    start: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                    end: {
                        offset: 17,
                        line: 1,
                        column: 18,
                    },
                },
                children: [
                    {
                        type: 'Agent',
                        loc: {
                            start: {
                                offset: 1,
                                line: 1,
                                column: 2,
                            },
                            end: {
                                offset: 17,
                                line: 1,
                                column: 18,
                            },
                        },
                        adblock: {
                            type: 'Value',
                            loc: {
                                start: {
                                    offset: 1,
                                    line: 1,
                                    column: 2,
                                },
                                end: {
                                    offset: 13,
                                    line: 1,
                                    column: 14,
                                },
                            },
                            value: 'Adblock Plus',
                        },
                        version: {
                            type: 'Value',
                            loc: {
                                start: {
                                    offset: 14,
                                    line: 1,
                                    column: 15,
                                },
                                end: {
                                    offset: 17,
                                    line: 1,
                                    column: 18,
                                },
                            },
                            value: '2.0',
                        },
                    },
                ],
            },
        });

        expect(CommentRuleParser.parse('[AdGuard]')).toEqual({
            type: 'AgentCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 9,
                    line: 1,
                    column: 10,
                },
            },
            syntax: 'Common',
            category: 'Comment',
            agents: {
                type: 'AgentList',
                loc: {
                    start: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                    end: {
                        offset: 8,
                        line: 1,
                        column: 9,
                    },
                },
                children: [
                    {
                        type: 'Agent',
                        loc: {
                            start: {
                                offset: 1,
                                line: 1,
                                column: 2,
                            },
                            end: {
                                offset: 8,
                                line: 1,
                                column: 9,
                            },
                        },
                        adblock: {
                            type: 'Value',
                            loc: {
                                start: {
                                    offset: 1,
                                    line: 1,
                                    column: 2,
                                },
                                end: {
                                    offset: 8,
                                    line: 1,
                                    column: 9,
                                },
                            },
                            value: 'AdGuard',
                        },
                        version: null,
                    },
                ],
            },
        });

        // Hints
        expect(CommentRuleParser.parse('!+ NOT_OPTIMIZED')).toEqual({
            type: 'HintCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 16,
                    line: 1,
                    column: 17,
                },
            },
            category: 'Comment',
            syntax: 'AdGuard',
            hints: [
                {
                    type: 'Hint',
                    loc: {
                        start: {
                            offset: 3,
                            line: 1,
                            column: 4,
                        },
                        end: {
                            offset: 16,
                            line: 1,
                            column: 17,
                        },
                    },
                    name: {
                        type: 'Value',
                        loc: {
                            start: {
                                offset: 3,
                                line: 1,
                                column: 4,
                            },
                            end: {
                                offset: 16,
                                line: 1,
                                column: 17,
                            },
                        },
                        value: 'NOT_OPTIMIZED',
                    },
                },
            ],
        });

        expect(CommentRuleParser.parse('!+NOT_OPTIMIZED')).toEqual({
            type: 'HintCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 15,
                    line: 1,
                    column: 16,
                },
            },
            category: 'Comment',
            syntax: 'AdGuard',
            hints: [
                {
                    type: 'Hint',
                    loc: {
                        start: {
                            offset: 2,
                            line: 1,
                            column: 3,
                        },
                        end: {
                            offset: 15,
                            line: 1,
                            column: 16,
                        },
                    },
                    name: {
                        type: 'Value',
                        loc: {
                            start: {
                                offset: 2,
                                line: 1,
                                column: 3,
                            },
                            end: {
                                offset: 15,
                                line: 1,
                                column: 16,
                            },
                        },
                        value: 'NOT_OPTIMIZED',
                    },
                },
            ],
        });

        expect(CommentRuleParser.parse('!+ NOT_OPTIMIZED PLATFORM(windows, mac) NOT_PLATFORM(android, ios)')).toEqual({
            type: 'HintCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 66,
                    line: 1,
                    column: 67,
                },
            },
            category: 'Comment',
            syntax: 'AdGuard',
            hints: [
                {
                    type: 'Hint',
                    loc: {
                        start: {
                            offset: 3,
                            line: 1,
                            column: 4,
                        },
                        end: {
                            offset: 16,
                            line: 1,
                            column: 17,
                        },
                    },
                    name: {
                        type: 'Value',
                        loc: {
                            start: {
                                offset: 3,
                                line: 1,
                                column: 4,
                            },
                            end: {
                                offset: 16,
                                line: 1,
                                column: 17,
                            },
                        },
                        value: 'NOT_OPTIMIZED',
                    },
                },
                {
                    type: 'Hint',
                    loc: {
                        start: {
                            offset: 17,
                            line: 1,
                            column: 18,
                        },
                        end: {
                            offset: 39,
                            line: 1,
                            column: 40,
                        },
                    },
                    name: {
                        type: 'Value',
                        loc: {
                            start: {
                                offset: 17,
                                line: 1,
                                column: 18,
                            },
                            end: {
                                offset: 25,
                                line: 1,
                                column: 26,
                            },
                        },
                        value: 'PLATFORM',
                    },
                    params: {
                        type: 'ParameterList',
                        loc: {
                            start: {
                                offset: 26,
                                line: 1,
                                column: 27,
                            },
                            end: {
                                offset: 38,
                                line: 1,
                                column: 39,
                            },
                        },
                        children: [
                            {
                                type: 'Parameter',
                                loc: {
                                    start: {
                                        offset: 26,
                                        line: 1,
                                        column: 27,
                                    },
                                    end: {
                                        offset: 33,
                                        line: 1,
                                        column: 34,
                                    },
                                },
                                value: 'windows',
                            },
                            {
                                type: 'Parameter',
                                loc: {
                                    start: {
                                        offset: 35,
                                        line: 1,
                                        column: 36,
                                    },
                                    end: {
                                        offset: 38,
                                        line: 1,
                                        column: 39,
                                    },
                                },
                                value: 'mac',
                            },
                        ],
                    },
                },
                {
                    type: 'Hint',
                    loc: {
                        start: {
                            offset: 40,
                            line: 1,
                            column: 41,
                        },
                        end: {
                            offset: 66,
                            line: 1,
                            column: 67,
                        },
                    },
                    name: {
                        type: 'Value',
                        loc: {
                            start: {
                                offset: 40,
                                line: 1,
                                column: 41,
                            },
                            end: {
                                offset: 52,
                                line: 1,
                                column: 53,
                            },
                        },
                        value: 'NOT_PLATFORM',
                    },
                    params: {
                        type: 'ParameterList',
                        loc: {
                            start: {
                                offset: 53,
                                line: 1,
                                column: 54,
                            },
                            end: {
                                offset: 65,
                                line: 1,
                                column: 66,
                            },
                        },
                        children: [
                            {
                                type: 'Parameter',
                                loc: {
                                    start: {
                                        offset: 53,
                                        line: 1,
                                        column: 54,
                                    },
                                    end: {
                                        offset: 60,
                                        line: 1,
                                        column: 61,
                                    },
                                },
                                value: 'android',
                            },
                            {
                                type: 'Parameter',
                                loc: {
                                    start: {
                                        offset: 62,
                                        line: 1,
                                        column: 63,
                                    },
                                    end: {
                                        offset: 65,
                                        line: 1,
                                        column: 66,
                                    },
                                },
                                value: 'ios',
                            },
                        ],
                    },
                },
            ],
        });

        // Pre processors
        expect(CommentRuleParser.parse('!#if (adguard)')).toEqual({
            type: 'PreProcessorCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 14,
                    line: 1,
                    column: 15,
                },
            },
            category: 'Comment',
            syntax: 'Common',
            name: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 2,
                        line: 1,
                        column: 3,
                    },
                    end: {
                        offset: 4,
                        line: 1,
                        column: 5,
                    },
                },
                value: 'if',
            },
            params: {
                type: 'Parenthesis',
                loc: {
                    start: {
                        offset: 6,
                        line: 1,
                        column: 7,
                    },
                    end: {
                        offset: 13,
                        line: 1,
                        column: 14,
                    },
                },
                expression: {
                    type: 'Variable',
                    loc: {
                        start: {
                            offset: 6,
                            line: 1,
                            column: 7,
                        },
                        end: {
                            offset: 13,
                            line: 1,
                            column: 14,
                        },
                    },
                    name: 'adguard',
                },
            },
        });

        expect(CommentRuleParser.parse('!#if (adguard && !adguard_ext_safari)')).toEqual({
            type: 'PreProcessorCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 37,
                    line: 1,
                    column: 38,
                },
            },
            category: 'Comment',
            syntax: 'Common',
            name: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 2,
                        line: 1,
                        column: 3,
                    },
                    end: {
                        offset: 4,
                        line: 1,
                        column: 5,
                    },
                },
                value: 'if',
            },
            params: {
                type: 'Parenthesis',
                loc: {
                    start: {
                        offset: 6,
                        line: 1,
                        column: 7,
                    },
                    end: {
                        offset: 36,
                        line: 1,
                        column: 37,
                    },
                },
                expression: {
                    type: 'Operator',
                    loc: {
                        start: {
                            offset: 6,
                            line: 1,
                            column: 7,
                        },
                        end: {
                            offset: 36,
                            line: 1,
                            column: 37,
                        },
                    },
                    operator: '&&',
                    left: {
                        type: 'Variable',
                        loc: {
                            start: {
                                offset: 6,
                                line: 1,
                                column: 7,
                            },
                            end: {
                                offset: 13,
                                line: 1,
                                column: 14,
                            },
                        },
                        name: 'adguard',
                    },
                    right: {
                        type: 'Operator',
                        loc: {
                            start: {
                                offset: 17,
                                line: 1,
                                column: 18,
                            },
                            end: {
                                offset: 36,
                                line: 1,
                                column: 37,
                            },
                        },
                        operator: '!',
                        left: {
                            type: 'Variable',
                            loc: {
                                start: {
                                    offset: 18,
                                    line: 1,
                                    column: 19,
                                },
                                end: {
                                    offset: 36,
                                    line: 1,
                                    column: 37,
                                },
                            },
                            name: 'adguard_ext_safari',
                        },
                    },
                },
            },
        });

        expect(CommentRuleParser.parse('!#include https://example.org/path/includedfile.txt')).toEqual({
            type: 'PreProcessorCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 51,
                    line: 1,
                    column: 52,
                },
            },
            category: 'Comment',
            syntax: 'Common',
            name: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 2,
                        line: 1,
                        column: 3,
                    },
                    end: {
                        offset: 9,
                        line: 1,
                        column: 10,
                    },
                },
                value: 'include',
            },
            params: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 10,
                        line: 1,
                        column: 11,
                    },
                    end: {
                        offset: 51,
                        line: 1,
                        column: 52,
                    },
                },
                value: 'https://example.org/path/includedfile.txt',
            },
        });

        // Metadata
        expect(CommentRuleParser.parse('! Title: Filter')).toEqual({
            type: 'MetadataCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 15,
                    line: 1,
                    column: 16,
                },
            },
            category: 'Comment',
            syntax: 'Common',
            marker: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                },
                value: '!',
            },
            header: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 2,
                        line: 1,
                        column: 3,
                    },
                    end: {
                        offset: 7,
                        line: 1,
                        column: 8,
                    },
                },
                value: 'Title',
            },
            value: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 9,
                        line: 1,
                        column: 10,
                    },
                    end: {
                        offset: 15,
                        line: 1,
                        column: 16,
                    },
                },
                value: 'Filter',
            },
        });

        expect(
            CommentRuleParser.parse('! Homepage: https://github.com/AdguardTeam/some-repo/wiki'),
        ).toEqual({
            type: 'MetadataCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 57,
                    line: 1,
                    column: 58,
                },
            },
            category: 'Comment',
            syntax: 'Common',
            marker: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                },
                value: '!',
            },
            header: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 2,
                        line: 1,
                        column: 3,
                    },
                    end: {
                        offset: 10,
                        line: 1,
                        column: 11,
                    },
                },
                value: 'Homepage',
            },
            value: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 12,
                        line: 1,
                        column: 13,
                    },
                    end: {
                        offset: 57,
                        line: 1,
                        column: 58,
                    },
                },
                value: 'https://github.com/AdguardTeam/some-repo/wiki',
            },
        });

        expect(
            CommentRuleParser.parse('# Homepage: https://github.com/AdguardTeam/some-repo/wiki'),
        ).toEqual({
            type: 'MetadataCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 57,
                    line: 1,
                    column: 58,
                },
            },
            category: 'Comment',
            syntax: 'Common',
            marker: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                },
                value: '#',
            },
            header: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 2,
                        line: 1,
                        column: 3,
                    },
                    end: {
                        offset: 10,
                        line: 1,
                        column: 11,
                    },
                },
                value: 'Homepage',
            },
            value: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 12,
                        line: 1,
                        column: 13,
                    },
                    end: {
                        offset: 57,
                        line: 1,
                        column: 58,
                    },
                },
                value: 'https://github.com/AdguardTeam/some-repo/wiki',
            },
        });

        // Config comments
        expect(CommentRuleParser.parse('! aglint-disable rule1, rule2')).toEqual({
            type: 'ConfigCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 29,
                    line: 1,
                    column: 30,
                },
            },
            category: 'Comment',
            syntax: 'Common',
            marker: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                },
                value: '!',
            },
            command: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 2,
                        line: 1,
                        column: 3,
                    },
                    end: {
                        offset: 16,
                        line: 1,
                        column: 17,
                    },
                },
                value: 'aglint-disable',
            },
            params: {
                type: 'ParameterList',
                loc: {
                    start: {
                        offset: 17,
                        line: 1,
                        column: 18,
                    },
                    end: {
                        offset: 29,
                        line: 1,
                        column: 30,
                    },
                },
                children: [
                    {
                        type: 'Parameter',
                        loc: {
                            start: {
                                offset: 17,
                                line: 1,
                                column: 18,
                            },
                            end: {
                                offset: 22,
                                line: 1,
                                column: 23,
                            },
                        },
                        value: 'rule1',
                    },
                    {
                        type: 'Parameter',
                        loc: {
                            start: {
                                offset: 24,
                                line: 1,
                                column: 25,
                            },
                            end: {
                                offset: 29,
                                line: 1,
                                column: 30,
                            },
                        },
                        value: 'rule2',
                    },
                ],
            },
        });

        expect(CommentRuleParser.parse('! aglint-enable rule1, rule2')).toEqual({
            type: 'ConfigCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 28,
                    line: 1,
                    column: 29,
                },
            },
            category: 'Comment',
            syntax: 'Common',
            marker: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                },
                value: '!',
            },
            command: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 2,
                        line: 1,
                        column: 3,
                    },
                    end: {
                        offset: 15,
                        line: 1,
                        column: 16,
                    },
                },
                value: 'aglint-enable',
            },
            params: {
                type: 'ParameterList',
                loc: {
                    start: {
                        offset: 16,
                        line: 1,
                        column: 17,
                    },
                    end: {
                        offset: 28,
                        line: 1,
                        column: 29,
                    },
                },
                children: [
                    {
                        type: 'Parameter',
                        loc: {
                            start: {
                                offset: 16,
                                line: 1,
                                column: 17,
                            },
                            end: {
                                offset: 21,
                                line: 1,
                                column: 22,
                            },
                        },
                        value: 'rule1',
                    },
                    {
                        type: 'Parameter',
                        loc: {
                            start: {
                                offset: 23,
                                line: 1,
                                column: 24,
                            },
                            end: {
                                offset: 28,
                                line: 1,
                                column: 29,
                            },
                        },
                        value: 'rule2',
                    },
                ],
            },
        });

        expect(CommentRuleParser.parse('# aglint-disable rule1, rule2')).toEqual({
            type: 'ConfigCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 29,
                    line: 1,
                    column: 30,
                },
            },
            category: 'Comment',
            syntax: 'Common',
            marker: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                },
                value: '#',
            },
            command: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 2,
                        line: 1,
                        column: 3,
                    },
                    end: {
                        offset: 16,
                        line: 1,
                        column: 17,
                    },
                },
                value: 'aglint-disable',
            },
            params: {
                type: 'ParameterList',
                loc: {
                    start: {
                        offset: 17,
                        line: 1,
                        column: 18,
                    },
                    end: {
                        offset: 29,
                        line: 1,
                        column: 30,
                    },
                },
                children: [
                    {
                        type: 'Parameter',
                        loc: {
                            start: {
                                offset: 17,
                                line: 1,
                                column: 18,
                            },
                            end: {
                                offset: 22,
                                line: 1,
                                column: 23,
                            },
                        },
                        value: 'rule1',
                    },
                    {
                        type: 'Parameter',
                        loc: {
                            start: {
                                offset: 24,
                                line: 1,
                                column: 25,
                            },
                            end: {
                                offset: 29,
                                line: 1,
                                column: 30,
                            },
                        },
                        value: 'rule2',
                    },
                ],
            },
        });

        expect(CommentRuleParser.parse('# aglint-enable rule1, rule2')).toEqual({
            type: 'ConfigCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 28,
                    line: 1,
                    column: 29,
                },
            },
            category: 'Comment',
            syntax: 'Common',
            marker: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                },
                value: '#',
            },
            command: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 2,
                        line: 1,
                        column: 3,
                    },
                    end: {
                        offset: 15,
                        line: 1,
                        column: 16,
                    },
                },
                value: 'aglint-enable',
            },
            params: {
                type: 'ParameterList',
                loc: {
                    start: {
                        offset: 16,
                        line: 1,
                        column: 17,
                    },
                    end: {
                        offset: 28,
                        line: 1,
                        column: 29,
                    },
                },
                children: [
                    {
                        type: 'Parameter',
                        loc: {
                            start: {
                                offset: 16,
                                line: 1,
                                column: 17,
                            },
                            end: {
                                offset: 21,
                                line: 1,
                                column: 22,
                            },
                        },
                        value: 'rule1',
                    },
                    {
                        type: 'Parameter',
                        loc: {
                            start: {
                                offset: 23,
                                line: 1,
                                column: 24,
                            },
                            end: {
                                offset: 28,
                                line: 1,
                                column: 29,
                            },
                        },
                        value: 'rule2',
                    },
                ],
            },
        });

        expect(CommentRuleParser.parse('! aglint rule1: "off", rule2: ["a", "b"] -- this is a comment')).toEqual({
            type: 'ConfigCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 61,
                    line: 1,
                    column: 62,
                },
            },
            category: 'Comment',
            syntax: 'Common',
            marker: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                },
                value: '!',
            },
            command: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 2,
                        line: 1,
                        column: 3,
                    },
                    end: {
                        offset: 8,
                        line: 1,
                        column: 9,
                    },
                },
                value: 'aglint',
            },
            params: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 9,
                        line: 1,
                        column: 10,
                    },
                    end: {
                        offset: 40,
                        line: 1,
                        column: 41,
                    },
                },
                value: {
                    rule1: 'off',
                    rule2: [
                        'a',
                        'b',
                    ],
                },
            },
            comment: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 41,
                        line: 1,
                        column: 42,
                    },
                    end: {
                        offset: 61,
                        line: 1,
                        column: 62,
                    },
                },
                value: '-- this is a comment',
            },
        });

        expect(CommentRuleParser.parse('# aglint rule1: "off", rule2: ["a", "b"] -- this is a comment')).toEqual({
            type: 'ConfigCommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 61,
                    line: 1,
                    column: 62,
                },
            },
            category: 'Comment',
            syntax: 'Common',
            marker: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                },
                value: '#',
            },
            command: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 2,
                        line: 1,
                        column: 3,
                    },
                    end: {
                        offset: 8,
                        line: 1,
                        column: 9,
                    },
                },
                value: 'aglint',
            },
            params: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 9,
                        line: 1,
                        column: 10,
                    },
                    end: {
                        offset: 40,
                        line: 1,
                        column: 41,
                    },
                },
                value: {
                    rule1: 'off',
                    rule2: [
                        'a',
                        'b',
                    ],
                },
            },
            comment: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 41,
                        line: 1,
                        column: 42,
                    },
                    end: {
                        offset: 61,
                        line: 1,
                        column: 62,
                    },
                },
                value: '-- this is a comment',
            },
        });

        // Comments
        expect(CommentRuleParser.parse('! This is just a comment')).toEqual({
            category: 'Comment',
            type: 'CommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 24,
                    line: 1,
                    column: 25,
                },
            },
            syntax: 'Common',
            marker: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                },
                value: '!',
            },
            text: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                    end: {
                        offset: 24,
                        line: 1,
                        column: 25,
                    },
                },
                value: ' This is just a comment',
            },
        });

        expect(CommentRuleParser.parse('# This is just a comment')).toEqual({
            category: 'Comment',
            type: 'CommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 24,
                    line: 1,
                    column: 25,
                },
            },
            syntax: 'Common',
            marker: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                },
                value: '#',
            },
            text: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                    end: {
                        offset: 24,
                        line: 1,
                        column: 25,
                    },
                },
                value: ' This is just a comment',
            },
        });

        expect(CommentRuleParser.parse('!#########################')).toEqual({
            category: 'Comment',
            type: 'CommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 26,
                    line: 1,
                    column: 27,
                },
            },
            syntax: 'Common',
            marker: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                },
                value: '!',
            },
            text: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                    end: {
                        offset: 26,
                        line: 1,
                        column: 27,
                    },
                },
                value: '#########################',
            },
        });

        expect(CommentRuleParser.parse('##########################')).toEqual({
            category: 'Comment',
            type: 'CommentRule',
            loc: {
                start: {
                    offset: 0,
                    line: 1,
                    column: 1,
                },
                end: {
                    offset: 26,
                    line: 1,
                    column: 27,
                },
            },
            syntax: 'Common',
            marker: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                },
                value: '#',
            },
            text: {
                type: 'Value',
                loc: {
                    start: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                    end: {
                        offset: 26,
                        line: 1,
                        column: 27,
                    },
                },
                value: '#########################',
            },
        });
    });

    test('generate', () => {
        const parseAndGenerate = (raw: string) => {
            const ast = CommentRuleParser.parse(raw);

            if (ast) {
                return CommentRuleParser.generate(ast);
            }

            return null;
        };

        expect(parseAndGenerate('[Adblock Plus 2.0]')).toEqual('[Adblock Plus 2.0]');

        expect(parseAndGenerate('[Adblock Plus 2.0; AdGuard]')).toEqual('[Adblock Plus 2.0; AdGuard]');

        expect(parseAndGenerate('!+ NOT_OPTIMIZED')).toEqual('!+ NOT_OPTIMIZED');

        expect(parseAndGenerate('!+ NOT_OPTIMIZED PLATFORM(windows) NOT_PLATFORM(mac)')).toEqual(
            '!+ NOT_OPTIMIZED PLATFORM(windows) NOT_PLATFORM(mac)',
        );

        expect(parseAndGenerate('!#if (adguard && !adguard_ext_safari)')).toEqual(
            '!#if (adguard && !adguard_ext_safari)',
        );

        expect(parseAndGenerate('! Homepage: https://github.com/AdguardTeam/some-repo/wiki')).toEqual(
            '! Homepage: https://github.com/AdguardTeam/some-repo/wiki',
        );

        expect(parseAndGenerate('! aglint-enable rule1, rule2 -- comment')).toEqual(
            '! aglint-enable rule1, rule2 -- comment',
        );

        expect(parseAndGenerate('# aglint-enable rule1, rule2 -- comment')).toEqual(
            '# aglint-enable rule1, rule2 -- comment',
        );

        expect(parseAndGenerate('! This is just a comment')).toEqual('! This is just a comment');
    });
});
