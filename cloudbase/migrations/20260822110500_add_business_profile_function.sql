create or replace function public.get_or_create_current_business_profile()
returns table (
  id uuid,
  default_nickname text,
  default_wechat_id text,
  role text,
  status text
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  business_user_id uuid;
begin
  business_user_id := public.ensure_current_business_user();

  return query
  select app_user.id,
         app_user.default_nickname::text,
         app_user.default_wechat_id::text,
         app_user.role::text,
         app_user.status::text
  from public.users as app_user
  where app_user.id = business_user_id;
end;
$$;

revoke all on function public.get_or_create_current_business_profile() from public;
grant execute on function public.get_or_create_current_business_profile() to authenticated;

create or replace function public.publish_dance_card_row(
  studio_id_value uuid,
  seller_nickname_value text,
  wechat_id_value text,
  remaining_count_value integer,
  price_per_class_value numeric,
  expire_date_value date,
  dance_scope_value text,
  dance_types_value text[],
  dance_type_other_value text default null,
  usage_restrictions_value text default null,
  description_value text default null
)
returns table (id uuid)
language plpgsql
set search_path = public, auth, pg_temp
as $$
declare saved_id uuid;
begin
  saved_id := public.publish_dance_card(
    studio_id_value, seller_nickname_value, wechat_id_value, remaining_count_value,
    price_per_class_value, expire_date_value, dance_scope_value, dance_types_value,
    dance_type_other_value, usage_restrictions_value, description_value
  );
  return query select saved_id;
end;
$$;

create or replace function public.admin_save_city_row(
  city_id_value uuid, name_value text, status_value text, sort_order_value integer
)
returns table (id uuid)
language sql
set search_path = public, auth, pg_temp
as $$
  select public.admin_save_city(city_id_value, name_value, status_value, sort_order_value)
$$;

create or replace function public.admin_save_district_row(
  district_id_value uuid, city_id_value uuid, name_value text,
  status_value text, sort_order_value integer
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
  studio_id_value uuid, district_id_value uuid, name_value text,
  address_value text, status_value text
)
returns table (id uuid)
language sql
set search_path = public, auth, pg_temp
as $$
  select public.admin_save_studio(
    studio_id_value, district_id_value, name_value, address_value, status_value
  )
$$;

create or replace function public.admin_set_user_status_row(
  user_id_value uuid, status_value text, reason_value text
)
returns table (id uuid)
language sql
set search_path = public, auth, pg_temp
as $$
  select public.admin_set_user_status(user_id_value, status_value, reason_value)
$$;

create or replace function public.admin_moderate_dance_card_row(
  card_id_value uuid, action_value text, reason_value text
)
returns table (id uuid)
language sql
set search_path = public, auth, pg_temp
as $$
  select public.admin_moderate_dance_card(card_id_value, action_value, reason_value)
$$;

revoke all on function public.publish_dance_card_row(
  uuid, text, text, integer, numeric, date, text, text[], text, text, text
) from public;
revoke all on function public.admin_save_city_row(uuid, text, text, integer) from public;
revoke all on function public.admin_save_district_row(uuid, uuid, text, text, integer) from public;
revoke all on function public.admin_save_studio_row(uuid, uuid, text, text, text) from public;
revoke all on function public.admin_set_user_status_row(uuid, text, text) from public;
revoke all on function public.admin_moderate_dance_card_row(uuid, text, text) from public;

grant execute on function public.publish_dance_card_row(
  uuid, text, text, integer, numeric, date, text, text[], text, text, text
) to authenticated;
grant execute on function public.admin_save_city_row(uuid, text, text, integer) to authenticated;
grant execute on function public.admin_save_district_row(uuid, uuid, text, text, integer) to authenticated;
grant execute on function public.admin_save_studio_row(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.admin_set_user_status_row(uuid, text, text) to authenticated;
grant execute on function public.admin_moderate_dance_card_row(uuid, text, text) to authenticated;
