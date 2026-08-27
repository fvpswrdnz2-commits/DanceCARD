import { PRESET_DANCE_TYPES } from '@dancecard/domain';

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;
const CUSTOM_DANCE_TYPE = 'other';
const DANCE_TYPE_OPTIONS = [...PRESET_DANCE_TYPES, CUSTOM_DANCE_TYPE] as readonly string[];

export interface PortableDanceCardEditInput {
  danceScope: 'all' | 'specified';
  danceTypeOther?: null | string;
  danceTypes: string[];
  description?: null | string;
  expireDate: string;
  pricePerClass: number | string;
  remainingCount: number | string;
  sellerNickname: string;
  usageRestrictions?: null | string;
  wechatId: string;
}

export interface PortableDanceCardEditData {
  danceScope: 'all' | 'specified';
  danceTypeOther: null | string;
  danceTypes: string[];
  description: null | string;
  expireDate: string;
  pricePerClass: number;
  remainingCount: number;
  sellerNickname: string;
  usageRestrictions: null | string;
  wechatId: string;
}

export interface PortableValidationIssue {
  message: string;
  path: [keyof PortableDanceCardEditData];
}

export type PortableValidationResult =
  | { data: PortableDanceCardEditData; success: true }
  | { issues: PortableValidationIssue[]; success: false };

function countCharacters(value: string) {
  return Array.from(value).length;
}

function optionalText(value: null | string | undefined) {
  return value?.trim() || null;
}

function isRealCalendarDate(value: string) {
  const parts = value.split('-');
  if (parts.length !== 3) return false;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function getPortableShanghaiDate(now = new Date()) {
  const date = new Date(now.getTime() + SHANGHAI_OFFSET_MS);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function validatePortableDanceCardEdit(
  input: PortableDanceCardEditInput,
  now = new Date(),
): PortableValidationResult {
  const issues: PortableValidationIssue[] = [];
  const addIssue = (field: keyof PortableDanceCardEditData, message: string) => {
    issues.push({ message, path: [field] });
  };

  const sellerNickname = input.sellerNickname.trim();
  if (!sellerNickname) addIssue('sellerNickname', '卖家昵称必须填写');
  else if (countCharacters(sellerNickname) > 30) addIssue('sellerNickname', '卖家昵称最多30个字符');

  const wechatId = input.wechatId.trim();
  if (!wechatId) addIssue('wechatId', '微信号必须填写');
  else if (countCharacters(wechatId) > 50) addIssue('wechatId', '微信号最多50个字符');

  const remainingText = String(input.remainingCount).trim();
  const remainingCount = Number(remainingText);
  if (!remainingText || !Number.isFinite(remainingCount))
    addIssue('remainingCount', '剩余课时必须是数字');
  else if (!Number.isInteger(remainingCount)) addIssue('remainingCount', '剩余课时必须是整数');
  else if (remainingCount < 1) addIssue('remainingCount', '剩余课时不能少于1节');
  else if (remainingCount > 999) addIssue('remainingCount', '剩余课时不能超过999节');

  const priceText = String(input.pricePerClass).trim();
  const pricePerClass = Number(priceText);
  if (!priceText) addIssue('pricePerClass', '单节价格必须填写');
  else if (!Number.isFinite(pricePerClass)) addIssue('pricePerClass', '单节价格必须是数字');
  else if (pricePerClass <= 0) addIssue('pricePerClass', '单节价格必须大于0');
  else if (!Number.isInteger(Math.round(pricePerClass * 100_000_000) / 1_000_000))
    addIssue('pricePerClass', '单节价格最多保留两位小数');

  const expireDate = input.expireDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expireDate))
    addIssue('expireDate', '使用截止日期格式必须为YYYY-MM-DD');
  else if (!isRealCalendarDate(expireDate)) addIssue('expireDate', '使用截止日期不是有效日期');
  else if (expireDate < getPortableShanghaiDate(now))
    addIssue('expireDate', '使用截止日期不得早于今天');

  const danceTypes = input.danceTypes.slice();
  if (danceTypes.some((value) => !DANCE_TYPE_OPTIONS.includes(value)))
    addIssue('danceTypes', '包含不支持的舞种');
  if (danceTypes.some((value, index) => danceTypes.indexOf(value) !== index))
    addIssue('danceTypes', '可用舞种不能重复选择');

  const danceTypeOther = optionalText(input.danceTypeOther);
  const hasOther = danceTypes.includes(CUSTOM_DANCE_TYPE);
  if (input.danceScope === 'all' && (danceTypes.length > 0 || danceTypeOther !== null))
    addIssue('danceTypes', '全部舞种不能同时选择指定舞种');
  if (input.danceScope === 'specified' && danceTypes.length === 0)
    addIssue('danceTypes', '请至少选择一个指定舞种');
  if (input.danceScope === 'specified' && hasOther && danceTypeOther === null)
    addIssue('danceTypeOther', '选择其他后必须填写自定义舞种名称');
  if (!hasOther && danceTypeOther !== null)
    addIssue('danceTypeOther', '只有选择其他时才能填写自定义舞种名称');

  const usageRestrictions = optionalText(input.usageRestrictions);
  if (usageRestrictions !== null && countCharacters(usageRestrictions) > 200)
    addIssue('usageRestrictions', '使用限制最多200个字符');

  const description = optionalText(input.description);
  if (description !== null && countCharacters(description) > 500)
    addIssue('description', '备注最多500个字符');

  if (issues.length > 0) return { issues, success: false };

  return {
    data: {
      danceScope: input.danceScope,
      danceTypeOther,
      danceTypes,
      description,
      expireDate,
      pricePerClass,
      remainingCount,
      sellerNickname,
      usageRestrictions,
      wechatId,
    },
    success: true,
  };
}
