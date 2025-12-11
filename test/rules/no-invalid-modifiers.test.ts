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
        ).resolves.toMatchObject({ problems: [] });
    });
});
