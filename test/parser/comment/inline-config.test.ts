import { CommentRuleType } from '../../../src/parser/comment/types';
import { CommentMarker } from '../../../src/parser/comment/marker';
import { ConfigComment, ConfigCommentParser } from '../../../src/parser/comment/inline-config';
import { RuleCategory } from '../../../src/parser/categories';
import { AdblockSyntax } from '../../../src/utils/adblockers';
import { EMPTY, SPACE } from '../../../src/utils/constants';

describe('PreProcessorParser', () => {
    test('isComment', () => {
        // Empty
        expect(ConfigCommentParser.isConfigComment(EMPTY)).toBe(false);
        expect(ConfigCommentParser.isConfigComment(SPACE)).toBe(false);

        // Begins with !
        expect(ConfigCommentParser.isConfigComment('!')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('!!')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('!comment')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('! comment')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('!+comment')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('!#comment')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('!#########################')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('! #########################')).toBe(false);
        expect(ConfigCommentParser.isConfigComment(' !')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('  !')).toBe(false);

        // Begins with #
        expect(ConfigCommentParser.isConfigComment('#')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('##')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('# #')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('#comment')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('# comment')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('#+comment')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('#########################')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('# ########################')).toBe(false);
        expect(ConfigCommentParser.isConfigComment(' #')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('  ##')).toBe(false);

        // Not "aglint" prefix
        expect(ConfigCommentParser.isConfigComment('!aaglint')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('!aaglint-enable')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('!aaglint-anything')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('! aaglint')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('! aaglint-enable')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('! aaglint-anything')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('!   aaglint  ')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('!   aaglint-enable  ')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('!   aaglint-anything  ')).toBe(false);

        expect(ConfigCommentParser.isConfigComment('#aaglint')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('#aaglint-enable')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('#aaglint-anything')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('# aaglint')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('# aaglint-enable')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('# aaglint-anything')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('#   aaglint  ')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('#   aaglint-enable  ')).toBe(false);
        expect(ConfigCommentParser.isConfigComment('#   aaglint-anything  ')).toBe(false);

        // Valid cases
        expect(ConfigCommentParser.isConfigComment('!aglint')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('!aglint-enable')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('!aglint-anything')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('! aglint')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('! aglint-enable')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('! aglint-anything')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('!   aglint  ')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('!   aglint-enable  ')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('!   aglint-anything  ')).toBe(true);

        expect(ConfigCommentParser.isConfigComment('#aglint')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('#aglint-enable')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('#aglint-anything')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('# aglint')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('# aglint-enable')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('# aglint-anything')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('#   aglint  ')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('#   aglint-enable  ')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('#   aglint-anything  ')).toBe(true);

        expect(ConfigCommentParser.isConfigComment('!AGLINT')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('#AGLINT')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('! AGLINT')).toBe(true);
        expect(ConfigCommentParser.isConfigComment('# AGLINT')).toBe(true);
    });

    test('parse', () => {
        // !
        expect(ConfigCommentParser.parse('! aglint-disable')).toEqual(<ConfigComment>{
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Common,
            marker: CommentMarker.Regular,
            command: 'aglint-disable',
        });

        expect(ConfigCommentParser.parse('!aglint-disable')).toEqual(<ConfigComment>{
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Common,
            marker: CommentMarker.Regular,
            command: 'aglint-disable',
        });

        // #
        expect(ConfigCommentParser.parse('# aglint-disable')).toEqual(<ConfigComment>{
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Common,
            marker: CommentMarker.Hashmark,
            command: 'aglint-disable',
        });

        expect(ConfigCommentParser.parse('#aglint-disable')).toEqual(<ConfigComment>{
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Common,
            marker: CommentMarker.Hashmark,
            command: 'aglint-disable',
        });

        // Different command
        expect(ConfigCommentParser.parse('! aglint-enable')).toEqual(<ConfigComment>{
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Common,
            marker: CommentMarker.Regular,
            command: 'aglint-enable',
        });

        expect(ConfigCommentParser.parse('! aglint-enable rule1')).toEqual(<ConfigComment>{
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Common,
            marker: CommentMarker.Regular,
            command: 'aglint-enable',
            params: ['rule1'],
        });

        expect(ConfigCommentParser.parse('! aglint-enable rule1,rule2')).toEqual(<ConfigComment>{
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Common,
            marker: CommentMarker.Regular,
            command: 'aglint-enable',
            params: ['rule1', 'rule2'],
        });

        expect(ConfigCommentParser.parse('! aglint-enable rule1, rule2')).toEqual(<ConfigComment>{
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Common,
            marker: CommentMarker.Regular,
            command: 'aglint-enable',
            params: ['rule1', 'rule2'],
        });

        // Ignore comment
        expect(ConfigCommentParser.parse('! aglint-enable rule1, rule2 -- comment')).toEqual(<ConfigComment>{
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Common,
            marker: CommentMarker.Regular,
            command: 'aglint-enable',
            params: ['rule1', 'rule2'],
            comment: 'comment',
        });

        expect(ConfigCommentParser.parse('! aglint rule1: "off"')).toEqual(<ConfigComment>{
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Common,
            marker: CommentMarker.Regular,
            command: 'aglint',
            params: {
                rule1: 'off',
            },
        });

        expect(ConfigCommentParser.parse('! aglint rule1: 1')).toEqual(<ConfigComment>{
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Common,
            marker: CommentMarker.Regular,
            command: 'aglint',
            params: {
                rule1: 1,
            },
        });

        expect(ConfigCommentParser.parse('! aglint rule1: ["error", "double"]')).toEqual(<ConfigComment>{
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Common,
            marker: CommentMarker.Regular,
            command: 'aglint',
            params: {
                rule1: ['error', 'double'],
            },
        });

        // Complicated case
        expect(
            ConfigCommentParser.parse(
                // eslint-disable-next-line max-len
                '! aglint rule1: "off", rule2: [1, 2], rule3: ["error", { "max": 100 }] -- this is a comment -- this doesn\'t matter',
            ),
        ).toEqual(<ConfigComment>{
            category: RuleCategory.Comment,
            type: CommentRuleType.ConfigComment,
            syntax: AdblockSyntax.Common,
            marker: CommentMarker.Regular,
            command: 'aglint',
            params: {
                rule1: 'off',
                rule2: [1, 2],
                rule3: ['error', { max: 100 }],
            },
            comment: "this is a comment -- this doesn't matter",
        });

        // Invalid cases
        expect(() => ConfigCommentParser.parse('! aglint')).toThrowError('Missing configuration object');
        expect(() => ConfigCommentParser.parse('! aglint rule1')).toThrowError();
        expect(() => ConfigCommentParser.parse('! aglint rule1: ["error", "double"')).toThrowError();
        expect(() => ConfigCommentParser.parse('! aglint rule1: () => 1')).toThrowError();

        expect(() => ConfigCommentParser.parse('# aglint')).toThrowError('Missing configuration object');
        expect(() => ConfigCommentParser.parse('# aglint rule1')).toThrowError();
        expect(() => ConfigCommentParser.parse('# aglint rule1: ["error", "double"')).toThrowError();
        expect(() => ConfigCommentParser.parse('# aglint rule1: () => 1')).toThrowError();
    });

    test('generate', () => {
        const parseAndGenerate = (raw: string) => {
            const ast = ConfigCommentParser.parse(raw);

            if (ast) {
                return ConfigCommentParser.generate(ast);
            }

            return null;
        };

        expect(parseAndGenerate('! aglint rule1: ["error", "double"]')).toEqual('! aglint "rule1":["error","double"]');
        expect(parseAndGenerate('! aglint rule1: ["error", "double"] -- comment')).toEqual(
            '! aglint "rule1":["error","double"] -- comment',
        );

        expect(parseAndGenerate('! aglint-disable rule1, rule2')).toEqual('! aglint-disable rule1, rule2');
        expect(parseAndGenerate('! aglint-disable rule1, rule2 -- comment')).toEqual(
            '! aglint-disable rule1, rule2 -- comment',
        );
    });
});
