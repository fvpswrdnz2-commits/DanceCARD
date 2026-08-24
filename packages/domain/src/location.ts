import type { CityId, DistrictId, IsoDateTime, StudioId, UserId } from './primitives';

export const ENTITY_STATUSES = ['active', 'inactive'] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

export interface City {
  id: CityId;
  name: string;
  status: EntityStatus;
  sortOrder: number;
}

export interface District {
  id: DistrictId;
  cityId: CityId;
  name: string;
  status: EntityStatus;
  sortOrder: number;
}

export interface Studio {
  id: StudioId;
  districtId: DistrictId;
  name: string;
  normalizedName: string;
  address: string | null;
  status: EntityStatus;
  createdBy: UserId;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}
