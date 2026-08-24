import { ADMIN_ACTIONS, AUTH_PROVIDERS, HIDDEN_REASONS, PRESET_DANCE_TYPES } from './index';
import { describe, expect, it } from 'vitest';

describe('@dancecard/domain public entry', () => {
  it('exports the supported domain vocabularies', () => {
    expect(AUTH_PROVIDERS).toEqual(['phone', 'wechat']);
    expect(PRESET_DANCE_TYPES).toContain('jazz');
    expect(HIDDEN_REASONS).not.toContain('sold');
    expect(ADMIN_ACTIONS).toContain('disable_user');
  });
});
