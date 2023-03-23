import ss, { Struct } from 'superstruct';
import { Linter, LinterRuleData } from '../../src/linter';
import { defaultLinterRules } from '../../src/linter/rules';
import { SEVERITY, SeverityValue, SeverityName } from '../../src/linter/severity';
import { RuleParser } from '../../src/parser';
import { EMPTY, NEWLINE } from '../../src/utils/constants';
import { GenericRuleContext, LinterConfig, LinterRule } from '../../src/linter/common';
import { AnyRule } from '../../src/parser/nodes';

const demoRule: LinterRule = {
    meta: {
        severity: SEVERITY.warn,
        config: {
            default: {
                a: 1,
                b: 2,
            },
            schema: ss.object({
                a: ss.number(),
                b: ss.number(),
            }) as Struct,
        },
    },
    events: {},
};

const demoRuleNoConfig: LinterRule = {
    meta: {
        severity: SEVERITY.warn,
    },
    events: {},
};

const demoRuleEverythingIsProblem1: LinterRule = {
    meta: {
        severity: SEVERITY.warn,
    },
    events: {
        onRule: (context: GenericRuleContext) => {
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            context.report({
                message: 'Problem1',
                position: {
                    startLine: line,
                    startColumn: 0,
                    endLine: line,
                    endColumn: raw.length,
                },
            });
        },
    },
};

const demoRuleEverythingIsProblem2: LinterRule = {
    meta: {
        severity: SEVERITY.warn,
    },
    events: {
        onRule: (context: GenericRuleContext) => {
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();

            context.report({
                message: 'Problem2',
                position: {
                    startLine: line,
                    startColumn: 0,
                    endLine: line,
                    endColumn: raw.length,
                },
            });
        },
    },
};

const demoRuleEverythingIsProblem3: LinterRule = {
    meta: {
        severity: SEVERITY.warn,
        config: {
            default: {
                message: 'Problem3',
            },
            schema: ss.object({
                message: ss.string(),
            }) as Struct,
        },
    },
    events: {
        onRule: (context: GenericRuleContext) => {
            const raw = <string>context.getActualAdblockRuleRaw();
            const line = context.getActualLine();
            const { message } = context.config as { message: string };

            context.report({
                message,
                position: {
                    startLine: line,
                    startColumn: 0,
                    endLine: line,
                    endColumn: raw.length,
                },
            });
        },
    },
};

