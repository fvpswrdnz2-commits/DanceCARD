import { describe, expect, it } from 'vitest';
import {
  createDanceCardEditSchema,
  createDanceCardPublishSchema,
  getShanghaiDate,
} from './dance-card';

const NOW = new Date('2026-08-21T15:59:59.000Z');

const validInput = {
  studioId: 'studio-1',
  sellerNickname: 'Alice',
  wechatId: 'alice-wechat',
  remainingCount: 10,
  pricePerClass: 60,
  expireDate: '2026-08-21',
  danceScope: 'all' as const,
  danceTypes: [] as string[],
  danceTypeOther: null,
  usageRestrictions: null,
  description: null,
};

function expectInvalid(overrides: Record<string, unknown>, field: string) {
  const result = createDanceCardPublishSchema(NOW).safeParse({ ...validInput, ...overrides });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
  }
}

describe('DanceCARD dance-card validation', () => {
  it('uses Asia/Shanghai when deriving today', () => {
    expect(getShanghaiDate(NOW)).toBe('2026-08-21');
    expect(getShanghaiDate(new Date('2026-08-21T16:00:00.000Z'))).toBe('2026-08-22');
  });

  it('accepts a complete publish payload and normalizes optional text', () => {
    const result = createDanceCardPublishSchema(NOW).parse({
      ...validInput,
      sellerNickname: '  Alice  ',
      wechatId: '  alice-wechat  ',
      usageRestrictions: '   ',
      description: undefined,
    });

    expect(result.sellerNickname).toBe('Alice');
    expect(result.wechatId).toBe('alice-wechat');
    expect(result.usageRestrictions).toBeNull();
    expect(result.description).toBeNull();
  });

  it('requires a studio for publishing but not for editing', () => {
    expectInvalid({ studioId: '' }, 'studioId');
    const editableFields: Record<string, unknown> = { ...validInput };
    delete editableFields.studioId;

    expect(createDanceCardEditSchema(NOW).safeParse(editableFields).success).toBe(true);
  });

  it.each([1, 999, '10'])(
    'accepts remaining-count value %s inside the inclusive boundary',
    (remainingCount) => {
      expect(
        createDanceCardPublishSchema(NOW).safeParse({ ...validInput, remainingCount }).success,
      ).toBe(true);
    },
  );

  it.each([0, -1, 1.5, 1000])('rejects invalid remaining-count value %s', (remainingCount) => {
    expectInvalid({ remainingCount }, 'remainingCount');
  });

  it.each([0.01, 1, 999.99, '60.50'])('accepts valid RMB price %s', (pricePerClass) => {
    expect(
      createDanceCardPublishSchema(NOW).safeParse({ ...validInput, pricePerClass }).success,
    ).toBe(true);
  });

  it.each([0, -1, 1.001, 'not-a-number'])(
    'rejects non-positive, malformed, or over-precision price %s',
    (pricePerClass) => {
      expectInvalid({ pricePerClass }, 'pricePerClass');
    },
  );

  it('accepts the Shanghai calendar day through its end and rejects an earlier date', () => {
    expect(
      createDanceCardPublishSchema(NOW).safeParse({ ...validInput, expireDate: '2026-08-21' })
        .success,
    ).toBe(true);
    expectInvalid({ expireDate: '2026-08-20' }, 'expireDate');
    expectInvalid({ expireDate: '2026-02-30' }, 'expireDate');
  });

  it('enforces nickname boundaries by user-visible characters', () => {
    expect(
      createDanceCardPublishSchema(NOW).safeParse({
        ...validInput,
        sellerNickname: '舞'.repeat(30),
      }).success,
    ).toBe(true);
    expectInvalid({ sellerNickname: '舞'.repeat(31) }, 'sellerNickname');
    expectInvalid({ sellerNickname: '   ' }, 'sellerNickname');
  });

  it('enforces WeChat ID boundaries', () => {
    expect(
      createDanceCardPublishSchema(NOW).safeParse({
        ...validInput,
        wechatId: 'w'.repeat(50),
      }).success,
    ).toBe(true);
    expectInvalid({ wechatId: 'w'.repeat(51) }, 'wechatId');
    expectInvalid({ wechatId: '' }, 'wechatId');
  });

  it('enforces optional text limits', () => {
    expect(
      createDanceCardPublishSchema(NOW).safeParse({
        ...validInput,
        usageRestrictions: '限'.repeat(200),
        description: '注'.repeat(500),
      }).success,
    ).toBe(true);
    expectInvalid({ usageRestrictions: '限'.repeat(201) }, 'usageRestrictions');
    expectInvalid({ description: '注'.repeat(501) }, 'description');
  });

  it('accepts multiple preset dance types', () => {
    expect(
      createDanceCardPublishSchema(NOW).safeParse({
        ...validInput,
        danceScope: 'specified',
        danceTypes: ['jazz', 'house', 'waacking'],
      }).success,
    ).toBe(true);
  });

  it('requires a custom name when other is selected', () => {
    expectInvalid(
      { danceScope: 'specified', danceTypes: ['other'], danceTypeOther: '' },
      'danceTypeOther',
    );
    expect(
      createDanceCardPublishSchema(NOW).safeParse({
        ...validInput,
        danceScope: 'specified',
        danceTypes: ['jazz', 'other'],
        danceTypeOther: 'Voguing',
      }).success,
    ).toBe(true);
  });

  it('keeps all-dance and specified selections mutually exclusive', () => {
    expectInvalid({ danceScope: 'all', danceTypes: ['jazz'] }, 'danceTypes');
    expectInvalid({ danceScope: 'specified', danceTypes: [] }, 'danceTypes');
    expectInvalid(
      { danceScope: 'specified', danceTypes: ['jazz'], danceTypeOther: 'Voguing' },
      'danceTypeOther',
    );
    expectInvalid({ danceScope: 'specified', danceTypes: ['jazz', 'jazz'] }, 'danceTypes');
  });
});
