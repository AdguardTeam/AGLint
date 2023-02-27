import { ModifierList, ModifierListParser, MODIFIER_LIST_TYPE } from '../../../src/parser/misc/modifier-list';
import { EMPTY, SPACE } from '../../../src/utils/constants';

describe('ModifierListParser', () => {
    test('parse', () => {
        // Empty modifiers
        expect(ModifierListParser.parse(EMPTY)).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [],
        });
        expect(ModifierListParser.parse(SPACE)).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [],
        });

        // Valid modifiers
        expect(ModifierListParser.parse('modifier1')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: 'modifier1', exception: false }],
        });

        expect(ModifierListParser.parse('~modifier1')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: 'modifier1', exception: true }],
        });

        expect(ModifierListParser.parse('modifier1,modifier2')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                { modifier: 'modifier1', exception: false },
                { modifier: 'modifier2', exception: false },
            ],
        });

        expect(ModifierListParser.parse('modifier1,~modifier2')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                { modifier: 'modifier1', exception: false },
                { modifier: 'modifier2', exception: true },
            ],
        });

        expect(ModifierListParser.parse('~modifier1,modifier2')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                { modifier: 'modifier1', exception: true },
                { modifier: 'modifier2', exception: false },
            ],
        });

        expect(ModifierListParser.parse('~modifier1,~modifier2')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                { modifier: 'modifier1', exception: true },
                { modifier: 'modifier2', exception: true },
            ],
        });

        expect(ModifierListParser.parse('modifier1, modifier2')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                { modifier: 'modifier1', exception: false },
                { modifier: 'modifier2', exception: false },
            ],
        });

        expect(ModifierListParser.parse('modifier1, ~modifier2')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                { modifier: 'modifier1', exception: false },
                { modifier: 'modifier2', exception: true },
            ],
        });

        expect(ModifierListParser.parse('modifier1=value1')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: 'modifier1', exception: false, value: 'value1' }],
        });

        expect(ModifierListParser.parse('~modifier1=value1')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: 'modifier1', exception: true, value: 'value1' }],
        });

        expect(ModifierListParser.parse('modifier1 = value1')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: 'modifier1', exception: false, value: 'value1' }],
        });

        expect(ModifierListParser.parse('~modifier1 = value1')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: 'modifier1', exception: true, value: 'value1' }],
        });

        expect(ModifierListParser.parse('   modifier1   =    value1       ')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [{ modifier: 'modifier1', exception: false, value: 'value1' }],
        });

        expect(ModifierListParser.parse('modifier1,modifier2=value2')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                { modifier: 'modifier1', exception: false },
                { modifier: 'modifier2', exception: false, value: 'value2' },
            ],
        });

        expect(ModifierListParser.parse('modifier1=value1,modifier2=value2')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                { modifier: 'modifier1', exception: false, value: 'value1' },
                { modifier: 'modifier2', exception: false, value: 'value2' },
            ],
        });

        // Escaped separator comma
        expect(ModifierListParser.parse('modifier1=a\\,b\\,c,modifier2=value2')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                { modifier: 'modifier1', exception: false, value: 'a\\,b\\,c' },
                { modifier: 'modifier2', exception: false, value: 'value2' },
            ],
        });

        expect(ModifierListParser.parse('modifier1=a\\,b\\,c,~modifier2=value2')).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                { modifier: 'modifier1', exception: false, value: 'a\\,b\\,c' },
                { modifier: 'modifier2', exception: true, value: 'value2' },
            ],
        });

        expect(
            ModifierListParser.parse(
                'path=/\\/(sub1|sub2)\\/page\\.html/,replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/\\$1<\\/VAST>/i',
            ),
        ).toEqual(<ModifierList>{
            type: MODIFIER_LIST_TYPE,
            modifiers: [
                {
                    modifier: 'path',
                    exception: false,
                    value: '/\\/(sub1|sub2)\\/page\\.html/',
                },
                {
                    modifier: 'replace',
                    exception: false,
                    value: '/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/\\$1<\\/VAST>/i',
                },
            ],
        });
    });

    test('generate', () => {
        const parseAndGenerate = (raw: string) => {
            const ast = ModifierListParser.parse(raw);

            if (ast) {
                return ModifierListParser.generate(ast);
            }

            return null;
        };

        expect(parseAndGenerate('modifier1')).toEqual('modifier1');
        expect(parseAndGenerate('~modifier1')).toEqual('~modifier1');
        expect(parseAndGenerate('modifier1=value1')).toEqual('modifier1=value1');
        expect(parseAndGenerate('~modifier1=value1')).toEqual('~modifier1=value1');

        expect(parseAndGenerate('modifier1=value1,modifier2')).toEqual('modifier1=value1,modifier2');
        expect(parseAndGenerate('~modifier1=value1,modifier2')).toEqual('~modifier1=value1,modifier2');
        expect(parseAndGenerate('modifier1=value1,~modifier2')).toEqual('modifier1=value1,~modifier2');
        expect(parseAndGenerate('~modifier1=value1,~modifier2')).toEqual('~modifier1=value1,~modifier2');

        expect(parseAndGenerate('modifier1,modifier2=value2')).toEqual('modifier1,modifier2=value2');

        expect(parseAndGenerate('modifier1,modifier2')).toEqual('modifier1,modifier2');

        expect(parseAndGenerate('modifier1=value1,modifier2=value2')).toEqual('modifier1=value1,modifier2=value2');
        expect(parseAndGenerate('~modifier1=value1,~modifier2=value2')).toEqual('~modifier1=value1,~modifier2=value2');

        expect(
            parseAndGenerate(
                'path=/\\/(sub1|sub2)\\/page\\.html/,replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/\\$1<\\/VAST>/i',
            ),
        ).toEqual('path=/\\/(sub1|sub2)\\/page\\.html/,replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/\\$1<\\/VAST>/i');

        expect(
            parseAndGenerate(
                '~path=/\\/(sub1|sub2)\\/page\\.html/,replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/\\$1<\\/VAST>/i',
            ),
        ).toEqual('~path=/\\/(sub1|sub2)\\/page\\.html/,replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/\\$1<\\/VAST>/i');
    });
});