describe('Linter', () => {
    test('addDefaultRules', () => {
        const linter = new Linter(false);

        expect(linter.getRules().size).toEqual(0);

        linter.addDefaultRules();

        expect(linter.getRules().size).toEqual(defaultLinterRules.size);

        for (const [ruleName, rule] of defaultLinterRules) {
            expect(linter.hasRule(ruleName)).toBeTruthy();
            expect(linter.getRule(ruleName)).toEqual(rule);
        }
    });

    test('setRuleConfig', () => {
        const linter = new Linter(false);

        expect(linter.getRules().size).toEqual(0);

        linter.addRule('rule-1', demoRule);
        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        linter.addRule('rule-2', demoRuleNoConfig);
        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeTruthy();

        // Invalid rule name
        expect(() => linter.setRuleConfig('rule-100', 'off')).toThrowError('Rule "rule-100" doesn\'t exist');

        // Invalid severity
        expect(() => linter.setRuleConfig('rule-1', <SeverityValue>-1)).toThrowError(/^Invalid severity/);
        expect(() => linter.setRuleConfig('rule-1', <SeverityName>'off2')).toThrowError(/^Invalid severity/);

        // Invalid config
        expect(() => linter.setRuleConfig('rule-1', ['off', 'a'])).toThrowError(/^Invalid config/);
        expect(() => linter.setRuleConfig('rule-1', ['off', { a: 1, b: '2' }])).toThrowError(/^Invalid config/);
        expect(() => linter.setRuleConfig('rule-1', ['off', [{ a: 1, b: 2 }]])).toThrowError(/^Invalid config/);

        // Invalid severity and config
        expect(() => linter.setRuleConfig('rule-1', [<SeverityValue>-1, 'a'])).toThrowError(/^Invalid severity/);
        expect(() => linter.setRuleConfig('rule-1', [<SeverityName>'off2', 'a'])).toThrowError(/^Invalid severity/);

        // Config not supported by rule
        // eslint-disable-next-line max-len
        expect(() => linter.setRuleConfig('rule-2', ['off', 'a'])).toThrowError('Rule "rule-2" doesn\'t support config');

        // Just severity
        linter.setRuleConfig('rule-1', 'off');
        expect(linter.getRuleConfig('rule-1')).toEqual([0, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', 0);
        expect(linter.getRuleConfig('rule-1')).toEqual([0, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', 'warn');
        expect(linter.getRuleConfig('rule-1')).toEqual([1, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', 1);
        expect(linter.getRuleConfig('rule-1')).toEqual([1, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', 'error');
        expect(linter.getRuleConfig('rule-1')).toEqual([2, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', 2);
        expect(linter.getRuleConfig('rule-1')).toEqual([2, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', 'fatal');
        expect(linter.getRuleConfig('rule-1')).toEqual([3, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', 3);
        expect(linter.getRuleConfig('rule-1')).toEqual([3, { a: 1, b: 2 }]);

        // Just severity (as array)
        linter.setRuleConfig('rule-1', ['off']);
        expect(linter.getRuleConfig('rule-1')).toEqual([0, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', [0]);
        expect(linter.getRuleConfig('rule-1')).toEqual([0, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', ['warn']);
        expect(linter.getRuleConfig('rule-1')).toEqual([1, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', [1]);
        expect(linter.getRuleConfig('rule-1')).toEqual([1, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', ['error']);
        expect(linter.getRuleConfig('rule-1')).toEqual([2, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', [2]);
        expect(linter.getRuleConfig('rule-1')).toEqual([2, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', ['fatal']);
        expect(linter.getRuleConfig('rule-1')).toEqual([3, { a: 1, b: 2 }]);

        linter.setRuleConfig('rule-1', [3]);
        expect(linter.getRuleConfig('rule-1')).toEqual([3, { a: 1, b: 2 }]);

        // Severity and config
        linter.setRuleConfig('rule-1', ['off', { a: 100, b: 100 }]);
        expect(linter.getRuleConfig('rule-1')).toEqual([0, { a: 100, b: 100 }]);

        linter.setRuleConfig('rule-1', [0, { a: 100, b: 100 }]);
        expect(linter.getRuleConfig('rule-1')).toEqual([0, { a: 100, b: 100 }]);

        linter.setRuleConfig('rule-1', ['warn', { a: 200, b: 200 }]);
        expect(linter.getRuleConfig('rule-1')).toEqual([1, { a: 200, b: 200 }]);

        linter.setRuleConfig('rule-1', [1, { a: 200, b: 200 }]);
        expect(linter.getRuleConfig('rule-1')).toEqual([1, { a: 200, b: 200 }]);

        linter.setRuleConfig('rule-1', ['error', { a: 300, b: 300 }]);
        expect(linter.getRuleConfig('rule-1')).toEqual([2, { a: 300, b: 300 }]);

        linter.setRuleConfig('rule-1', [2, { a: 300, b: 300 }]);
        expect(linter.getRuleConfig('rule-1')).toEqual([2, { a: 300, b: 300 }]);

        linter.setRuleConfig('rule-1', ['fatal', { a: 400, b: 400 }]);
        expect(linter.getRuleConfig('rule-1')).toEqual([3, { a: 400, b: 400 }]);

        linter.setRuleConfig('rule-1', [3, { a: 400, b: 400 }]);
        expect(linter.getRuleConfig('rule-1')).toEqual([3, { a: 400, b: 400 }]);
    });

    test('applyRulesConfig', () => {
        const linter = new Linter(false);

        // Initially no rules
        expect(linter.getRules().size).toEqual(0);

        // Add demo rules
        linter.addRule('rule-1', demoRule);
        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        linter.addRule('rule-2', demoRule);
        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeTruthy();

        linter.addRule('rule-3', demoRule);
        expect(linter.getRules().size).toEqual(3);
        expect(linter.hasRule('rule-3')).toBeTruthy();

        linter.addRule('rule-4', demoRuleNoConfig);
        expect(linter.getRules().size).toEqual(4);
        expect(linter.hasRule('rule-4')).toBeTruthy();

        // Non-existent rule
        expect(() => linter.applyRulesConfig({
            'rule-100': 'off',
        })).toThrowError('Rule "rule-100" doesn\'t exist');

        // Invalid severity
        expect(() => linter.applyRulesConfig({
            'rule-1': <SeverityName>'off2',
        })).toThrowError(/^Invalid severity/);

        expect(() => linter.applyRulesConfig({
            'rule-1': <SeverityValue>-1,
        })).toThrowError(/^Invalid severity/);

        // Invalid config
        expect(() => linter.applyRulesConfig({
            'rule-1': ['off', { a: 1, b: 2, c: 3 }],
        })).toThrowError(/^Invalid config/);

        // Invalid severity and config
        expect(() => linter.applyRulesConfig({
            'rule-1': [<SeverityName>'off2', { a: 1, b: 2, c: 3 }],
        })).toThrowError(/^Invalid severity/);

        // Config not supported by rule
        expect(() => linter.applyRulesConfig({
            'rule-4': ['off', { a: 1, b: 2 }],
        })).toThrowError('Rule "rule-4" doesn\'t support config');

        // Valid severity
        linter.applyRulesConfig({
            'rule-1': 'off',
            'rule-2': 'warn',
            'rule-3': 'error',
        });

        expect(linter.getRuleConfig('rule-1')).toEqual([0, { a: 1, b: 2 }]);
        expect(linter.getRuleConfig('rule-2')).toEqual([1, { a: 1, b: 2 }]);
        expect(linter.getRuleConfig('rule-3')).toEqual([2, { a: 1, b: 2 }]);

        linter.applyRulesConfig({
            'rule-1': 2,
            'rule-2': 1,
            'rule-3': 0,
        });

        expect(linter.getRuleConfig('rule-1')).toEqual([2, { a: 1, b: 2 }]);
        expect(linter.getRuleConfig('rule-2')).toEqual([1, { a: 1, b: 2 }]);
        expect(linter.getRuleConfig('rule-3')).toEqual([0, { a: 1, b: 2 }]);

        linter.applyRulesConfig({
            'rule-1': ['off'],
            'rule-2': ['warn'],
            'rule-3': ['error'],
        });

        expect(linter.getRuleConfig('rule-1')).toEqual([0, { a: 1, b: 2 }]);
        expect(linter.getRuleConfig('rule-2')).toEqual([1, { a: 1, b: 2 }]);
        expect(linter.getRuleConfig('rule-3')).toEqual([2, { a: 1, b: 2 }]);

        linter.applyRulesConfig({
            'rule-1': [2],
            'rule-2': [1],
            'rule-3': [0],
        });

        expect(linter.getRuleConfig('rule-1')).toEqual([2, { a: 1, b: 2 }]);
        expect(linter.getRuleConfig('rule-2')).toEqual([1, { a: 1, b: 2 }]);
        expect(linter.getRuleConfig('rule-3')).toEqual([0, { a: 1, b: 2 }]);

        // Valid severity and config
        linter.applyRulesConfig({
            'rule-1': ['off', { a: 100, b: 100 }],
            'rule-2': ['warn', { a: 200, b: 200 }],
            'rule-3': ['error', { a: 300, b: 300 }],
        });

        expect(linter.getRuleConfig('rule-1')).toEqual([0, { a: 100, b: 100 }]);
        expect(linter.getRuleConfig('rule-2')).toEqual([1, { a: 200, b: 200 }]);
        expect(linter.getRuleConfig('rule-3')).toEqual([2, { a: 300, b: 300 }]);
    });

    test('setConfig', () => {
        const linter = new Linter(false);

        // Initially no rules
        expect(linter.getRules().size).toEqual(0);

        // Add demo rules
        linter.addRule('rule-1', demoRule);

        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        linter.addRule('rule-2', demoRule);

        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeTruthy();

        linter.addRule('rule-3', demoRule);

        expect(linter.getRules().size).toEqual(3);
        expect(linter.hasRule('rule-3')).toBeTruthy();

        // Set config
        linter.setConfig({
            rules: {
                'rule-1': 'off',
                'rule-2': 'warn',
                'rule-3': 'error',
            },
        });

        expect(linter.getRuleConfig('rule-1')).toEqual([0, { a: 1, b: 2 }]);
        expect(linter.getRuleConfig('rule-2')).toEqual([1, { a: 1, b: 2 }]);
        expect(linter.getRuleConfig('rule-3')).toEqual([2, { a: 1, b: 2 }]);
    });

    test('addRule', () => {
        const linter = new Linter(false);

        // Initially no rules
        expect(linter.getRules().size).toEqual(0);

        // Add demo rules
        linter.addRule('rule-1', demoRule);

        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        linter.addRule('rule-2', demoRule);

        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeTruthy();

        linter.addRule('rule-3', demoRule);

        expect(linter.getRules().size).toEqual(3);
        expect(linter.hasRule('rule-3')).toBeTruthy();

        // Duplicate rule
        expect(() => linter.addRule('rule-1', demoRule)).toThrowError('Rule with name "rule-1" already exists');
    });

    test('addRuleEx', () => {
        const linter = new Linter(false);

        // Initially no rules
        expect(linter.getRules().size).toEqual(0);

        // Invalid severity override
        expect(() => linter.addRuleEx('rule-1', <LinterRuleData>{
            rule: demoRule,
            severityOverride: <SeverityName>'aaa',
            storage: {},
        })).toThrowError(/^Invalid severity/);

        // Invalid config override
        expect(() => linter.addRuleEx('rule-1', <LinterRuleData>{
            rule: demoRule,
            configOverride: { a: 1, b: 2, c: 3 },
            storage: {},
        })).toThrowError(/^Invalid config/);

        // Rule doesn't support config
        expect(() => linter.addRuleEx('rule-1', <LinterRuleData>{
            rule: demoRuleNoConfig,
            configOverride: { a: 1, b: 2 },
            storage: {},
        })).toThrowError('Rule "rule-1" doesn\'t support config');

        // Add rule without overrides
        linter.addRuleEx('rule-1', <LinterRuleData>{
            rule: demoRule,
            storage: {},
        });

        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        // Add rule with overrides
        linter.addRuleEx('rule-2', <LinterRuleData>{
            rule: demoRule,
            severityOverride: 'error',
            configOverride: { a: 100, b: 100 },
            storage: {},
        });

        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeTruthy();
        expect(linter.getRuleConfig('rule-2')).toEqual([2, { a: 100, b: 100 }]);
    });

    test('resetRuleConfig', () => {
        const linter = new Linter(false);

        expect(linter.getRules().size).toEqual(0);

        linter.addRule('rule-1', demoRule);
        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        linter.addRule('rule-2', demoRuleNoConfig);
        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeTruthy();

        // Change config
        linter.setRuleConfig('rule-1', ['off', { a: 100, b: 100 }]);
        expect(linter.getRuleConfig('rule-1')).toEqual([0, { a: 100, b: 100 }]);

        // Reset config
        linter.resetRuleConfig('rule-1');
        expect(linter.getRuleConfig('rule-1')).toEqual([1, { a: 1, b: 2 }]);

        // Rule doesn't exist
        expect(() => linter.resetRuleConfig('rule-100')).toThrowError('Rule with name "rule-100" doesn\'t exist');

        // Rule doesn't support config
        expect(() => linter.resetRuleConfig('rule-2')).toThrowError('Rule "rule-2" doesn\'t support config');
    });

    test('getRuleConfig', () => {
        const linter = new Linter(false);

        expect(linter.getRules().size).toEqual(0);

        linter.addRule('rule-1', demoRule);
        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        linter.addRule('rule-2', demoRuleNoConfig);
        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeTruthy();

        // Change config and get it
        linter.setRuleConfig('rule-1', ['off', { a: 100, b: 100 }]);
        expect(linter.getRuleConfig('rule-1')).toEqual([0, { a: 100, b: 100 }]);

        linter.setRuleConfig('rule-1', ['warn', { a: 200, b: 200 }]);
        expect(linter.getRuleConfig('rule-1')).toEqual([1, { a: 200, b: 200 }]);

        // Rule doesn't exist
        expect(() => linter.getRuleConfig('rule-100')).toThrowError('Rule with name "rule-100" doesn\'t exist');

        // Rule doesn't support config
        expect(() => linter.getRuleConfig('rule-2')).toThrowError('Rule "rule-2" doesn\'t support config');
    });

    test('getRule', () => {
        const linter = new Linter(false);

        expect(linter.getRules().size).toEqual(0);

        linter.addRule('rule-1', demoRule);
        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        expect(linter.getRule('rule-1')).toEqual(demoRule);

        expect(linter.getRule('rule-100')).toBeUndefined();
    });

    test('getRules', () => {
        const linter = new Linter(false);

        expect(linter.getRules().size).toEqual(0);

        // Add demo rules
        linter.addRule('rule-1', demoRule);
        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        linter.addRule('rule-2', demoRule);
        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeTruthy();

        linter.addRule('rule-3', demoRule);
        expect(linter.getRules().size).toEqual(3);
        expect(linter.hasRule('rule-3')).toBeTruthy();

        linter.addRule('rule-4', demoRuleNoConfig);
        expect(linter.getRules().size).toEqual(4);
        expect(linter.hasRule('rule-4')).toBeTruthy();

        // Get all rules
        expect(linter.getRules().size).toEqual(4);
        expect(linter.getRules().get('rule-1')).toHaveProperty('rule', demoRule);
        expect(linter.getRules().get('rule-2')).toHaveProperty('rule', demoRule);
        expect(linter.getRules().get('rule-3')).toHaveProperty('rule', demoRule);
        expect(linter.getRules().get('rule-4')).toHaveProperty('rule', demoRuleNoConfig);
    });

    test('hasRule', () => {
        const linter = new Linter(false);

        expect(linter.getRules().size).toEqual(0);

        // Add demo rules
        linter.addRule('rule-1', demoRule);
        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        linter.addRule('rule-2', demoRule);
        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeTruthy();

        linter.addRule('rule-3', demoRule);
        expect(linter.getRules().size).toEqual(3);
        expect(linter.hasRule('rule-3')).toBeTruthy();

        linter.addRule('rule-4', demoRuleNoConfig);
        expect(linter.getRules().size).toEqual(4);
        expect(linter.hasRule('rule-4')).toBeTruthy();
    });

    test('removeRule', () => {
        const linter = new Linter(false);

        expect(linter.getRules().size).toEqual(0);

        // Add demo rules
        linter.addRule('rule-1', demoRule);
        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        linter.addRule('rule-2', demoRule);
        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeTruthy();

        linter.addRule('rule-3', demoRule);
        expect(linter.getRules().size).toEqual(3);
        expect(linter.hasRule('rule-3')).toBeTruthy();

        linter.addRule('rule-4', demoRuleNoConfig);
        expect(linter.getRules().size).toEqual(4);
        expect(linter.hasRule('rule-4')).toBeTruthy();

        // Remove rules
        linter.removeRule('rule-1');
        expect(linter.getRules().size).toEqual(3);
        expect(linter.hasRule('rule-1')).toBeFalsy();

        linter.removeRule('rule-2');
        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeFalsy();

        linter.removeRule('rule-3');
        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-3')).toBeFalsy();

        linter.removeRule('rule-4');
        expect(linter.getRules().size).toEqual(0);
        expect(linter.hasRule('rule-4')).toBeFalsy();

        // Remove non-existent rule
        expect(() => linter.removeRule('rule-5')).toThrowError('Rule with name "rule-5" does not exist');
        expect(() => linter.removeRule('rule-4')).toThrowError('Rule with name "rule-4" does not exist');
        expect(() => linter.removeRule('rule-1')).toThrowError('Rule with name "rule-1" does not exist');
    });

    test('disableRule', () => {
        const linter = new Linter(false);

        expect(linter.getRules().size).toEqual(0);

        // Add demo rules
        linter.addRule('rule-1', demoRule);
        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        linter.addRule('rule-2', demoRule);
        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeTruthy();

        linter.disableRule('rule-1');
        expect(linter.getRules().get('rule-1')).toHaveProperty('severityOverride', 0);

        linter.disableRule('rule-2');
        expect(linter.getRules().get('rule-2')).toHaveProperty('severityOverride', 0);

        // Disable non-existent rule
        expect(() => linter.disableRule('rule-100')).toThrowError('Rule with name "rule-100" does not exist');
    });

    test('isRuleDisabled', () => {
        const linter = new Linter(false);

        expect(linter.getRules().size).toEqual(0);

        // Add demo rules
        linter.addRule('rule-1', demoRule);
        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        linter.addRule('rule-2', demoRule);
        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeTruthy();

        linter.disableRule('rule-1');
        expect(linter.getRules().get('rule-1')).toHaveProperty('severityOverride', 0);
        expect(linter.isRuleDisabled('rule-1')).toBeTruthy();

        linter.disableRule('rule-2');
        expect(linter.getRules().get('rule-2')).toHaveProperty('severityOverride', 0);
        expect(linter.isRuleDisabled('rule-2')).toBeTruthy();

        // Non-existent rule
        expect(linter.isRuleDisabled('rule-100')).toBeFalsy();
    });

    test('enableRule', () => {
        const linter = new Linter(false);

        expect(linter.getRules().size).toEqual(0);

        // Add demo rules
        linter.addRule('rule-1', demoRule);
        expect(linter.getRules().size).toEqual(1);
        expect(linter.hasRule('rule-1')).toBeTruthy();

        linter.addRule('rule-2', demoRule);
        expect(linter.getRules().size).toEqual(2);
        expect(linter.hasRule('rule-2')).toBeTruthy();

        linter.disableRule('rule-1');
        expect(linter.getRules().get('rule-1')).toHaveProperty('severityOverride', 0);
        expect(linter.isRuleDisabled('rule-1')).toBeTruthy();

        linter.disableRule('rule-2');
        expect(linter.getRules().get('rule-2')).toHaveProperty('severityOverride', 0);
        expect(linter.isRuleDisabled('rule-2')).toBeTruthy();

        linter.enableRule('rule-1');
        expect(linter.isRuleDisabled('rule-1')).toBeFalsy();

        linter.enableRule('rule-2');
        expect(linter.isRuleDisabled('rule-2')).toBeFalsy();

        // Enable non-existent rule
        expect(() => linter.enableRule('rule-100')).toThrowError('Rule with name "rule-100" does not exist');
    });

    test('lint detect parsing issues as fatal errors', () => {
        const linter = new Linter(false);

        // 1 invalid rule
        expect(
            linter.lint(
                [
                    '[uBlock Origin]',
                    'example.org##.ad',
                    '@@||example.org^$generichide',
                    'example.com##+js(aopr, test)',
                    'example.com##+js(aopr, test', // Missing closing bracket
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    severity: SEVERITY.fatal,
                    message:
                        // eslint-disable-next-line max-len
                        "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no closing parentheses ')' found",
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 27,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 1,
        });

        // Many invalid rules
        expect(
            linter.lint(
                [
                    '[AdGuard; uBlock Origin]',
                    'example.org##.ad',
                    '@@||example.org^$generichide',
                    'example.com##+js(aopr, test', // Missing closing bracket
                    'example.com##+jsaopr, test)', // Missing opening bracket
                    'example.com##+js...', // Invalid scriptlet rule, missing opening bracket
                    'example.com#$#body { padding 2px !important; }', // Invalid CSS rule (missing : after padding)
                    '! comment',
                    '||example.net^$third-party',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    severity: 3,
                    // eslint-disable-next-line max-len
                    message: "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no closing parentheses ')' found",
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 27,
                    },
                },
                {
                    severity: 3,
                    // eslint-disable-next-line max-len
                    message: "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no opening parentheses '(' found",
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 27,
                    },
                },
                {
                    severity: 3,
                    // eslint-disable-next-line max-len
                    message: "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no opening parentheses '(' found",
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 19,
                    },
                },
                {
                    severity: 3,
                    // eslint-disable-next-line max-len
                    message: "AGLint parsing error: Invalid rule block, expected a declaration but got 'Raw' instead",
                    position: {
                        startLine: 7,
                        startColumn: 0,
                        endLine: 7,
                        endColumn: 46,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 4,
        });
    });

    test("lint ignores inline config comments if they aren't allowed in the linter config", () => {
        const linter = new Linter(false, {
            allowInlineConfig: false,
        });

        // Invalid rule found
        expect(
            linter.lint(
                [
                    '[uBlock Origin]',
                    'example.org##.ad',
                    '@@||example.org^$generichide',
                    'example.com##+js(aopr, test)',
                    '! aglint-disable-next-line',
                    'example.com##+js(aopr, test', // Missing closing bracket
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    severity: SEVERITY.fatal,
                    message:
                        // eslint-disable-next-line max-len
                        "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no closing parentheses ')' found",
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 27,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 1,
        });

        expect(
            linter.lint(
                [
                    '[uBlock Origin]',
                    'example.org##.ad',
                    '@@||example.org^$generichide',
                    'example.com##+js(aopr, test)',
                    '! aglint-disable',
                    'example.com##+js(aopr, test', // Missing closing bracket
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    severity: SEVERITY.fatal,
                    message:
                        // eslint-disable-next-line max-len
                        "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no closing parentheses ')' found",
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 27,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 1,
        });
    });

    test('lint uses config comments properly', () => {
        const linter = new Linter(false);

        // Don't report invalid rule if it preceded by aglint-disable-next-line
        expect(
            linter.lint(
                [
                    '[uBlock Origin]',
                    'example.org##.ad',
                    '@@||example.org^$generichide',
                    'example.com##+js(aopr, test)',
                    '! aglint-disable-next-line',
                    'example.com##+js(aopr, test', // Missing closing bracket
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Don't report invalid rule if it preceded by aglint-disable
        expect(
            linter.lint(
                [
                    '[uBlock Origin]',
                    'example.org##.ad',
                    '@@||example.org^$generichide',
                    'example.com##+js(aopr, test)',
                    '! aglint-disable',
                    'example.com##+js(aopr, test', // Missing closing bracket
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        expect(
            linter.lint(
                [
                    '[uBlock Origin]',
                    'example.org##.ad',
                    '@@||example.org^$generichide',
                    'example.com##+js(aopr, test)',
                    '! aglint-disable',
                    'example.com##+js(aopr, test', // Missing closing bracket
                    '! aglint-enable',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // If another rules isn't preceded by aglint-disable-next-line, report it
        expect(
            linter.lint(
                [
                    '[uBlock Origin]',
                    'example.org##.ad',
                    '@@||example.org^$generichide',
                    'example.com##+js(aopr, test)',
                    '! aglint-disable-next-line',
                    'example.com##+js(aopr, test', // Missing closing bracket (should be skipped)
                    'example.net##+js(aopr, test', // Missing closing bracket (should be reported)
                    'example.org##+js(aopr, test', // Missing closing bracket (should be reported)
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    severity: SEVERITY.fatal,
                    message:
                        // eslint-disable-next-line max-len
                        "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no closing parentheses ')' found",
                    position: {
                        startLine: 7,
                        startColumn: 0,
                        endLine: 7,
                        endColumn: 27,
                    },
                },
                {
                    severity: SEVERITY.fatal,
                    message:
                        // eslint-disable-next-line max-len
                        "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no closing parentheses ')' found",
                    position: {
                        startLine: 8,
                        startColumn: 0,
                        endLine: 8,
                        endColumn: 27,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 2,
        });

        // Disable rule block with aglint-disable
        expect(
            linter.lint(
                [
                    '[uBlock Origin]',
                    'example.org##.ad',
                    '@@||example.org^$generichide',
                    'example.com##+js(aopr, test)',
                    '! aglint-disable',
                    'example.com##+js(aopr, test', // Missing closing bracket (should be skipped)
                    'example.net##+js(aopr, test', // Missing closing bracket (should be skipped)
                    'example.org##+js(aopr, test', // Missing closing bracket (should be skipped)
                    '! aglint-enable',
                    'example.hu##+js(aopr, test', // Missing closing bracket (should be reported)
                    'example.sk##+js(aopr, test', // Missing closing bracket (should be reported)
                    '! aglint-disable',
                    'example.com##+js(aopr, test', // Missing closing bracket (should be skipped)
                    'example.net##+js(aopr, test', // Missing closing bracket (should be skipped)
                    'example.org##+js(aopr, test', // Missing closing bracket (should be skipped)
                    '! aglint-enable',
                    'example.hu##+js(aopr, test', // Missing closing bracket (should be reported)
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    severity: SEVERITY.fatal,
                    message:
                        // eslint-disable-next-line max-len
                        "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no closing parentheses ')' found",
                    position: {
                        startLine: 10,
                        startColumn: 0,
                        endLine: 10,
                        endColumn: 26,
                    },
                },
                {
                    severity: SEVERITY.fatal,
                    message:
                        // eslint-disable-next-line max-len
                        "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no closing parentheses ')' found",
                    position: {
                        startLine: 11,
                        startColumn: 0,
                        endLine: 11,
                        endColumn: 26,
                    },
                },
                {
                    severity: SEVERITY.fatal,
                    message:
                        // eslint-disable-next-line max-len
                        "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no closing parentheses ')' found",
                    position: {
                        startLine: 17,
                        startColumn: 0,
                        endLine: 17,
                        endColumn: 26,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 3,
        });

        // Disable rule block with aglint-disable and enable single rule with aglint-enable-next-line
        expect(
            linter.lint(
                [
                    'example.org##.ad',
                    '@@||example.org^$generichide',
                    'example.com##+js(aopr, test)',
                    '! aglint-disable',
                    'example.com##+js(aopr, test', // Missing closing bracket (should be skipped)
                    '! aglint-enable-next-line',
                    'example.net##+js(aopr, test', // Missing closing bracket (should be reported)
                    'example.org##+js(aopr, test', // Missing closing bracket (should be skipped)
                    '! aglint-enable',
                    'example.biz##+js(aopr, test', // Missing closing bracket (should be reported)
                    'example.com##+js(aopr, test', // Missing closing bracket (should be reported)
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    severity: SEVERITY.fatal,
                    message:
                        // eslint-disable-next-line max-len
                        "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no closing parentheses ')' found",
                    position: {
                        startLine: 7,
                        startColumn: 0,
                        endLine: 7,
                        endColumn: 27,
                    },
                },
                {
                    severity: SEVERITY.fatal,
                    message:
                        // eslint-disable-next-line max-len
                        "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no closing parentheses ')' found",
                    position: {
                        startLine: 10,
                        startColumn: 0,
                        endLine: 10,
                        endColumn: 27,
                    },
                },
                {
                    severity: SEVERITY.fatal,
                    message:
                        // eslint-disable-next-line max-len
                        "AGLint parsing error: Invalid AdGuard/uBlock scriptlet call, no closing parentheses ')' found",
                    position: {
                        startLine: 11,
                        startColumn: 0,
                        endLine: 11,
                        endColumn: 27,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 3,
        });
    });

    test('aglint-disable-next-line inline config comment', () => {
        const linter = new Linter(false);

        linter.addRule('rule-1', demoRuleEverythingIsProblem1);
        linter.addRule('rule-2', demoRuleEverythingIsProblem2);

        // Both rules are enabled
        expect(
            linter.lint(
                [
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 4,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Disable rule-1
        expect(
            linter.lint(
                [
                    '! aglint-disable-next-line rule-1',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint-disable-next-line rule-1',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Disable rule-2
        expect(
            linter.lint(
                [
                    '! aglint-disable-next-line rule-2',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint-disable-next-line rule-2',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Disable rule-1 and rule-2 for the first line only
        expect(
            linter.lint(
                [
                    '! aglint-disable-next-line rule-1, rule-2',
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Disable rule-1 and rule-2 for both lines
        expect(
            linter.lint(
                [
                    '! aglint-disable-next-line rule-1, rule-2',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint-disable-next-line rule-1, rule-2',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });

    test('aglint-enable-next-line inline config comment', () => {
        const linter = new Linter(false);

        linter.addRule('rule-1', demoRuleEverythingIsProblem1);
        linter.addRule('rule-2', demoRuleEverythingIsProblem2);

        linter.disableRule('rule-1');
        linter.disableRule('rule-2');

        // No rules are enabled
        expect(
            linter.lint(
                [
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Enable rule-1
        expect(
            linter.lint(
                [
                    '! aglint-enable-next-line rule-1',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint-enable-next-line rule-1',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Enable rule-2
        expect(
            linter.lint(
                [
                    '! aglint-enable-next-line rule-2',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint-enable-next-line rule-2',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Enable rule-1 and rule-2 for the first line only
        expect(
            linter.lint(
                [
                    '! aglint-enable-next-line rule-1, rule-2',
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Enable rule-1 and rule-2 for both lines
        expect(
            linter.lint(
                [
                    '! aglint-enable-next-line rule-1, rule-2',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint-enable-next-line rule-1, rule-2',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 4,
                        startColumn: 0,
                        endLine: 4,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 4,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });

    test('aglint-disable inline config comment', () => {
        const linter = new Linter(false);

        linter.addRule('rule-1', demoRuleEverythingIsProblem1);
        linter.addRule('rule-2', demoRuleEverythingIsProblem2);

        // Disable at start (should not report problems at all, because linter is disabled from the start)
        expect(
            linter.lint(
                [
                    '! aglint-disable',
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [],
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Disabled from second line (should report problem on first line)
        expect(
            linter.lint(
                [
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint-disable',
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Disabled from third line (should report problem on first and second line)
        expect(
            linter.lint(
                [
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint-disable',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 4,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Disable rule-1 for this file
        expect(
            linter.lint(
                [
                    '! aglint-disable rule-1',
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-2',
                    position: {
                        startLine: 2,
                    },
                },
                {
                    rule: 'rule-2',
                    position: {
                        startLine: 3,
                    },
                },
                {
                    rule: 'rule-2',
                    position: {
                        startLine: 4,
                    },
                },
            ],
            warningCount: 3,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Disable rule-2 later
        expect(
            linter.lint(
                [
                    '! aglint-disable rule-1',
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint-disable rule-2',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-2',
                    position: {
                        startLine: 2,
                    },
                },
                {
                    rule: 'rule-2',
                    position: {
                        startLine: 3,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });

    test('aglint-enable inline config comment', () => {
        const linter = new Linter(false);

        linter.addRule('rule-1', demoRuleEverythingIsProblem1);
        linter.addRule('rule-2', demoRuleEverythingIsProblem2);

        // Disable at start and enable before last line
        expect(
            linter.lint(
                [
                    '! aglint-disable',
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint-enable',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Disable, then re-enable, then disable again, then re-enable again
        expect(
            linter.lint(
                [
                    '! aglint-disable',
                    '! aglint-enable',
                    '! aglint-disable',
                    '! aglint-enable',
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 4,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Complicated case
        expect(
            linter.lint(
                [
                    '! aglint-disable',
                    '! aglint-enable',
                    '! aglint-disable',
                    '! aglint-enable',
                    '! aglint-disable rule-1',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint-enable rule-1',
                    '! aglint-disable rule-2',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-2',
                    position: {
                        startLine: 6,
                    },
                },
                {
                    rule: 'rule-1',
                    position: {
                        startLine: 9,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });
    });

    test('aglint inline config comment', () => {
        const linter = new Linter(false);

        linter.addRule('rule-1', demoRuleEverythingIsProblem1);
        linter.addRule('rule-2', demoRuleEverythingIsProblem2);

        // Disable at start and enable before last line
        expect(
            linter.lint(
                [
                    '! aglint "rule-1": "off", "rule-2": "off"',
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint "rule-1": "warn", "rule-2": "warn"',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Disable, then re-enable, then disable again, then re-enable again
        expect(
            linter.lint(
                [
                    '! aglint "rule-1": "off", "rule-2": "off"',
                    '! aglint "rule-1": "warn", "rule-2": "warn"',
                    '! aglint "rule-1": "off", "rule-2": "off"',
                    '! aglint "rule-1": "warn", "rule-2": "warn"',
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 5,
                        startColumn: 0,
                        endLine: 5,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-1',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem2',
                    position: {
                        startLine: 6,
                        startColumn: 0,
                        endLine: 6,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 4,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Complicated case
        expect(
            linter.lint(
                [
                    '! aglint "rule-1": "off", "rule-2": "off"',
                    '! aglint "rule-1": "warn", "rule-2": "warn"',
                    '! aglint "rule-1": "off", "rule-2": "off"',
                    '! aglint "rule-1": "warn", "rule-2": "warn"',
                    '! aglint "rule-1": "off"',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint "rule-1": "warn"',
                    '! aglint "rule-2": "off"',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-2',
                    position: {
                        startLine: 6,
                    },
                },
                {
                    rule: 'rule-1',
                    position: {
                        startLine: 9,
                    },
                },
            ],
            warningCount: 2,
            errorCount: 0,
            fatalErrorCount: 0,
        });

        // Overwrite rule severity & config
        linter.addRule('rule-3', demoRuleEverythingIsProblem3);

        expect(
            linter.lint(
                [
                    // eslint-disable-next-line max-len
                    '! aglint "rule-1": "off", "rule-2": "off", "rule-3": ["error", { message: "Custom message for rule-3" }]',
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-3',
                    severity: 2,
                    message: 'Custom message for rule-3',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                },
                {
                    rule: 'rule-3',
                    severity: 2,
                    message: 'Custom message for rule-3',
                    position: {
                        startLine: 3,
                        startColumn: 0,
                        endLine: 3,
                        endColumn: 25,
                    },
                },
            ],
            warningCount: 0,
            errorCount: 2,
            fatalErrorCount: 0,
        });
    });

    test('fixable interface (single line fix)', () => {
        const linter = new Linter(false);

        const fix1 = RuleParser.parse('aaa.js$script,redirect=noopjs,domain=example.com');

        const rule1: LinterRule = {
            meta: {
                severity: SEVERITY.error,
            },
            events: {
                onRule: (context: GenericRuleContext) => {
                    const raw = <string>context.getActualAdblockRuleRaw();
                    const line = context.getActualLine();

                    context.report({
                        message: 'Fixable problem 1',
                        position: {
                            startLine: line,
                            startColumn: 0,
                            endLine: line,
                            endColumn: raw.length,
                        },
                        fix: fix1,
                    });
                },
            },
        };

        linter.addRule('rule-1', rule1);

        expect(
            linter.lint(
                [
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint-disable-next-line',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),

                // Enable fix
                true,
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 2,
                    message: 'Fixable problem 1',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 25,
                    },
                    fix: fix1,
                },
                {
                    rule: 'rule-1',
                    severity: 2,
                    message: 'Fixable problem 1',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                    fix: fix1,
                },
            ],
            warningCount: 0,
            errorCount: 2,
            fatalErrorCount: 0,
            fixed: [
                // First fix
                'aaa.js$script,redirect=noopjs,domain=example.com',
                // Second fix
                'aaa.js$script,redirect=noopjs,domain=example.com',
                // Remaining lines
                '! aglint-disable-next-line',
                'abcdefghijklmnopqrstuvxyz',
            ].join(NEWLINE),
        });
    });

    test('fixable interface (multiple line fix)', () => {
        const linter = new Linter(false);

        const fix2 = [
            RuleParser.parse('aaa.js$script,redirect=noopjs,domain=example.com'),
            RuleParser.parse('bbb.js$script,redirect=noopjs,domain=example.com'),
            RuleParser.parse('ccc.js$script,redirect=noopjs,domain=example.com'),
        ];

        const rule2: LinterRule = {
            meta: {
                severity: SEVERITY.error,
            },
            events: {
                onRule: (context: GenericRuleContext) => {
                    const raw = <string>context.getActualAdblockRuleRaw();
                    const line = context.getActualLine();

                    context.report({
                        message: 'Fixable problem 2',
                        position: {
                            startLine: line,
                            startColumn: 0,
                            endLine: line,
                            endColumn: raw.length,
                        },
                        fix: fix2,
                    });
                },
            },
        };

        linter.addRule('rule-2', rule2);

        expect(
            linter.lint(
                [
                    'abcdefghijklmnopqrstuvxyz\n',
                    'abcdefghijklmnopqrstuvxyz\n',
                    '! aglint-disable-next-line\r\n',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(EMPTY),

                // Enable fix
                true,
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-2',
                    severity: 2,
                    message: 'Fixable problem 2',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 25,
                    },
                    fix: fix2,
                },
                {
                    rule: 'rule-2',
                    severity: 2,
                    message: 'Fixable problem 2',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                    fix: fix2,
                },
            ],
            warningCount: 0,
            errorCount: 2,
            fatalErrorCount: 0,
            fixed: [
                // First fix
                'aaa.js$script,redirect=noopjs,domain=example.com\n',
                'bbb.js$script,redirect=noopjs,domain=example.com\n',
                'ccc.js$script,redirect=noopjs,domain=example.com\n',
                // Second fix
                'aaa.js$script,redirect=noopjs,domain=example.com\n',
                'bbb.js$script,redirect=noopjs,domain=example.com\n',
                'ccc.js$script,redirect=noopjs,domain=example.com\n',
                // Remaining lines
                '! aglint-disable-next-line\r\n',
                'abcdefghijklmnopqrstuvxyz',
            ].join(EMPTY),
        });
    });

    test('fixable interface (conflicting fixes)', () => {
        const linter = new Linter(false);

        const fix1 = RuleParser.parse('aaa.js$script,redirect=noopjs,domain=example.com');

        const rule1: LinterRule = {
            meta: {
                severity: SEVERITY.error,
            },
            events: {
                onRule: (context: GenericRuleContext) => {
                    const raw = <string>context.getActualAdblockRuleRaw();
                    const line = context.getActualLine();

                    context.report({
                        message: 'Fixable problem 1',
                        position: {
                            startLine: line,
                            startColumn: 0,
                            endLine: line,
                            endColumn: raw.length,
                        },
                        fix: fix1,
                    });
                },
            },
        };

        const fix2 = [
            RuleParser.parse('aaa.js$script,redirect=noopjs,domain=example.com'),
            RuleParser.parse('bbb.js$script,redirect=noopjs,domain=example.com'),
            RuleParser.parse('ccc.js$script,redirect=noopjs,domain=example.com'),
        ];

        const rule2: LinterRule = {
            meta: {
                severity: SEVERITY.error,
            },
            events: {
                onRule: (context: GenericRuleContext) => {
                    const raw = <string>context.getActualAdblockRuleRaw();
                    const line = context.getActualLine();

                    context.report({
                        message: 'Fixable problem 2',
                        position: {
                            startLine: line,
                            startColumn: 0,
                            endLine: line,
                            endColumn: raw.length,
                        },
                        fix: fix2,
                    });
                },
            },
        };

        linter.addRule('rule-1', rule1);
        linter.addRule('rule-2', rule2);

        expect(
            linter.lint(
                [
                    'abcdefghijklmnopqrstuvxyz',
                    'abcdefghijklmnopqrstuvxyz',
                    '! aglint-disable-next-line',
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),

                // Enable fix
                true,
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-1',
                    severity: 2,
                    message: 'Fixable problem 1',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 25,
                    },
                    fix: fix1,
                },
                {
                    rule: 'rule-2',
                    severity: 2,
                    message: 'Fixable problem 2',
                    position: {
                        startLine: 1,
                        startColumn: 0,
                        endLine: 1,
                        endColumn: 25,
                    },
                    fix: fix2,
                },
                {
                    rule: 'rule-1',
                    severity: 2,
                    message: 'Fixable problem 1',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                    fix: fix1,
                },
                {
                    rule: 'rule-2',
                    severity: 2,
                    message: 'Fixable problem 2',
                    position: {
                        startLine: 2,
                        startColumn: 0,
                        endLine: 2,
                        endColumn: 25,
                    },
                    fix: fix2,
                },
            ],
            warningCount: 0,
            errorCount: 4,
            fatalErrorCount: 0,
            fixed: [
                // Fixing should be skipped, because there are conflicting fixes
                'abcdefghijklmnopqrstuvxyz',
                'abcdefghijklmnopqrstuvxyz',
                '! aglint-disable-next-line',
                'abcdefghijklmnopqrstuvxyz',
            ].join(NEWLINE),
        });
    });

    test('rule with different severities', () => {
        const linter = new Linter(false);

        linter.addRule('rule-1', demoRuleEverythingIsProblem1);
        linter.setRuleConfig('rule-1', 'off');

        linter.addRule('rule-2', demoRuleEverythingIsProblem1);
        linter.setRuleConfig('rule-2', 'warn');

        linter.addRule('rule-3', demoRuleEverythingIsProblem1);
        linter.setRuleConfig('rule-3', 'error');

        linter.addRule('rule-4', demoRuleEverythingIsProblem1);
        linter.setRuleConfig('rule-4', 'fatal');

        // Disable at start and enable before last line
        expect(
            linter.lint(
                [
                    'abcdefghijklmnopqrstuvxyz',
                ].join(NEWLINE),
            ),
        ).toMatchObject({
            problems: [
                {
                    rule: 'rule-2',
                    severity: 1,
                    message: 'Problem1',
                    position: {
                        startLine: 1,
                    },
                },
                {
                    rule: 'rule-3',
                    severity: 2,
                    message: 'Problem1',
                    position: {
                        startLine: 1,
                    },
                },
                {
                    rule: 'rule-4',
                    severity: 3,
                    message: 'Problem1',
                    position: {
                        startLine: 1,
                    },
                },
            ],
            warningCount: 1,
            errorCount: 1,
            fatalErrorCount: 1,
        });
    });

    test('rule context getters', () => {
        const linter = new Linter(false);

        let config: LinterConfig | null = null;
        let content: string | null = null;
        const rawRules: (string | undefined)[] = [];
        const astRules: (AnyRule | undefined)[] = [];
        const lines: number[] = [];
        let receivedConfig: object | null = null;

        const rule = <LinterRule>{
            meta: {
                severity: SEVERITY.warn,
                config: {
                    default: {
                        a: 1,
                    },
                    schema: ss.object({
                        a: ss.number(),
                    }),
                },
            },
            events: {
                onRule: (context: GenericRuleContext) => {
                    config = context.getLinterConfig();
                    content = context.getFilterListContent();
                    rawRules.push(context.getActualAdblockRuleRaw());
                    astRules.push(context.getActualAdblockRuleAst());
                    lines.push(context.getActualLine());
                    receivedConfig = <object>context.config;
                },
            },
        };

        linter.addRule('rule-1', rule);

        const filterListRawRules = [
            '||example.com$script,third-party',
            'example.net^$important',
            'example.org/ads.js^$script,third-party',
        ];

        const filterList = filterListRawRules.join(NEWLINE);

        linter.lint(filterList);

        expect(config).toMatchObject(linter.getConfig());
        expect(content).toBe(filterList);
        expect(rawRules).toEqual(filterListRawRules);
        expect(astRules).toEqual(filterListRawRules.map((raw) => RuleParser.parse(raw)));
        expect(lines).toEqual(Array.from({ length: filterListRawRules.length }, (_, i) => i + 1));
        expect(receivedConfig).toEqual({ a: 1 });
    });
});
