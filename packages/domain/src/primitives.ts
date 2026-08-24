declare const brand: unique symbol;

export type Brand<Value, Name extends string> = Value & {
  readonly [brand]: Name;
};

export type UserId = Brand<string, 'UserId'>;
export type UserIdentityId = Brand<string, 'UserIdentityId'>;
export type CityId = Brand<string, 'CityId'>;
export type DistrictId = Brand<string, 'DistrictId'>;
export type StudioId = Brand<string, 'StudioId'>;
export type DanceCardId = Brand<string, 'DanceCardId'>;
export type AdminActionLogId = Brand<string, 'AdminActionLogId'>;
export type IsoDate = Brand<string, 'IsoDate'>;
export type IsoDateTime = Brand<string, 'IsoDateTime'>;
export type CnyAmount = Brand<number, 'CnyAmount'>;

export type NonEmptyReadonlyArray<Value> = readonly [Value, ...Value[]];
