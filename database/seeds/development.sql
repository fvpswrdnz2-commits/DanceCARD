-- DanceCARD development seed. Idempotent by stable IDs and normalized unique keys.
-- Administrative districts verified against current Beijing and Shanghai government lists.
-- Beijing studios: https://main.jiahewushe.com/branch/ (checked 2026-08-22).
-- Shanghai active studios:
--   https://huodong.com/venue/detail/eyecv (checked 2026-08-22)
--   https://dianhua.mapbar.com/MAPIHBHNQEJESRSWHNXNC.html (updated 2026-03-06)
-- Shanghai studios without a current operational confirmation are stored inactive.

insert into public.users (id, default_nickname, default_wechat_id, role, status)
values
  ('00000000-0000-4000-8000-000000000001', '开发管理员', 'dancecard-dev-admin', 'admin', 'active'),
  ('00000000-0000-4000-8000-000000000002', '小舞', 'dancecard-dev-user', 'user', 'active'),
  ('00000000-0000-4000-8000-000000000003', '停用用户', 'dancecard-disabled', 'user', 'disabled')
on conflict (id) do update set
  default_nickname = excluded.default_nickname,
  default_wechat_id = excluded.default_wechat_id,
  role = excluded.role,
  status = excluded.status;

insert into public.user_identities (user_id, provider, subject)
values
  ('00000000-0000-4000-8000-000000000001', 'phone', 'dev-admin-subject'),
  ('00000000-0000-4000-8000-000000000002', 'phone', 'dev-user-subject'),
  ('00000000-0000-4000-8000-000000000003', 'phone', 'dev-disabled-subject')
on conflict (provider, subject) do update set user_id = excluded.user_id;

insert into public.cities (name, status, sort_order)
values ('北京', 'active', 10), ('上海', 'active', 20)
on conflict (normalized_name) do update set status = excluded.status, sort_order = excluded.sort_order;

insert into public.districts (city_id, name, status, sort_order)
select city.id, district.name, 'active', district.sort_order
from public.cities as city
cross join (values
  ('东城区', 10), ('西城区', 20), ('朝阳区', 30), ('海淀区', 40),
  ('丰台区', 50), ('石景山区', 60), ('门头沟区', 70), ('房山区', 80),
  ('通州区', 90), ('顺义区', 100), ('昌平区', 110), ('大兴区', 120),
  ('怀柔区', 130), ('平谷区', 140), ('密云区', 150), ('延庆区', 160)
) as district(name, sort_order)
where city.normalized_name = '北京'
on conflict (city_id, normalized_name) do update set status = excluded.status, sort_order = excluded.sort_order;

insert into public.districts (city_id, name, status, sort_order)
select city.id, district.name, 'active', district.sort_order
from public.cities as city
cross join (values
  ('浦东新区', 10), ('黄浦区', 20), ('静安区', 30), ('徐汇区', 40),
  ('长宁区', 50), ('普陀区', 60), ('虹口区', 70), ('杨浦区', 80),
  ('宝山区', 90), ('闵行区', 100), ('嘉定区', 110), ('金山区', 120),
  ('松江区', 130), ('青浦区', 140), ('奉贤区', 150), ('崇明区', 160)
) as district(name, sort_order)
where city.normalized_name = '上海'
on conflict (city_id, normalized_name) do update set status = excluded.status, sort_order = excluded.sort_order;

insert into public.studios (district_id, name, address, status, created_by)
select district.id, studio.name, studio.address, 'active', '00000000-0000-4000-8000-000000000001'
from public.districts as district
join public.cities as city on city.id = district.city_id
join (values
  ('东城区', '嘉禾舞社北京雍和宫店', '北京市东城区安定门东大街28号雍和大厦D座502'),
  ('西城区', '嘉禾舞社北京广安门店', '北京市西城区广安门外大街168号朗琴国际B座912'),
  ('朝阳区', '嘉禾舞社北京国贸店', '北京市朝阳区东三环中路39号建外SOHO东区B座18层1802'),
  ('朝阳区', '嘉禾舞社北京望京店', '北京市朝阳区望京悠乐汇C座商业2层'),
  ('朝阳区', '嘉禾舞社北京长楹店', '北京市朝阳区龙湖长楹天街商业步行街东区F区102'),
  ('朝阳区', '嘉禾舞社专业班（北京平房桥店）', '北京市朝阳区平房路48号小狼国际院内'),
  ('海淀区', '嘉禾舞社北京紫竹桥店', '北京市海淀区紫竹院路31号华澳中心嘉慧苑东侧B2'),
  ('海淀区', '嘉禾舞社北京西二旗店', '北京市海淀区上地街道辉煌国际西6号楼320室'),
  ('海淀区', '嘉禾舞社北京中关村店', '北京市海淀区中关村大街19号新中关购物中心B座南翼12层1208'),
  ('丰台区', '嘉禾舞社北京马家堡店', '北京市丰台区搜宝商务中心底商B1层202'),
  ('通州区', '嘉禾舞社北京通州店', '北京市通州区新华西街58号万达广场C座703')
) as studio(district_name, name, address) on studio.district_name = district.name
where city.normalized_name = '北京'
on conflict (district_id, normalized_name) do update set
  name = excluded.name, address = excluded.address, status = excluded.status, updated_at = now();

