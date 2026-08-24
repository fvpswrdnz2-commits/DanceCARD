create or replace function public.ensure_current_business_user()
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  auth_subject text := (select auth.uid());
  business_user_id uuid;
begin
  if auth_subject is null or auth_subject = '' then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(auth_subject, 0));

  select identity.user_id into business_user_id
  from public.user_identities as identity
  where identity.provider = 'phone' and identity.subject = auth_subject;

  if business_user_id is not null then
    return business_user_id;
  end if;

  insert into public.users default values returning id into business_user_id;
  insert into public.user_identities (user_id, provider, subject)
  values (business_user_id, 'phone', auth_subject);

  return business_user_id;
end;
$$;

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

create or replace function public.protect_user_privileged_fields()
returns trigger
language plpgsql
set search_path = public, auth, pg_temp
as $$
begin
  if (select auth.role()) = 'authenticated'
     and not public.is_current_user_admin()
     and (new.role is distinct from old.role or new.status is distinct from old.status) then
    raise exception 'privileged_user_fields_cannot_be_changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger users_protect_privileged_fields
before update on public.users
for each row execute function public.protect_user_privileged_fields();

create or replace function public.protect_dance_card_ownership()
returns trigger
language plpgsql
set search_path = public, auth, pg_temp
as $$
begin
  if (select auth.role()) = 'authenticated' and not public.is_current_user_admin() then
    if new.user_id is distinct from old.user_id or new.studio_id is distinct from old.studio_id then
      raise exception 'dance_card_ownership_is_immutable' using errcode = '42501';
    end if;

    if old.hidden_reason = 'admin'
       and (new.visibility is distinct from old.visibility or new.hidden_reason is distinct from old.hidden_reason) then
      raise exception 'administrator_hidden_card_cannot_be_restored' using errcode = '42501';
    end if;

    if old.hidden_reason is distinct from 'admin' and new.hidden_reason in ('admin', 'expired') then
      raise exception 'reserved_hidden_reason' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger dance_cards_protect_ownership
before update on public.dance_cards
for each row execute function public.protect_dance_card_ownership();

alter table public.users enable row level security;
alter table public.user_identities enable row level security;
alter table public.cities enable row level security;
alter table public.districts enable row level security;
alter table public.studios enable row level security;
alter table public.dance_cards enable row level security;
alter table public.admin_action_logs enable row level security;

grant usage on schema public to anon, authenticated;
grant execute on function public.ensure_current_business_user() to authenticated;
grant execute on function public.is_dance_card_public(uuid, uuid, text, text, timestamptz, date) to anon, authenticated, service_role;

grant select, update on public.users to authenticated;
grant select on public.user_identities to authenticated;
grant select, insert, update, delete on public.cities, public.districts, public.studios to authenticated;
grant select on public.cities, public.districts, public.studios to anon;
grant select, insert, update on public.dance_cards to authenticated;
grant select (
  id, studio_id, seller_nickname, remaining_count, price_per_class, expire_date,
  dance_scope, dance_types, dance_type_other, usage_restrictions, description, created_at, updated_at
) on public.dance_cards to anon;
grant select on public.admin_action_logs to authenticated;

create policy users_select_own_or_admin on public.users
for select to authenticated
using (id = public.current_business_user_id() or public.is_current_user_admin());

create policy users_update_own_or_admin on public.users
for update to authenticated
using (id = public.current_business_user_id() or public.is_current_user_admin())
with check (id = public.current_business_user_id() or public.is_current_user_admin());

create policy identities_select_own_or_admin on public.user_identities
for select to authenticated
using (user_id = public.current_business_user_id() or public.is_current_user_admin());

create policy cities_public_read on public.cities
for select to anon, authenticated
using (status = 'active');

create policy cities_admin_read on public.cities
for select to authenticated
using (public.is_current_user_admin());

create policy cities_admin_write on public.cities
for all to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

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

create policy studios_admin_read on public.studios
for select to authenticated
using (public.is_current_user_admin());

create policy studios_admin_write on public.studios
for all to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create policy dance_cards_public_read on public.dance_cards
for select to anon, authenticated
using (public.is_dance_card_public(user_id, studio_id, visibility, hidden_reason, deleted_at, expire_date));

create policy dance_cards_owner_read on public.dance_cards
for select to authenticated
using (user_id = public.current_business_user_id());

create policy dance_cards_owner_insert on public.dance_cards
for insert to authenticated
with check (
  user_id = public.current_business_user_id()
  and visibility = 'active'
  and hidden_reason is null
  and deleted_at is null
);

create policy dance_cards_owner_update on public.dance_cards
for update to authenticated
using (user_id = public.current_business_user_id())
with check (user_id = public.current_business_user_id());

create policy dance_cards_admin_all on public.dance_cards
for all to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create policy admin_logs_admin_read on public.admin_action_logs
for select to authenticated
using (public.is_current_user_admin());

create or replace function public.record_admin_action(
  target_type_value text,
  target_id_value text,
  action_value text,
  reason_value text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  log_id uuid;
begin
  if not public.is_current_user_admin() then
    raise exception 'administrator_required' using errcode = '42501';
  end if;

  insert into public.admin_action_logs (
    actor_user_id, actor_subject, target_type, target_id, action, reason
  ) values (
    public.current_business_user_id(), (select auth.uid()), target_type_value,
    target_id_value, action_value, nullif(btrim(reason_value), '')
  ) returning id into log_id;

  return log_id;
end;
$$;

revoke all on function public.ensure_current_business_user() from public;
revoke all on function public.is_dance_card_public(uuid, uuid, text, text, timestamptz, date) from public;
revoke all on function public.record_admin_action(text, text, text, text) from public;
grant execute on function public.ensure_current_business_user() to authenticated;
grant execute on function public.is_dance_card_public(uuid, uuid, text, text, timestamptz, date) to anon, authenticated, service_role;
grant execute on function public.record_admin_action(text, text, text, text) to authenticated;

create view public.public_dance_cards
with (security_invoker = true)
as
select
  card.id,
  card.studio_id,
  card.seller_nickname,
  card.remaining_count,
  card.price_per_class,
  card.expire_date,
  card.dance_scope,
  card.dance_types,
  card.dance_type_other,
  card.usage_restrictions,
  card.description,
  card.created_at,
  card.updated_at
from public.dance_cards as card
where public.is_dance_card_public(
  card.user_id, card.studio_id, card.visibility, card.hidden_reason, card.deleted_at, card.expire_date
);

grant select on public.public_dance_cards to anon, authenticated;
