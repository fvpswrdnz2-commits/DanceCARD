import cloudbase from '@cloudbase/js-sdk';

export interface PublicCity {
  id: string;
  name: string;
}

export interface PublicDistrict {
  cityId: string;
  id: string;
  name: string;
}

export interface PublicStudio {
  districtId: string;
  id: string;
  name: string;
}

export interface PublicDanceCard {
  createdAt: string;
  danceScope: 'all' | 'specified';
  danceTypeOther: string | null;
  danceTypes: string[];
  description: string | null;
  expireDate: string;
  id: string;
  pricePerClass: string;
  remainingCount: number;
  sellerNickname: string;
  studioId: string;
  updatedAt: string;
  usageRestrictions: string | null;
}

export interface Page<T> {
  hasMore: boolean;
  items: T[];
  page: number;
  pageSize: number;
}

export interface DanceCardPublicApi {
  getCard(id: string): Promise<PublicDanceCard | null>;
  getContact(id: string): Promise<string>;
  listCards(studioId: string, page?: number): Promise<Page<PublicDanceCard>>;
  listCities(): Promise<PublicCity[]>;
  listDistricts(cityId: string): Promise<PublicDistrict[]>;
  listStudios(districtId: string): Promise<PublicStudio[]>;
}

export interface SellerProfile {
  defaultNickname: string | null;
  defaultWechatId: string | null;
  id: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
}

export interface SmsChallenge {
  expiresIn: number;
  phone: string;
  verify(code: string): Promise<SellerProfile>;
}

export interface DanceCardAuthApi {
  getProfile(): Promise<SellerProfile | null>;
  requestSmsCode(phone: string): Promise<SmsChallenge>;
  signOut(): Promise<void>;
}

export interface DanceCardCloudBaseClient {
  adminApi: DanceCardAdminApi;
  authApi: DanceCardAuthApi;
  publicApi: DanceCardPublicApi;
  sellerApi: DanceCardSellerApi;
}

export interface AdminCity extends PublicCity {
  sortOrder: number;
  status: 'active' | 'inactive';
}

export interface AdminDistrict extends PublicDistrict {
  sortOrder: number;
  status: 'active' | 'inactive';
}

export interface AdminStudio extends PublicStudio {
  address: string | null;
  status: 'active' | 'inactive';
}

export interface AdminUser extends SellerProfile {
  createdAt: string;
}

export interface AdminDanceCard extends SellerDanceCard {
  userId: string;
}

export interface AdminActionLog {
  action: string;
  actorUserId: string;
  createdAt: string;
  id: string;
  reason: string | null;
  targetId: string;
  targetType: string;
}

export interface DanceCardAdminApi {
  listCards(): Promise<AdminDanceCard[]>;
  listCities(): Promise<AdminCity[]>;
  listDistricts(): Promise<AdminDistrict[]>;
  listLogs(): Promise<AdminActionLog[]>;
  listStudios(): Promise<AdminStudio[]>;
  listUsers(): Promise<AdminUser[]>;
  moderateCard(id: string, action: 'delete' | 'hide', reason: string): Promise<void>;
  saveCity(input: Omit<AdminCity, 'id'> & { id?: string }): Promise<string>;
  saveDistrict(input: Omit<AdminDistrict, 'id'> & { id?: string }): Promise<string>;
  saveStudio(input: Omit<AdminStudio, 'id'> & { id?: string }): Promise<string>;
  setUserStatus(id: string, status: 'active' | 'disabled', reason: string): Promise<void>;
}

export interface DanceCardWriteInput {
  danceScope: 'all' | 'specified';
  danceTypeOther: string | null;
  danceTypes: string[];
  description: string | null;
  expireDate: string;
  pricePerClass: number;
  remainingCount: number;
  sellerNickname: string;
  studioId: string;
  usageRestrictions: string | null;
  wechatId: string;
}

export interface SellerDanceCard extends PublicDanceCard {
  deletedAt: string | null;
  hiddenReason: 'admin' | 'expired' | 'user' | null;
  studioName: string;
  visibility: 'active' | 'hidden';
  wechatId: string;
}

