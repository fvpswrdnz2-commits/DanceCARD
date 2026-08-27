import { describe, expect, it } from 'vitest';
import { getPortableShanghaiDate, validatePortableDanceCardEdit } from './portable';

const NOW = new Date('2026-08-21T15:59:59.000Z');
const validInput = {
  danceScope: 'all' as const,
  danceTypeOther: null,
  danceTypes: [],
  description: '  ',
  expireDate: '2026-08-21',
  pricePerClass: '60.50',
  remainingCount: '10',
  sellerNickname: '  Alice  ',
  usageRestrictions: '',
  wechatId: '  alice-wechat  ',
};

describe('portable DanceCARD validation', () => {
  it('derives the Shanghai calendar day without Intl', () => {
    expect(getPortableShanghaiDate(NOW)).toBe('2026-08-21');
    expect(getPortableShanghaiDate(new Date('2026-08-21T16:00:00.000Z'))).toBe('2026-08-22');
  });

  it('accepts and normalizes a valid edit payload', () => {
    const result = validatePortableDanceCardEdit(validInput, NOW);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        description: null,
        pricePerClass: 60.5,
        remainingCount: 10,
        sellerNickname: 'Alice',
        usageRestrictions: null,
        wechatId: 'alice-wechat',
      });
    }
  });

  it('returns field issues without throwing', () => {
    const result = validatePortableDanceCardEdit(
      {
        ...validInput,
        danceScope: 'specified',
        danceTypes: [],
        expireDate: '2026-08-20',
        sellerNickname: '',
      },
      NOW,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['sellerNickname', 'expireDate', 'danceTypes']),
      );
    }
  });
});
