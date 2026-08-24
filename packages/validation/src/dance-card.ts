import { PRESET_DANCE_TYPES } from '@dancecard/domain';
import { z } from 'zod';

export const SHANGHAI_TIME_ZONE = 'Asia/Shanghai';
export const CUSTOM_DANCE_TYPE = 'other' as const;
export const DANCE_TYPE_OPTIONS = [...PRESET_DANCE_TYPES, CUSTOM_DANCE_TYPE] as const;

const countCharacters = (value: string) => Array.from(value).length;

function requiredText(label: string, maximum: number) {
  return z
    .string({ error: `${label}必须填写` })
    .trim()
    .refine((value) => countCharacters(value) >= 1, { message: `${label}必须填写` })
    .refine((value) => countCharacters(value) <= maximum, {
      message: `${label}最多${maximum}个字符`,
    });
}

function optionalText(label: string, maximum: number) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => value?.trim() || null)
    .refine((value) => value === null || countCharacters(value) <= maximum, {
      message: `${label}最多${maximum}个字符`,
    });
}

const positivePrice = z
  .union([z.number(), z.string().trim().min(1, { message: '单节价格必须填写' })])
  .transform((value) => (typeof value === 'number' ? value : Number(value)))
  .pipe(
    z
      .number({ error: '单节价格必须是数字' })
      .finite({ message: '单节价格必须是有限数字' })
      .positive({ message: '单节价格必须大于0' })
      .refine((value) => Number.isInteger(Math.round(value * 100_000_000) / 1_000_000), {
        message: '单节价格最多保留两位小数',
      }),
  );

const remainingCount = z.coerce
  .number({ error: '剩余课时必须是数字' })
  .int({ message: '剩余课时必须是整数' })
  .min(1, { message: '剩余课时不能少于1节' })
  .max(999, { message: '剩余课时不能超过999节' });

function shanghaiDate(now: Date) {
  return z
    .string({ error: '使用截止日期必须填写' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: '使用截止日期格式必须为YYYY-MM-DD' })
    .refine(isRealCalendarDate, { message: '使用截止日期不是有效日期' })
    .refine((value) => value >= getShanghaiDate(now), {
      message: '使用截止日期不得早于今天',
    });
}

function isRealCalendarDate(value: string): boolean {
  const [yearText, monthText, dayText] = value.split('-');
  if (!yearText || !monthText || !dayText) return false;

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function getShanghaiDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone: SHANGHAI_TIME_ZONE,
    year: 'numeric',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${value.year}-${value.month}-${value.day}`;
}

const sharedShape = (now: Date) => ({
  sellerNickname: requiredText('卖家昵称', 30),
  wechatId: requiredText('微信号', 50),
  remainingCount,
  pricePerClass: positivePrice,
  expireDate: shanghaiDate(now),
  danceScope: z.enum(['all', 'specified'], { error: '请选择可用舞种范围' }),
  danceTypes: z.array(z.enum(DANCE_TYPE_OPTIONS)).default([]),
  danceTypeOther: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => value?.trim() || null),
  usageRestrictions: optionalText('使用限制', 200),
  description: optionalText('备注', 500),
});

function applyDanceSelectionRules<Shape extends z.ZodRawShape>(schema: z.ZodObject<Shape>) {
  return schema.superRefine((value, context) => {
    const selection = value as unknown as {
      danceScope: 'all' | 'specified';
      danceTypes: string[];
      danceTypeOther: string | null;
    };
    const scope = selection.danceScope;
    const danceTypes = selection.danceTypes;
    const customType = selection.danceTypeOther;
    const hasOther = danceTypes.includes(CUSTOM_DANCE_TYPE);

    if (new Set(danceTypes).size !== danceTypes.length) {
      context.addIssue({
        code: 'custom',
        message: '可用舞种不能重复选择',
        path: ['danceTypes'],
      });
    }

    if (scope === 'all' && (danceTypes.length > 0 || customType !== null)) {
      context.addIssue({
        code: 'custom',
        message: '全部舞种不能同时选择指定舞种',
        path: ['danceTypes'],
      });
    }

    if (scope === 'specified' && danceTypes.length === 0) {
      context.addIssue({
        code: 'custom',
        message: '请至少选择一个指定舞种',
        path: ['danceTypes'],
      });
    }

    if (scope === 'specified' && hasOther && customType === null) {
      context.addIssue({
        code: 'custom',
        message: '选择其他后必须填写自定义舞种名称',
        path: ['danceTypeOther'],
      });
    }

    if (!hasOther && customType !== null) {
      context.addIssue({
        code: 'custom',
        message: '只有选择其他时才能填写自定义舞种名称',
        path: ['danceTypeOther'],
      });
    }
  });
}

export function createDanceCardPublishSchema(now = new Date()) {
  return applyDanceSelectionRules(
    z.object({
      studioId: z.string().trim().min(1, { message: '舞室必须由发布入口绑定' }),
      ...sharedShape(now),
    }),
  );
}

export function createDanceCardEditSchema(now = new Date()) {
  return applyDanceSelectionRules(z.object(sharedShape(now)));
}

export type DanceCardPublishInput = z.input<ReturnType<typeof createDanceCardPublishSchema>>;
export type DanceCardPublishData = z.output<ReturnType<typeof createDanceCardPublishSchema>>;
export type DanceCardEditInput = z.input<ReturnType<typeof createDanceCardEditSchema>>;
export type DanceCardEditData = z.output<ReturnType<typeof createDanceCardEditSchema>>;
