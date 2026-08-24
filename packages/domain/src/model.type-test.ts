import type {
  CnyAmount,
  DanceCard,
  DanceCardId,
  DanceCardPublicationState,
  DanceSelection,
  IsoDate,
  IsoDateTime,
  StudioId,
  User,
  UserId,
  UserIdentity,
  UserIdentityId,
} from './index';

const userId = 'user-1' as UserId;
const now = '2026-08-21T12:00:00+08:00' as IsoDateTime;

export const validUser: User = {
  id: userId,
  defaultNickname: null,
  defaultWechatId: null,
  role: 'user',
  status: 'active',
  createdAt: now,
  updatedAt: now,
};

export const validPhoneIdentity: UserIdentity = {
  id: 'identity-1' as UserIdentityId,
  userId,
  provider: 'phone',
  subject: '+8613800000000',
  createdAt: now,
};

export const validDanceCard: DanceCard = {
  id: 'card-1' as DanceCardId,
  userId,
  studioId: 'studio-1' as StudioId,
  sellerNickname: 'Alice',
  wechatId: 'alice-wechat',
  remainingCount: 10,
  pricePerClass: 60 as CnyAmount,
  expireDate: '2026-12-31' as IsoDate,
  danceScope: 'specified',
  danceTypes: ['jazz'],
  danceTypeOther: null,
  usageRestrictions: null,
  description: null,
  visibility: 'active',
  hiddenReason: null,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
};

const invalidActiveState: DanceCardPublicationState = {
  visibility: 'active',
  // @ts-expect-error Active cards cannot carry a hidden reason.
  hiddenReason: 'user',
  deletedAt: null,
};

// @ts-expect-error Hidden cards must explain why they are hidden.
const invalidHiddenState: DanceCardPublicationState = {
  visibility: 'hidden',
  hiddenReason: null,
  deletedAt: null,
};

const invalidAllDanceSelection: DanceSelection = {
  danceScope: 'all',
  // @ts-expect-error All-dance cards cannot also select a specific dance type.
  danceTypes: ['jazz'],
  danceTypeOther: null,
};

// @ts-expect-error A specified selection must include a preset or a custom dance type.
const invalidEmptySpecifiedSelection: DanceSelection = {
  danceScope: 'specified',
  danceTypes: [],
  danceTypeOther: null,
};

void invalidActiveState;
void invalidHiddenState;
void invalidAllDanceSelection;
void invalidEmptySpecifiedSelection;