export interface DanceCardSellerApi {
  deleteCard(id: string): Promise<void>;
  getMineCard(id: string): Promise<SellerDanceCard | null>;
  listMine(): Promise<SellerDanceCard[]>;
  publishCard(input: DanceCardWriteInput): Promise<SellerDanceCard>;
  setCardHidden(id: string, hidden: boolean): Promise<SellerDanceCard>;
  updateCard(id: string, input: Omit<DanceCardWriteInput, 'studioId'>): Promise<SellerDanceCard>;
}

interface CloudBaseRow {
  [key: string]: unknown;
}

const PAGE_SIZE = 20;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function assertSuccess<T extends { data?: unknown; error?: { message?: string } }>(result: T) {
  if (result.error) {
    throw new Error(result.error.message || 'CloudBase request failed');
  }
  return result.data;
}

function rows(data: unknown): CloudBaseRow[] {
  return Array.isArray(data) ? (data as CloudBaseRow[]) : [];
}

function mapCard(row: CloudBaseRow): PublicDanceCard {
  return {
    createdAt: String(row.created_at),
    danceScope: row.dance_scope === 'all' ? 'all' : 'specified',
    danceTypeOther: row.dance_type_other ? String(row.dance_type_other) : null,
    danceTypes: Array.isArray(row.dance_types) ? row.dance_types.map(String) : [],
    description: row.description ? String(row.description) : null,
    expireDate: String(row.expire_date),
    id: String(row.id),
    pricePerClass: String(row.price_per_class),
    remainingCount: Number(row.remaining_count),
    sellerNickname: String(row.seller_nickname),
    studioId: String(row.studio_id),
    updatedAt: String(row.updated_at),
    usageRestrictions: row.usage_restrictions ? String(row.usage_restrictions) : null,
  };
}

function mapSellerCard(row: CloudBaseRow, studioName = '舞室已停用'): SellerDanceCard {
  return {
    ...mapCard(row),
    deletedAt: row.deleted_at ? String(row.deleted_at) : null,
    hiddenReason:
      row.hidden_reason === 'admin' ||
      row.hidden_reason === 'expired' ||
      row.hidden_reason === 'user'
        ? row.hidden_reason
        : null,
    studioName,
    visibility: row.visibility === 'hidden' ? 'hidden' : 'active',
    wechatId: String(row.wechat_id),
  };
}

type CloudBaseApp = ReturnType<typeof cloudbase.init>;

function createPublicApi(app: CloudBaseApp): DanceCardPublicApi {
  const database = app.rdb();
  let guestSession: Promise<void> | null = null;

  const ensureGuestSession = () => {
    guestSession ??= (async () => {
      const session = await app.auth.getSession();
      if (session.data?.session) return;
      const { error } = await app.auth.signInAnonymously();
      if (error) throw new Error(error.message || '游客会话建立失败');
    })().finally(() => {
      guestSession = null;
    });
    return guestSession;
  };

  return {
    async listCities() {
      await ensureGuestSession();
      const data = assertSuccess(
        await database
          .from('cities')
          .select('id,name')
          .eq('status', 'active')
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
      );
      return rows(data).map((row) => ({ id: String(row.id), name: String(row.name) }));
    },

    async listDistricts(cityId) {
      if (!isUuid(cityId)) return [];
      await ensureGuestSession();
      const data = assertSuccess(
        await database
          .from('districts')
          .select('id,city_id,name')
          .eq('city_id', cityId)
          .eq('status', 'active')
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
      );
      return rows(data).map((row) => ({
        cityId: String(row.city_id),
        id: String(row.id),
        name: String(row.name),
      }));
    },

    async listStudios(districtId) {
      if (!isUuid(districtId)) return [];
      await ensureGuestSession();
      const data = assertSuccess(
        await database
          .from('studios')
          .select('id,district_id,name')
          .eq('district_id', districtId)
          .eq('status', 'active')
          .order('name', { ascending: true }),
      );
      return rows(data).map((row) => ({
        districtId: String(row.district_id),
        id: String(row.id),
        name: String(row.name),
      }));
    },

    async listCards(studioId, page = 1) {
      if (!isUuid(studioId)) {
        return { hasMore: false, items: [], page, pageSize: PAGE_SIZE };
      }
      await ensureGuestSession();
      const start = Math.max(0, page - 1) * PAGE_SIZE;
      const data = assertSuccess(
        await database
          .from('public_dance_cards')
          .select('*')
          .eq('studio_id', studioId)
          .order('price_per_class', { ascending: true })
          .order('created_at', { ascending: false })
          .order('id', { ascending: true })
          .range(start, start + PAGE_SIZE),
      );
      const resultRows = rows(data);
      return {
        hasMore: resultRows.length > PAGE_SIZE,
        items: resultRows.slice(0, PAGE_SIZE).map(mapCard),
        page,
        pageSize: PAGE_SIZE,
      };
    },

    async getCard(id) {
      if (!isUuid(id)) return null;
      await ensureGuestSession();
      const data = assertSuccess(
        await database.from('public_dance_cards').select('*').eq('id', id).limit(1),
      );
      const row = rows(data)[0];
      return row ? mapCard(row) : null;
    },

    async getContact(id) {
      if (!isUuid(id)) throw new Error('该次卡当前无法联系');
      await ensureGuestSession();
      const data = assertSuccess(await database.rpc('get_dance_card_contact', { card_id: id }));
      const first = Array.isArray(data) ? data[0] : data;
      const value = typeof first === 'object' && first !== null ? Object.values(first)[0] : first;
      if (!value) throw new Error('该次卡当前无法联系');
      return String(value);
    },
  };
}

