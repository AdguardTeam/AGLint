import { AdgModifierListParser, ADG_MODIFIER_LIST_TYPE } from '../../../../src/parser/cosmetic/specific/adg-modifiers';
import { EMPTY } from '../../../../src/utils/constants';

describe('AdgModifierListParser', () => {
    test('parse', async () => {
        // Empty
        expect(AdgModifierListParser.parse(EMPTY)).toEqual({
            type: ADG_MODIFIER_LIST_TYPE,
            modifiers: [],
            rest: EMPTY,
        });

        // Valid cases (please note that modifier parser are tested in another test file)
        expect(AdgModifierListParser.parse('[$m1]example.com')).toEqual({
            type: ADG_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: 'm1',
                    exception: false,
                },
            ],
            rest: 'example.com',
        });

        expect(AdgModifierListParser.parse('[$m1,m2=v2]example.com')).toEqual({
            type: ADG_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: 'm1',
                    exception: false,
                },
                {
                    modifier: 'm2',
                    exception: false,
                    value: 'v2',
                },
            ],
            rest: 'example.com',
        });

        expect(AdgModifierListParser.parse('[$m1,m2=v2]')).toEqual({
            type: ADG_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: 'm1',
                    exception: false,
                },
                {
                    modifier: 'm2',
                    exception: false,
                    value: 'v2',
                },
            ],
            rest: EMPTY,
        });

        // Spaces
        expect(AdgModifierListParser.parse('[$   path  =   /test  ]')).toEqual({
            type: ADG_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: 'path',
                    exception: false,
                    value: '/test',
                },
            ],
            rest: EMPTY,
        });

        // Complicated case
        expect(
            AdgModifierListParser.parse(
                '[$path=/test,~domain=/(^|.+\\.)example\\.(com|org)\\$/,modifier1]example.com,example.org',
            ),
        ).toEqual({
            type: ADG_MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: 'path',
                    exception: false,
                    value: '/test',
                },
                {
                    modifier: 'domain',
                    exception: true,
                    value: '/(^|.+\\.)example\\.(com|org)\\$/',
                },
                {
                    modifier: 'modifier1',
                    exception: false,
                },
            ],
            rest: 'example.com,example.org',
        });

        // Invalid cases
        expect(() => AdgModifierListParser.parse('[')).toThrowError(/^Missing modifier marker "\$" at pattern/);

        expect(() => AdgModifierListParser.parse('[ ')).toThrowError(/^Missing modifier marker "\$" at pattern/);

        expect(() => AdgModifierListParser.parse('[m1]example.com')).toThrowError(
            /^Missing modifier marker "\$" at pattern/,
        );

        expect(() => AdgModifierListParser.parse('[$m1example.com')).toThrowError(
            /^Missing closing bracket "]" at pattern/,
        );

        expect(() => AdgModifierListParser.parse('[$]example.com')).toThrowError(/^No modifiers specified at pattern/);
        expect(() => AdgModifierListParser.parse('[$  ]example.com')).toThrowError(
            /^No modifiers specified at pattern/,
        );
    });

    test('generate', async () => {
        const parseAndGenerate = (raw: string) => {
            const ast = AdgModifierListParser.parse(raw);

            if (ast) {
                return AdgModifierListParser.generate(ast);
            }

            return null;
        };

        // eslint-disable-next-line max-len
        // Please note that this generation does not affect the classic domain list, only the modifier list is generated.
        expect(
            parseAndGenerate('[$path=/test,domain=/(^|.+\\.)example\\.(com|org)\\$/,modifier1]example.com,example.org'),
        ).toEqual('[$path=/test,domain=/(^|.+\\.)example\\.(com|org)\\$/,modifier1]');
    });
});