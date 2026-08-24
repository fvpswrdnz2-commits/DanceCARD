create or replace function public.admin_save_city(
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
  if city_id_value is null then
    insert into public.cities (name, status, sort_order)
    values (btrim(name_value), status_value, sort_order_value)
    returning id into saved_id;
    perform public.record_admin_action('city', saved_id::text, 'create', null);
  else
    update public.cities
    set name = btrim(name_value), status = status_value, sort_order = sort_order_value
    where id = city_id_value returning id into saved_id;
    if saved_id is null then raise exception 'city_not_found'; end if;
    perform public.record_admin_action('city', saved_id::text, 'update', null);
  end if;
  return saved_id;
end;
$$;

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
    set city_id = city_id_value, name = btrim(name_value), status = status_value,
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
    values (district_id_value, btrim(name_value), nullif(btrim(address_value), ''), status_value,
            public.current_business_user_id())
    returning id into saved_id;
    perform public.record_admin_action('studio', saved_id::text, 'create', null);
  else
    update public.studios
    set district_id = district_id_value, name = btrim(name_value),
        address = nullif(btrim(address_value), ''), status = status_value
    where id = studio_id_value returning id into saved_id;
    if saved_id is null then raise exception 'studio_not_found'; end if;
    perform public.record_admin_action('studio', saved_id::text, 'update', null);
  end if;
  return saved_id;
end;
$$;

create or replace function public.admin_set_user_status(
  user_id_value uuid,
  status_value text,
  reason_value text
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
  if user_id_value = public.current_business_user_id() and status_value = 'disabled' then
    raise exception 'administrator_cannot_disable_self' using errcode = '42501';
  end if;
  update public.users set status = status_value
  where id = user_id_value returning id into saved_id;
  if saved_id is null then raise exception 'user_not_found'; end if;
  perform public.record_admin_action(
    'user', saved_id::text,
    case status_value when 'disabled' then 'disable_user' else 'restore_user' end,
    reason_value
  );
  return saved_id;
end;
$$;

create or replace function public.admin_moderate_dance_card(
  card_id_value uuid,
  action_value text,
  reason_value text
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
  if char_length(btrim(reason_value)) = 0 then
    raise exception 'moderation_reason_required';
  end if;
  if action_value = 'hide' then
    update public.dance_cards
    set visibility = 'hidden', hidden_reason = 'admin'
    where id = card_id_value and deleted_at is null returning id into saved_id;
  elsif action_value = 'delete' then
    update public.dance_cards
    set visibility = 'hidden', hidden_reason = 'admin', deleted_at = now()
    where id = card_id_value returning id into saved_id;
  else
    raise exception 'unsupported_moderation_action';
  end if;
  if saved_id is null then raise exception 'dance_card_not_found'; end if;
  perform public.record_admin_action('dance_card', saved_id::text, action_value, reason_value);
  return saved_id;
end;
$$;

revoke all on function public.admin_save_city(uuid, text, text, integer) from public;
revoke all on function public.admin_save_district(uuid, uuid, text, text, integer) from public;
revoke all on function public.admin_save_studio(uuid, uuid, text, text, text) from public;
revoke all on function public.admin_set_user_status(uuid, text, text) from public;
revoke all on function public.admin_moderate_dance_card(uuid, text, text) from public;

grant execute on function public.admin_save_city(uuid, text, text, integer) to authenticated;
grant execute on function public.admin_save_district(uuid, uuid, text, text, integer) to authenticated;
grant execute on function public.admin_save_studio(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.admin_set_user_status(uuid, text, text) to authenticated;
grant execute on function public.admin_moderate_dance_card(uuid, text, text) to authenticated;
