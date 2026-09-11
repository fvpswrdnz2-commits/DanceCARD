-- DanceCARD 2.0: browse and manage cards by city and city-wide studio.
-- Existing branch records are consolidated for known chains before districts are removed.

alter table public.studios
  add column city_id uuid references public.cities(id) on delete restrict,
  add column branch_info varchar(2000);

update public.studios as studio
set city_id = district.city_id,
    branch_info = case
      when studio.address is null then null
      else studio.name || '：' || studio.address
    end
from public.districts as district
where district.id = studio.district_id;

alter table public.studios alter column city_id set not null;

do $$
declare
  mapping record;
  canonical_id uuid;
  combined_branch_info text;
  has_active_branch boolean;
begin
  for mapping in
    select city.id as city_id, source.canonical_name, source.name_pattern
    from (values
      ('北京', '嘉禾舞社', '嘉禾舞社%'),
      ('上海', 'CASTER舞蹈教室', 'CASTER舞蹈教室%'),
      ('上海', 'GH5 DANCE STUDIO', 'GH5 DANCE STUDIO%')
    ) as source(city_name, canonical_name, name_pattern)
    join public.cities as city on city.normalized_name = lower(source.city_name)
  loop
    select studio.id
    into canonical_id
    from public.studios as studio
    where studio.city_id = mapping.city_id
      and studio.name ilike mapping.name_pattern
    order by (studio.status = 'active') desc, studio.created_at, studio.id
    limit 1;

    if canonical_id is null then
      continue;
    end if;

    select
      left(
        string_agg(
          case
            when studio.address is null then studio.name
            else studio.name || '：' || studio.address
          end,
          E'\n' order by studio.name, studio.id
        ),
        2000
      ),
      bool_or(studio.status = 'active')
    into combined_branch_info, has_active_branch
    from public.studios as studio
    where studio.city_id = mapping.city_id
      and studio.name ilike mapping.name_pattern;

    update public.dance_cards as card
    set studio_id = canonical_id
    where card.studio_id in (
      select studio.id
      from public.studios as studio
      where studio.city_id = mapping.city_id
        and studio.name ilike mapping.name_pattern
        and studio.id <> canonical_id
    );

    delete from public.studios as studio
    where studio.city_id = mapping.city_id
      and studio.name ilike mapping.name_pattern
      and studio.id <> canonical_id;

    update public.studios
    set name = mapping.canonical_name,
        branch_info = combined_branch_info,
        status = case when has_active_branch then 'active' else 'inactive' end,
        updated_at = now()
    where id = canonical_id;
  end loop;
end;
$$;

-- Exact same names that previously existed in different districts now represent one city-wide studio.
do $$
declare
  duplicate_group record;
  canonical_id uuid;
  combined_branch_info text;
begin
  for duplicate_group in
    select city_id, normalized_name
    from public.studios
    group by city_id, normalized_name
    having count(*) > 1
  loop
    select studio.id
    into canonical_id
    from public.studios as studio
    where studio.city_id = duplicate_group.city_id
      and studio.normalized_name = duplicate_group.normalized_name
    order by (studio.status = 'active') desc, studio.created_at, studio.id
    limit 1;

    select left(string_agg(studio.branch_info, E'\n' order by studio.id), 2000)
    into combined_branch_info
    from public.studios as studio
    where studio.city_id = duplicate_group.city_id
      and studio.normalized_name = duplicate_group.normalized_name;

    update public.dance_cards as card
    set studio_id = canonical_id
    where card.studio_id in (
      select studio.id
      from public.studios as studio
      where studio.city_id = duplicate_group.city_id
        and studio.normalized_name = duplicate_group.normalized_name
        and studio.id <> canonical_id
    );

    delete from public.studios as studio
    where studio.city_id = duplicate_group.city_id
      and studio.normalized_name = duplicate_group.normalized_name
      and studio.id <> canonical_id;

    update public.studios
    set branch_info = combined_branch_info,
        updated_at = now()
    where id = canonical_id;
  end loop;
end;
$$;

drop policy if exists studios_public_read on public.studios;
drop policy if exists dance_cards_owner_insert on public.dance_cards;

drop function if exists public.admin_save_studio_row(uuid, uuid, text, text, text);
drop function if exists public.admin_save_studio(uuid, uuid, text, text, text);
drop function if exists public.admin_save_district_row(uuid, uuid, text, text, integer);
drop function if exists public.admin_save_district(uuid, uuid, text, text, integer);

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
      join public.cities as city on city.id = studio.city_id
      where studio.id = location_id
        and studio.status = 'active'
        and city.status = 'active'
    )
$$;

drop index if exists public.studios_district_public_order_idx;
drop index if exists public.districts_city_public_order_idx;

alter table public.studios
  drop constraint if exists studios_district_id_normalized_name_key;

alter table public.studios
  add constraint studios_city_id_normalized_name_key unique (city_id, normalized_name);

alter table public.studios
  drop column district_id,
  drop column address;

drop table public.districts;

create index studios_city_public_order_idx
on public.studios (city_id, status, name, id);

create policy studios_public_read on public.studios
for select to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1
    from public.cities as city
    where city.id = city_id and city.status = 'active'
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
    join public.cities as city on city.id = studio.city_id
    where studio.id = studio_id
      and studio.status = 'active'
      and city.status = 'active'
  )
);

create or replace function public.admin_save_studio(
  studio_id_value uuid,
  city_id_value uuid,
  name_value text,
  branch_info_value text,
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
    insert into public.studios (city_id, name, branch_info, status, created_by)
    values (
      city_id_value, btrim(name_value), nullif(btrim(branch_info_value), ''), status_value,
      public.current_business_user_id()
    )
    returning id into saved_id;
    perform public.record_admin_action('studio', saved_id::text, 'create', null);
  else
    update public.studios
    set city_id = city_id_value,
        name = btrim(name_value),
        branch_info = nullif(btrim(branch_info_value), ''),
        status = status_value
    where id = studio_id_value returning id into saved_id;
    if saved_id is null then raise exception 'studio_not_found'; end if;
    perform public.record_admin_action('studio', saved_id::text, 'update', null);
  end if;
  return saved_id;
end;
$$;

create or replace function public.admin_save_studio_row(
  studio_id_value uuid,
  city_id_value uuid,
  name_value text,
  branch_info_value text,
  status_value text
)
returns table (id uuid)
language sql
set search_path = public, auth, pg_temp
as $$
  select public.admin_save_studio(
    studio_id_value, city_id_value, name_value, branch_info_value, status_value
  )
$$;

revoke all on function public.admin_save_studio(uuid, uuid, text, text, text) from public;
revoke all on function public.admin_save_studio_row(uuid, uuid, text, text, text) from public;
grant execute on function public.admin_save_studio(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.admin_save_studio_row(uuid, uuid, text, text, text) to authenticated;

comment on table public.studios is 'DanceCARD 2.0 city-wide studios; cards apply across their listed branches';
comment on column public.studios.city_id is 'City used by the city-to-studio browsing path';
comment on column public.studios.branch_info is 'Optional administrator-maintained summary of branches where the card applies';
