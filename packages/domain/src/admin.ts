import type { AdminActionLogId, IsoDateTime, UserId } from './primitives';

export const ADMIN_TARGET_TYPES = ['user', 'city', 'district', 'studio', 'dance_card'] as const;
export type AdminTargetType = (typeof ADMIN_TARGET_TYPES)[number];

export const ADMIN_ACTIONS = [
  'create',
  'update',
  'activate',
  'deactivate',
  'hide',
  'restore',
  'delete',
  'disable_user',
  'restore_user',
  'change_role',
] as const;
export type AdminAction = (typeof ADMIN_ACTIONS)[number];

export interface AdminActionLog {
  id: AdminActionLogId;
  actorUserId: UserId;
  targetType: AdminTargetType;
  targetId: string;
  action: AdminAction;
  reason: string | null;
  createdAt: IsoDateTime;
}