function normalizePhone(phone: string) {
  const localPhone = phone.replace(/[\s-]/g, '').replace(/^\+?86/, '');
  if (!/^1[3-9]\d{9}$/.test(localPhone)) throw new Error('请输入正确的中国大陆手机号');
  return `+86${localPhone}`;
}

function createAuthApi(app: CloudBaseApp): DanceCardAuthApi {
  const database = app.rdb();

  const loadBusinessProfile = async (): Promise<SellerProfile> => {
    const data = assertSuccess(await database.rpc('get_or_create_current_business_profile'));
    const row = rows(data)[0];
    if (!row) throw new Error('无法读取 DanceCARD 用户资料');
    return {
      defaultNickname: row.default_nickname ? String(row.default_nickname) : null,
      defaultWechatId: row.default_wechat_id ? String(row.default_wechat_id) : null,
      id: String(row.id),
      role: row.role === 'admin' ? 'admin' : 'user',
      status: row.status === 'disabled' ? 'disabled' : 'active',
    };
  };

  return {
    async getProfile() {
      const { data, error } = await app.auth.getSession();
      if (error || !data?.user || data.user.is_anonymous) return null;
      const profile = await loadBusinessProfile();
      if (profile.status === 'disabled') {
        await app.auth.signOut();
        return null;
      }
      return profile;
    },

    async requestSmsCode(phone) {
      const normalizedPhone = normalizePhone(phone);
      const { data, error } = await app.auth.signInWithOtp({
        phone: normalizedPhone,
        options: { shouldCreateUser: true },
      });
      if (error || !data) throw new Error(error?.message || '验证码发送失败，请稍后重试');
      return {
        expiresIn: Number(data.expiresIn || 600),
        phone: normalizedPhone,
        async verify(code) {
          if (!/^\d{6}$/.test(code)) throw new Error('请输入 6 位短信验证码');
          const { error: verifyError } = await data.verifyOtp({ token: code });
          if (verifyError) throw new Error(verifyError.message || '验证码无效或已过期');
          const profile = await loadBusinessProfile();
          if (profile.status === 'disabled') {
            await app.auth.signOut();
            throw new Error('该账号已被停用');
          }
          return profile;
        },
      };
    },

    async signOut() {
      await app.auth.signOut();
    },
  };
}

