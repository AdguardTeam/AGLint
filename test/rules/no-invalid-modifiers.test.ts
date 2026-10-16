import { describe, expect, it } from 'vitest';

import { type LinterRulesConfig } from '../../src/linter/config';
import { LinterRuleSeverity } from '../../src/linter/rule';

import { lint } from './helpers/lint';

const rulesConfig: LinterRulesConfig = {
    'no-invalid-modifiers': LinterRuleSeverity.Error,
};

describe('no-invalid-modifiers', () => {
    it('should not report valid modifiers', async () => {
        await expect(
            lint('||video.example.com/ext_tw_video/*/*.m3u8$domain=/^i[a-z]*\\.test[a-z]+\\..*/', rulesConfig),
        ).resolves.toHaveProperty('problems', []);
    });

    it('validates modifiers per configured product', async () => {
        // `webrtc` is removed for AdGuard but valid for AdBlock Plus
        const result = await lint(
            '||example.com^$webrtc',
            rulesConfig,
            undefined,
            ['adg_any', 'abp_any'],
        );

        expect(result.problems.map((problem) => problem.message)).toStrictEqual([
            'Invalid modifier: "webrtc", got "Removed and no longer supported modifier: \'webrtc\'"',
        ]);
    });

    it('validates redirect values with wildcard platforms', async () => {
        // Valid redirect with a product-level wildcard must not throw
        const result = await lint(
            '||example.com^$redirect=noop.txt',
            rulesConfig,
            undefined,
            ['adg_any'],
        );

        expect(result.problems).toStrictEqual([]);
    });

    it('validates redirect values with no configured platforms', async () => {
        // No platforms configured: validation runs against the any-product wildcard
        const result = await lint(
            '||example.com^$redirect=noop.txt',
            rulesConfig,
        );

        expect(result.problems).toStrictEqual([]);
    });
});
