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

    if old.hidden_reason in ('admin', 'expired')
       and (new.visibility is distinct from old.visibility or new.hidden_reason is distinct from old.hidden_reason) then
      raise exception 'protected_hidden_card_cannot_be_restored' using errcode = '42501';
    end if;

    if (old.hidden_reason is null or old.hidden_reason not in ('admin', 'expired'))
       and new.hidden_reason in ('admin', 'expired') then
      raise exception 'reserved_hidden_reason' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop policy if exists dance_cards_owner_insert on public.dance_cards;
drop policy if exists dance_cards_owner_update on public.dance_cards;

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

create policy dance_cards_owner_update on public.dance_cards
for update to authenticated
using (
  user_id = public.current_business_user_id()
  and exists (
    select 1 from public.users as app_user
    where app_user.id = public.current_business_user_id()
      and app_user.status = 'active'
  )
)
with check (
  user_id = public.current_business_user_id()
  and exists (
    select 1 from public.users as app_user
    where app_user.id = public.current_business_user_id()
      and app_user.status = 'active'
  )
  and (
    visibility = 'hidden'
    or expire_date >= (now() at time zone 'Asia/Shanghai')::date
  )
);