insert into public.studios (district_id, name, address, status, created_by)
select district.id, studio.name, studio.address, studio.status, '00000000-0000-4000-8000-000000000001'
from public.districts as district
join public.cities as city on city.id = district.city_id
join (values
  ('静安区', 'CASTER舞蹈教室（上海大悦城南座店）', '上海市静安区西藏北路166号大悦城南座5层501', 'active'),
  ('闵行区', 'CASTER舞蹈教室（海梦一方店）', '上海市闵行区莲花南路1389号海梦一方L3-04', 'active'),
  ('虹口区', 'CASTER舞蹈教室（瑞虹天地月亮湾店）', '上海市虹口区瑞虹路188号瑞虹天地月亮湾LG层B116B', 'inactive'),
  ('虹口区', 'CASTER舞蹈教室（虹口足球场店）', '上海市虹口区东江湾路444号虹口足球场2区C座', 'inactive')
) as studio(district_name, name, address, status) on studio.district_name = district.name
where city.normalized_name = '上海'
on conflict (district_id, normalized_name) do update set
  name = excluded.name, address = excluded.address, status = excluded.status, updated_at = now();

insert into public.dance_cards (
  id, user_id, studio_id, seller_nickname, wechat_id, remaining_count,
  price_per_class, expire_date, dance_scope, dance_types, dance_type_other,
  usage_restrictions, description, visibility, hidden_reason, created_at
)
select
  sample.id::uuid,
  sample.user_id::uuid,
  studio.id,
  sample.seller_nickname,
  sample.wechat_id,
  sample.remaining_count,
  sample.price_per_class,
  (now() at time zone 'Asia/Shanghai')::date + sample.expire_offset,
  sample.dance_scope,
  sample.dance_types,
  sample.dance_type_other,
  sample.usage_restrictions,
  sample.description,
  sample.visibility,
  sample.hidden_reason,
  now() - sample.created_offset
from public.studios as studio
join (values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'CASTER舞蹈教室（上海大悦城南座店）', '小舞', 'dancecard-dev-user', 8, 45.00::numeric, 90, 'all', array[]::text[], null::varchar, null::varchar, '出差前用不完，可联系详聊。'::varchar, 'active', null::varchar, interval '4 hours'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'CASTER舞蹈教室（上海大悦城南座店）', '阿新', 'dancecard-dev-admin', 10, 60.00::numeric, 60, 'specified', array['jazz']::text[], null::varchar, '工作日可用'::varchar, null::varchar, 'active', null::varchar, interval '1 hour'),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'CASTER舞蹈教室（上海大悦城南座店）', '阿新', 'dancecard-dev-admin', 5, 60.00::numeric, 45, 'specified', array['hip-hop', 'house']::text[], null::varchar, null::varchar, null::varchar, 'active', null::varchar, interval '2 hours'),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', 'CASTER舞蹈教室（上海大悦城南座店）', '小舞', 'dancecard-dev-user', 3, 39.00::numeric, 30, 'specified', array[]::text[], 'Heels'::varchar, null::varchar, '手动隐藏样例'::varchar, 'hidden', 'user'::varchar, interval '3 hours'),
  ('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000002', 'CASTER舞蹈教室（上海大悦城南座店）', '小舞', 'dancecard-dev-user', 2, 35.00::numeric, -1, 'all', array[]::text[], null::varchar, null::varchar, '过期样例'::varchar, 'hidden', 'expired'::varchar, interval '5 hours'),
  ('10000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000003', 'CASTER舞蹈教室（上海大悦城南座店）', '停用用户', 'dancecard-disabled', 6, 30.00::numeric, 100, 'all', array[]::text[], null::varchar, null::varchar, '用户被停用，不得公开'::varchar, 'active', null::varchar, interval '6 hours')
) as sample(
  id, user_id, studio_name, seller_nickname, wechat_id, remaining_count,
  price_per_class, expire_offset, dance_scope, dance_types, dance_type_other,
  usage_restrictions, description, visibility, hidden_reason, created_offset
) on sample.studio_name = studio.name
on conflict (id) do update set
  seller_nickname = excluded.seller_nickname,
  wechat_id = excluded.wechat_id,
  remaining_count = excluded.remaining_count,
  price_per_class = excluded.price_per_class,
  expire_date = excluded.expire_date,
  dance_scope = excluded.dance_scope,
  dance_types = excluded.dance_types,
  dance_type_other = excluded.dance_type_other,
  usage_restrictions = excluded.usage_restrictions,
  description = excluded.description,
  visibility = excluded.visibility,
  hidden_reason = excluded.hidden_reason,
  deleted_at = null,
  updated_at = now();
