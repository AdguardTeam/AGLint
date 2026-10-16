import { describe, expect, it } from 'vitest';

import { getPlatformNames, parsePlatformExpression } from '../../src/linter/platforms';

describe('getPlatformNames', () => {
    it('lists concrete v5 platforms', () => {
        const { specificPlatformNames } = getPlatformNames();

        expect(specificPlatformNames).toContain('adg_os_windows');
        expect(specificPlatformNames).toContain('adg_ext_chrome_mv3');
        expect(specificPlatformNames).toContain('ubo_ext_firefox');
    });

    it('lists generic names and legacy aliases', () => {
        const { genericPlatformNames } = getPlatformNames();

        expect(genericPlatformNames).toContain('adg_any');
        expect(genericPlatformNames).toContain('adg_os_any');
        expect(genericPlatformNames).toContain('ubo_any');
        expect(genericPlatformNames).toContain('any');
        expect(genericPlatformNames).toContain('adg_ext_chromium');
        expect(genericPlatformNames).toContain('adg_safari_any');
    });

    it('does not list impossible generic combinations', () => {
        const { genericPlatformNames } = getPlatformNames();

        expect(genericPlatformNames).not.toContain('ubo_os_any');
        expect(genericPlatformNames).not.toContain('abp_safari_any');
    });
});

describe('parsePlatformExpression', () => {
    it('returns an empty list when no platforms are configured', () => {
        expect(parsePlatformExpression([])).toEqual([]);
    });

    it('parses a generic platform', () => {
        expect(parsePlatformExpression(['adg_any']).map(String)).toEqual(['adg_any']);
    });

    it('parses a concrete platform', () => {
        expect(parsePlatformExpression(['adg_os_windows']).map(String)).toEqual(['adg_os_windows']);
    });

    it('expands the legacy chromium alias', () => {
        expect(parsePlatformExpression(['adg_ext_chromium']).map(String)).toEqual([
            'adg_ext_chrome',
            'adg_ext_opera',
            'adg_ext_edge',
        ]);
    });

    it('expands the legacy safari alias', () => {
        expect(parsePlatformExpression(['adg_safari_any']).map(String)).toEqual([
            'adg_cb_safari',
            'adg_cb_ios',
        ]);
    });

    it('applies negation to an alias', () => {
        expect(parsePlatformExpression(['adg_any', '~adg_safari_any']).map(String)).toEqual([
            'adg_cb_android',
            'adg_ext_any',
            'adg_os_any',
        ]);
    });

    it('throws for an unknown platform', () => {
        expect(() => parsePlatformExpression(['adg_any2'])).toThrow('adg_any2');
    });
});
