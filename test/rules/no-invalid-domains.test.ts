import {
    describe,
    expect,
    it,
    test,
} from 'vitest';

import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint } from './helpers/lint';

const rulesConfig: LinterRulesConfig = {
    'no-invalid-domains': LinterRuleSeverity.Error,
};

describe('no-invalid-domains', () => {
    test('should ignore non-problematic cases', async () => {
        // No domain at all
        await expect(lint('##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // Wildcard-only
        await expect(lint('*##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // Simple domain
        await expect(lint('example.com##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // Wildcard TLD
        await expect(lint('example.*##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // Wildcard subdomain
        await expect(lint('*.example.com##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // Wildcard subdomain and TLD
        await expect(lint('*.example.*##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // IP address
        await expect(lint('127.0.0.1##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // Unicode domain (IDN)
        await expect(lint('한글코딩.org##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // Simple domain exception
        await expect(lint('~example.com##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // Wildcard TLD exception
        await expect(lint('~example.*##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // Wildcard subdomain exception
        await expect(lint('~*.example.com##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // Wildcard subdomain and TLD exception
        await expect(lint('~*.example.*##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // IP address exception
        await expect(lint('~127.0.0.1##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // Unicode domain (IDN) exception
        await expect(lint('~한글코딩.org##.banner', rulesConfig)).resolves.toHaveProperty('problems', []);

        // Mixed
        await expect(
            lint(
                // eslint-disable-next-line max-len
                'example.com,~example.com,example.*,~example.*,*.example.com,~*.example.com,*.example.*,~*.example.*,127.0.0.1,~127.0.0.1,한글코딩.org,~한글코딩.org##.banner',
                rulesConfig,
            ),
        ).resolves.toHaveProperty('problems', []);
    });

    it('should detect problematic cases', async () => {
        // Missed TLD
        expect((await lint('example.##.banner', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-domains',
                severity: LinterRuleSeverity.Error,
                data: {
                    domain: 'example.',
                },
                message: expect.any(String),
                messageId: 'invalidDomain',
                position: {
                    start: {
                        column: 0,
                        line: 1,
                    },
                    end: {
                        column: 8,
                        line: 1,
                    },
                },
                suggestions: [
                    {
                        messageId: 'removeInvalidDomain',
                        message: expect.any(String),
                        data: {
                            domain: 'example.',
                        },
                        fix: {
                            range: [0, 8],
                            text: '',
                        },
                    },
                ],
            },
        ]);

        // Dot only
        expect((await lint('.##.banner', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-domains',
                severity: LinterRuleSeverity.Error,
                data: {
                    domain: '.',
                },
                message: expect.any(String),
                messageId: 'invalidDomain',
                position: {
                    start: {
                        column: 0,
                        line: 1,
                    },
                    end: {
                        column: 1,
                        line: 1,
                    },
                },
                suggestions: [
                    {
                        messageId: 'removeInvalidDomain',
                        message: expect.any(String),
                        data: {
                            domain: '.',
                        },
                        fix: {
                            range: [0, 1],
                            text: '',
                        },
                    },
                ],
            },
        ]);

        expect((await lint('...##.banner', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-domains',
                severity: LinterRuleSeverity.Error,
                data: {
                    domain: '...',
                },
                message: expect.any(String),
                messageId: 'invalidDomain',
                position: {
                    start: {
                        column: 0,
                        line: 1,
                    },
                    end: {
                        column: 3,
                        line: 1,
                    },
                },
                suggestions: [
                    {
                        message: expect.any(String),
                        messageId: 'removeInvalidDomain',
                        data: {
                            domain: '...',
                        },
                        fix: {
                            range: [0, 3],
                            text: '',
                        },
                    },
                ],
            },
        ]);

        // Invalid character
        expect((await lint('AA BB##.banner', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-domains',
                severity: LinterRuleSeverity.Error,
                data: {
                    domain: 'AA BB',
                },
                message: expect.any(String),
                messageId: 'invalidDomain',
                position: {
                    start: {
                        column: 0,
                        line: 1,
                    },
                    end: {
                        column: 5,
                        line: 1,
                    },
                },
                suggestions: [
                    {
                        message: expect.any(String),
                        messageId: 'removeInvalidDomain',
                        data: {
                            domain: 'AA BB',
                        },
                        fix: {
                            range: [0, 5],
                            text: '',
                        },
                    },
                ],
            },
        ]);

        // Invalid character
        expect((await lint('AA BB CC##.banner', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-domains',
                severity: LinterRuleSeverity.Error,
                data: {
                    domain: 'AA BB CC',
                },
                message: expect.any(String),
                messageId: 'invalidDomain',
                position: {
                    start: {
                        column: 0,
                        line: 1,
                    },
                    end: {
                        column: 8,
                        line: 1,
                    },
                },
                suggestions: [
                    {
                        message: expect.any(String),
                        messageId: 'removeInvalidDomain',
                        data: {
                            domain: 'AA BB CC',
                        },
                        fix: {
                            range: [0, 8],
                            text: '',
                        },
                    },
                ],
            },
        ]);

        // Invalid character
        expect((await lint('a^b##.banner', rulesConfig)).problems).toStrictEqual([
            {
                category: 'problem',
                ruleId: 'no-invalid-domains',
                severity: LinterRuleSeverity.Error,
                data: {
                    domain: 'a^b',
                },
                message: expect.any(String),
                messageId: 'invalidDomain',
                position: {
                    start: {
                        column: 0,
                        line: 1,
                    },
                    end: {
                        column: 3,
                        line: 1,
                    },
                },
                suggestions: [
                    {
                        message: expect.any(String),
                        messageId: 'removeInvalidDomain',
                        data: {
                            domain: 'a^b',
                        },
                        fix: {
                            range: [0, 3],
                            text: '',
                        },
                    },
                ],
            },
        ]);
    });
});
