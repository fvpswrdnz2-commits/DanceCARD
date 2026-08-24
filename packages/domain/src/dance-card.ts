import type {
  CnyAmount,
  DanceCardId,
  IsoDate,
  IsoDateTime,
  NonEmptyReadonlyArray,
  StudioId,
  UserId,
} from './primitives';

export const PRESET_DANCE_TYPES = [
  'hip-hop',
  'jazz',
  'locking',
  'popping',
  'house',
  'waacking',
  'k-pop',
] as const;
export type PresetDanceType = (typeof PRESET_DANCE_TYPES)[number];

export const HIDDEN_REASONS = ['user', 'expired', 'admin'] as const;
export type HiddenReason = (typeof HIDDEN_REASONS)[number];

export type DanceSelection =
  | {
      danceScope: 'all';
      danceTypes: readonly [];
      danceTypeOther: null;
    }
  | {
      danceScope: 'specified';
      danceTypes: NonEmptyReadonlyArray<PresetDanceType>;
      danceTypeOther: null;
    }
  | {
      danceScope: 'specified';
      danceTypes: readonly PresetDanceType[];
      danceTypeOther: string;
    };

export type DanceCardPublicationState =
  | {
      visibility: 'active';
      hiddenReason: null;
      deletedAt: null;
    }
  | {
      visibility: 'hidden';
      hiddenReason: HiddenReason;
      deletedAt: null;
    }
  | {
      visibility: 'hidden';
      hiddenReason: HiddenReason;
      deletedAt: IsoDateTime;
    };

interface DanceCardBase {
  id: DanceCardId;
  userId: UserId;
  studioId: StudioId;
  sellerNickname: string;
  wechatId: string;
  remainingCount: number;
  pricePerClass: CnyAmount;
  expireDate: IsoDate;
  usageRestrictions: string | null;
  description: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export type DanceCard = DanceCardBase & DanceSelection & DanceCardPublicationState;
