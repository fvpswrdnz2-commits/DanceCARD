-- Structural rollback for DanceCARD 2.0.
-- Consolidated studios are retained and placed in one city-wide district per city.

drop policy if exists studios_public_read on public.studios;
drop policy if exists dance_cards_owner_insert on public.dance_cards;

drop function if exists public.admin_save_studio_row(uuid, uuid, text, text, text);
drop function if exists public.admin_save_studio(uuid, uuid, text, text, text);

create table public.districts (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  name varchar(80) not null,
  normalized_name varchar(80) generated always as (lower(btrim(name))) stored,
  status varchar(16) not null default 'active' check (status in ('active', 'inactive')),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(btrim(name)) between 1 and 80),
  unique (city_id, normalized_name)
);

create trigger districts_touch_updated_at
before update on public.districts
for each row execute function public.touch_updated_at();

insert into public.districts (city_id, name, status, sort_order)
select city.id, '全市', city.status, 0
from public.cities as city;

alter table public.studios
  add column district_id uuid references public.districts(id) on delete restrict,
  add column address varchar(300);

update public.studios as studio
set district_id = district.id,
    address = left(studio.branch_info, 300)
from public.districts as district
where district.city_id = studio.city_id;

alter table public.studios alter column district_id set not null;

create or replace function public.is_dance_card_public(
  owner_id uuid,
  location_id uuid,
  card_visibility text,
  card_hidden_reason text,
  card_deleted_at timestamptz,
  card_expire_date date
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    card_visibility = 'active'
    and card_hidden_reason is null
    and card_deleted_at is null
    and card_expire_date >= (now() at time zone 'Asia/Shanghai')::date
    and exists (
      select 1 from public.users as app_user
      where app_user.id = owner_id and app_user.status = 'active'
    )
    and exists (
      select 1
      from public.studios as studio
      join public.districts as district on district.id = studio.district_id
      join public.cities as city on city.id = district.city_id
      where studio.id = location_id
        and studio.status = 'active'
        and district.status = 'active'
        and city.status = 'active'
    )
$$;

drop index if exists public.studios_city_public_order_idx;

alter table public.studios
  drop constraint if exists studios_city_id_normalized_name_key;

alter table public.studios
  add constraint studios_district_id_normalized_name_key unique (district_id, normalized_name);

alter table public.studios
  drop column city_id,
  drop column branch_info;

create index districts_city_public_order_idx
on public.districts (city_id, status, sort_order, name, id);

create index studios_district_public_order_idx
on public.studios (district_id, status, name, id);

alter table public.districts enable row level security;

grant select, insert, update, delete on public.districts to authenticated;
grant select on public.districts to anon;

create policy districts_public_read on public.districts
for select to anon, authenticated
using (
  status = 'active'
  and exists (select 1 from public.cities as city where city.id = city_id and city.status = 'active')
);

create policy districts_admin_read on public.districts
for select to authenticated
using (public.is_current_user_admin());

create policy districts_admin_write on public.districts
for all to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create policy studios_public_read on public.studios
for select to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1
    from public.districts as district
    join public.cities as city on city.id = district.city_id
    where district.id = district_id
      and district.status = 'active'
      and city.status = 'active'
  )
);

create policy dance_cards_owner_insert on public.dance_cards
for insert to authenticated
with check (
  user_id = public.current_business_user_id()
  and visibility = 'active'
  and hidden_reason is null
  and deleted_at is null
  and expire_date >= (now() at time zone 'Asia/Shanghai')::date
  and exists (
    select 1 from public.users as app_user
    where app_user.id = public.current_business_user_id()
      and app_user.status = 'active'
  )
  and exists (
    select 1
    from public.studios as studio
    join public.districts as district on district.id = studio.district_id
    join public.cities as city on city.id = district.city_id
    where studio.id = studio_id
      and studio.status = 'active'
      and district.status = 'active'
      and city.status = 'active'
  )
);

create or replace function public.admin_save_district(
  district_id_value uuid,
  city_id_value uuid,
  name_value text,
  status_value text,
  sort_order_value integer
)
returns uuid
language plpgsql
set search_path = public, auth, pg_temp
as $$
declare saved_id uuid;
begin
  if not public.is_current_user_admin() then
    raise exception 'administrator_required' using errcode = '42501';
  end if;
  if district_id_value is null then
    insert into public.districts (city_id, name, status, sort_order)
    values (city_id_value, btrim(name_value), status_value, sort_order_value)
    returning id into saved_id;
    perform public.record_admin_action('district', saved_id::text, 'create', null);
  else
    update public.districts
    set city_id = city_id_value,
        name = btrim(name_value),
        status = status_value,
        sort_order = sort_order_value
    where id = district_id_value returning id into saved_id;
    if saved_id is null then raise exception 'district_not_found'; end if;
    perform public.record_admin_action('district', saved_id::text, 'update', null);
  end if;
  return saved_id;
end;
$$;

create or replace function public.admin_save_studio(
  studio_id_value uuid,
  district_id_value uuid,
  name_value text,
  address_value text,
  status_value text
)
returns uuid
language plpgsql
set search_path = public, auth, pg_temp
as $$
declare saved_id uuid;
begin
  if not public.is_current_user_admin() then
    raise exception 'administrator_required' using errcode = '42501';
  end if;
  if studio_id_value is null then
    insert into public.studios (district_id, name, address, status, created_by)
    values (
      district_id_value, btrim(name_value), nullif(btrim(address_value), ''), status_value,
      public.current_business_user_id()
    )
    returning id into saved_id;
    perform public.record_admin_action('studio', saved_id::text, 'create', null);
  else
    update public.studios
    set district_id = district_id_value,
        name = btrim(name_value),
        address = nullif(btrim(address_value), ''),
        status = status_value
    where id = studio_id_value returning id into saved_id;
    if saved_id is null then raise exception 'studio_not_found'; end if;
    perform public.record_admin_action('studio', saved_id::text, 'update', null);
  end if;
  return saved_id;
end;
$$;

create or replace function public.admin_save_district_row(
  district_id_value uuid,
  city_id_value uuid,
  name_value text,
  status_value text,
  sort_order_value integer
)
returns table (id uuid)
language sql
set search_path = public, auth, pg_temp
as $$
  select public.admin_save_district(
    district_id_value, city_id_value, name_value, status_value, sort_order_value
  )
$$;

create or replace function public.admin_save_studio_row(
  studio_id_value uuid,
  district_id_value uuid,
  name_value text,
  address_value text,
  status_value text
)
returns table (id uuid)
language sql
set search_path = public, auth, pg_temp
as $$
  select public.admin_save_studio(
    studio_id_value, district_id_value, name_value, address_value, status_value
  )
$$;

revoke all on function public.admin_save_district(uuid, uuid, text, text, integer) from public;
revoke all on function public.admin_save_district_row(uuid, uuid, text, text, integer) from public;
revoke all on function public.admin_save_studio(uuid, uuid, text, text, text) from public;
revoke all on function public.admin_save_studio_row(uuid, uuid, text, text, text) from public;
grant execute on function public.admin_save_district(uuid, uuid, text, text, integer) to authenticated;
grant execute on function public.admin_save_district_row(uuid, uuid, text, text, integer) to authenticated;
grant execute on function public.admin_save_studio(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.admin_save_studio_row(uuid, uuid, text, text, text) to authenticated;

comment on table public.districts is 'Administrative districts only; restored by the DanceCARD 2.0 rollback';
comment on table public.studios is null;
comment on column public.studios.normalized_name is 'Exact duplicate key after case, whitespace, and punctuation normalization';
