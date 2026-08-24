drop policy if exists dance_cards_owner_insert on public.dance_cards;
drop policy if exists dance_cards_owner_update on public.dance_cards;

create policy dance_cards_owner_insert on public.dance_cards
for insert to authenticated
with check (
  user_id = public.current_business_user_id()
  and visibility = 'active'
  and hidden_reason is null
  and deleted_at is null
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
);
