import { beforeAll, describe, expect, test } from 'vitest';

import { Linter } from '../../../src/linter';
import { InvalidDomainList } from '../../../src/linter/rules/invalid-domain-list';

let linter: Linter;

describe('invalid-domain-list', () => {
    beforeAll(() => {
        // Configure linter with the rule
        linter = new Linter(false);
        linter.addRule('invalid-domain-list', InvalidDomainList);
    });

    test('should ignore non-problematic cases', () => {
        // No domain at all
        expect(linter.lint('##.banner')).toMatchObject({ problems: [] });

        // Wildcard-only
        expect(linter.lint('*##.banner')).toMatchObject({ problems: [] });

        // Simple domain
        expect(linter.lint('example.com##.banner')).toMatchObject({ problems: [] });

        // Wildcard TLD
        expect(linter.lint('example.*##.banner')).toMatchObject({ problems: [] });

        // Wildcard subdomain
        expect(linter.lint('*.example.com##.banner')).toMatchObject({ problems: [] });

        // Wildcard subdomain and TLD
        expect(linter.lint('*.example.*##.banner')).toMatchObject({ problems: [] });

        // IP address
        expect(linter.lint('127.0.0.1##.banner')).toMatchObject({ problems: [] });

        // Unicode domain (IDN)
        expect(linter.lint('한글코딩.org##.banner')).toMatchObject({ problems: [] });

        // Simple domain exception
        expect(linter.lint('~example.com##.banner')).toMatchObject({ problems: [] });

        // Wildcard TLD exception
        expect(linter.lint('~example.*##.banner')).toMatchObject({ problems: [] });

        // Wildcard subdomain exception
        expect(linter.lint('~*.example.com##.banner')).toMatchObject({ problems: [] });

        // Wildcard subdomain and TLD exception
        expect(linter.lint('~*.example.*##.banner')).toMatchObject({ problems: [] });

        // IP address exception
        expect(linter.lint('~127.0.0.1##.banner')).toMatchObject({ problems: [] });

        // Unicode domain (IDN) exception
        expect(linter.lint('~한글코딩.org##.banner')).toMatchObject({ problems: [] });

        // Mixed
        expect(
            linter.lint(
                // eslint-disable-next-line max-len
                'example.com,~example.com,example.*,~example.*,*.example.com,~*.example.com,*.example.*,~*.example.*,127.0.0.1,~127.0.0.1,한글코딩.org,~한글코딩.org##.banner',
            ),
        ).toMatchObject({ problems: [] });
    });

    test('should detect problematic cases', () => {
        // Missed TLD
        expect(linter.lint('example.##.banner')).toMatchObject({
            problems: [
                {
                    rule: 'invalid-domain-list',
                    severity: 2,
                    message: 'Invalid domain "example."',
                    position: {
                        startColumn: 0,
                        endColumn: 8,
                    },
                },
            ],
        });

        // Dot only
        expect(linter.lint('.##.banner')).toMatchObject({
            problems: [
                {
                    rule: 'invalid-domain-list',
                    severity: 2,
                    message: 'Invalid domain "."',
                    position: {
                        startColumn: 0,
                        endColumn: 1,
                    },
                },
            ],
        });

        expect(linter.lint('...##.banner')).toMatchObject({
            problems: [
                {
                    rule: 'invalid-domain-list',
                    severity: 2,
                    message: 'Invalid domain "..."',
                    position: {
                        startColumn: 0,
                        endColumn: 3,
                    },
                },
            ],
        });

        // Invalid character
        expect(linter.lint('AA BB##.banner')).toMatchObject({
            problems: [
                {
                    rule: 'invalid-domain-list',
                    severity: 2,
                    message: 'Invalid domain "AA BB"',
                    position: {
                        startColumn: 0,
                        endColumn: 5,
                    },
                },
            ],
        });

        // Invalid character
        expect(linter.lint('AA BB CC##.banner')).toMatchObject({
            problems: [
                {
                    rule: 'invalid-domain-list',
                    severity: 2,
                    message: 'Invalid domain "AA BB CC"',
                    position: {
                        startColumn: 0,
                        endColumn: 8,
                    },
                },
            ],
        });

        // Invalid character
        expect(linter.lint('a^b##.banner')).toMatchObject({
            problems: [
                {
                    rule: 'invalid-domain-list',
                    severity: 2,
                    message: 'Invalid domain "a^b"',
                    position: {
                        startColumn: 0,
                        endColumn: 3,
                    },
                },
            ],
        });
    });
});