function createSellerApi(app: CloudBaseApp): DanceCardSellerApi {
  const database = app.rdb();

  const currentBusinessUserId = async () => {
    const profile = assertSuccess(await database.rpc('get_or_create_current_business_profile'));
    const userId = rows(profile)[0]?.id;
    if (!userId) throw new Error('无法读取 DanceCARD 用户资料');
    return String(userId);
  };

  const studioNames = async (studioIds: string[]) => {
    const uniqueIds = [...new Set(studioIds)];
    if (uniqueIds.length === 0) return new Map<string, string>();
    const data = assertSuccess(
      await database.from('studios').select('id,name').in('id', uniqueIds),
    );
    return new Map(rows(data).map((row) => [String(row.id), String(row.name)]));
  };

  const requireOwnedCard = async (id: string) => {
    if (!isUuid(id)) throw new Error('次卡链接无效');
    const ownerId = await currentBusinessUserId();
    const data = assertSuccess(
      await database.from('dance_cards').select('*').eq('id', id).eq('user_id', ownerId).limit(1),
    );
    const row = rows(data)[0];
    if (!row) throw new Error('次卡不存在或你无权操作');
    const names = await studioNames([String(row.studio_id)]);
    return mapSellerCard(row, names.get(String(row.studio_id)) || '舞室已停用');
  };

  const writePayload = (input: Omit<DanceCardWriteInput, 'studioId'>) => ({
    dance_scope: input.danceScope,
    dance_type_other: input.danceTypeOther,
    dance_types: input.danceTypes.filter((item) => item !== 'other'),
    description: input.description,
    expire_date: input.expireDate,
    price_per_class: input.pricePerClass,
    remaining_count: input.remainingCount,
    seller_nickname: input.sellerNickname,
    usage_restrictions: input.usageRestrictions,
    wechat_id: input.wechatId,
  });

  return {
    async deleteCard(id) {
      const current = await requireOwnedCard(id);
      const { error } = await database
        .from('dance_cards')
        .update({
          deleted_at: new Date().toISOString(),
          hidden_reason:
            current.hiddenReason === 'admin' || current.hiddenReason === 'expired'
              ? current.hiddenReason
              : 'user',
          visibility: 'hidden',
        })
        .eq('id', id);
      if (error) throw new Error(error.message || '删除失败，请稍后重试');
    },

    async getMineCard(id) {
      if (!isUuid(id)) return null;
      try {
        return await requireOwnedCard(id);
      } catch {
        return null;
      }
    },

    async listMine() {
      const ownerId = await currentBusinessUserId();
      const data = assertSuccess(
        await database
          .from('dance_cards')
          .select('*')
          .eq('user_id', ownerId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
      );
      const cardRows = rows(data);
      const names = await studioNames(cardRows.map((row) => String(row.studio_id)));
      return cardRows.map((row) =>
        mapSellerCard(row, names.get(String(row.studio_id)) || '舞室已停用'),
      );
    },

    async publishCard(input) {
      const storedDanceTypes = input.danceTypes.filter((item) => item !== 'other');
      const published = assertSuccess(
        await database.rpc('publish_dance_card_row', {
          dance_scope_value: input.danceScope,
          dance_type_other_value: input.danceTypeOther,
          dance_types_value: storedDanceTypes,
          description_value: input.description,
          expire_date_value: input.expireDate,
          price_per_class_value: input.pricePerClass,
          remaining_count_value: input.remainingCount,
          seller_nickname_value: input.sellerNickname,
          studio_id_value: input.studioId,
          usage_restrictions_value: input.usageRestrictions,
          wechat_id_value: input.wechatId,
        }),
      );
      const cardId = rows(published)[0]?.id;
      if (!cardId) throw new Error('次卡发布失败，请稍后重试');
      return requireOwnedCard(String(cardId));
    },

    async setCardHidden(id, hidden) {
      const current = await requireOwnedCard(id);
      if (!hidden && current.hiddenReason && current.hiddenReason !== 'user') {
        throw new Error(
          current.hiddenReason === 'expired'
            ? '已过期次卡不能恢复展示'
            : '管理员隐藏的次卡不能自行恢复',
        );
      }
      const updated = assertSuccess(
        await database
          .from('dance_cards')
          .update({
            hidden_reason: hidden ? 'user' : null,
            visibility: hidden ? 'hidden' : 'active',
          })
          .eq('id', id)
          .select('*')
          .limit(1),
      );
      const row = rows(updated)[0];
      if (!row) throw new Error('状态更新失败，请稍后重试');
      return mapSellerCard(row, current.studioName);
    },

    async updateCard(id, input) {
      const current = await requireOwnedCard(id);
      const updated = assertSuccess(
        await database
          .from('dance_cards')
          .update(writePayload(input))
          .eq('id', id)
          .select('*')
          .limit(1),
      );
      const row = rows(updated)[0];
      if (!row) throw new Error('次卡更新失败，请稍后重试');
      return mapSellerCard(row, current.studioName);
    },
  };
}

function rpcRowId(value: unknown, failureMessage: string) {
  const id = rows(value)[0]?.id;
  if (!id) throw new Error(failureMessage);
  return String(id);
}

function createAdminApi(app: CloudBaseApp): DanceCardAdminApi {
  const database = app.rdb();

  return {
    async listCards() {
      const data = assertSuccess(
        await database.from('dance_cards').select('*').order('created_at', { ascending: false }),
      );
      return rows(data).map((row) => ({
        ...mapSellerCard(row),
        userId: String(row.user_id),
      }));
    },

    async listCities() {
      const data = assertSuccess(
        await database
          .from('cities')
          .select('id,name,status,sort_order')
          .order('sort_order', { ascending: true }),
      );
      return rows(data).map((row) => ({
        id: String(row.id),
        name: String(row.name),
        sortOrder: Number(row.sort_order),
        status: row.status === 'inactive' ? 'inactive' : 'active',
      }));
    },

    async listDistricts() {
      const data = assertSuccess(
        await database
          .from('districts')
          .select('id,city_id,name,status,sort_order')
          .order('sort_order', { ascending: true }),
      );
      return rows(data).map((row) => ({
        cityId: String(row.city_id),
        id: String(row.id),
        name: String(row.name),
        sortOrder: Number(row.sort_order),
        status: row.status === 'inactive' ? 'inactive' : 'active',
      }));
    },

    async listLogs() {
      const data = assertSuccess(
        await database
          .from('admin_action_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500),
      );
      return rows(data).map((row) => ({
        action: String(row.action),
        actorUserId: String(row.actor_user_id),
        createdAt: String(row.created_at),
        id: String(row.id),
        reason: row.reason ? String(row.reason) : null,
        targetId: String(row.target_id),
        targetType: String(row.target_type),
      }));
    },

    async listStudios() {
      const data = assertSuccess(
        await database.from('studios').select('id,district_id,name,address,status').order('name'),
      );
      return rows(data).map((row) => ({
        address: row.address ? String(row.address) : null,
        districtId: String(row.district_id),
        id: String(row.id),
        name: String(row.name),
        status: row.status === 'inactive' ? 'inactive' : 'active',
      }));
    },

    async listUsers() {
      const data = assertSuccess(
        await database.from('users').select('*').order('created_at', { ascending: false }),
      );
      return rows(data).map((row) => ({
        createdAt: String(row.created_at),
        defaultNickname: row.default_nickname ? String(row.default_nickname) : null,
        defaultWechatId: row.default_wechat_id ? String(row.default_wechat_id) : null,
        id: String(row.id),
        role: row.role === 'admin' ? 'admin' : 'user',
        status: row.status === 'disabled' ? 'disabled' : 'active',
      }));
    },

    async moderateCard(id, action, reason) {
      assertSuccess(
        await database.rpc('admin_moderate_dance_card_row', {
          action_value: action,
          card_id_value: id,
          reason_value: reason,
        }),
      );
    },

    async saveCity(input) {
      return rpcRowId(
        assertSuccess(
          await database.rpc('admin_save_city_row', {
            city_id_value: input.id || null,
            name_value: input.name,
            sort_order_value: input.sortOrder,
            status_value: input.status,
          }),
        ),
        '城市保存失败',
      );
    },

    async saveDistrict(input) {
      return rpcRowId(
        assertSuccess(
          await database.rpc('admin_save_district_row', {
            city_id_value: input.cityId,
            district_id_value: input.id || null,
            name_value: input.name,
            sort_order_value: input.sortOrder,
            status_value: input.status,
          }),
        ),
        '行政区保存失败',
      );
    },

    async saveStudio(input) {
      return rpcRowId(
        assertSuccess(
          await database.rpc('admin_save_studio_row', {
            address_value: input.address || '',
            district_id_value: input.districtId,
            name_value: input.name,
            status_value: input.status,
            studio_id_value: input.id || null,
          }),
        ),
        '舞室保存失败',
      );
    },

    async setUserStatus(id, status, reason) {
      assertSuccess(
        await database.rpc('admin_set_user_status_row', {
          reason_value: reason,
          status_value: status,
          user_id_value: id,
        }),
      );
    },
  };
}

export function createCloudBaseClient(environmentId: string): DanceCardCloudBaseClient {
  const app = cloudbase.init({ env: environmentId, region: 'ap-shanghai' });
  return {
    adminApi: createAdminApi(app),
    authApi: createAuthApi(app),
    publicApi: createPublicApi(app),
    sellerApi: createSellerApi(app),
  };
}

export function createCloudBasePublicApi(environmentId: string): DanceCardPublicApi {
  return createCloudBaseClient(environmentId).publicApi;
}
