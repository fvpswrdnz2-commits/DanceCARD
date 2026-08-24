import type { IsoDateTime, UserId, UserIdentityId } from './primitives';

export const AUTH_PROVIDERS = ['phone', 'wechat'] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
  id: UserId;
  defaultNickname: string | null;
  defaultWechatId: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface UserIdentity {
  id: UserIdentityId;
  userId: UserId;
  provider: AuthProvider;
  subject: string;
  createdAt: IsoDateTime;
}
