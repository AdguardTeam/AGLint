import { Platform } from '@adguard/agtree';
import { describe, expect, it } from 'vitest';

import { platformsToConfigValues } from '../../src/cli/init-wizard';

describe('platformsToConfigValues', () => {
    it('optimizes a complete group of concrete platforms into a generic name', () => {
        expect(platformsToConfigValues([
            Platform.AdgExtChrome,
            Platform.AdgExtOpera,
            Platform.AdgExtEdge,
            Platform.AdgExtFirefox,
            Platform.AdgExtChromeMv3,
            Platform.AdgExtOperaMv3,
            Platform.AdgExtEdgeMv3,
            Platform.AdgExtFirefoxMv3,
        ])).toEqual(['adg_ext_any']);
    });

    it('keeps concrete platforms when they cannot be combined', () => {
        expect(platformsToConfigValues([
            Platform.AdgOsWindows,
            Platform.AdgOsMac,
        ])).toEqual(['adg_os_windows', 'adg_os_mac']);
    });

    it('returns an empty array for no selection', () => {
        expect(platformsToConfigValues([])).toEqual([]);
    });
});
