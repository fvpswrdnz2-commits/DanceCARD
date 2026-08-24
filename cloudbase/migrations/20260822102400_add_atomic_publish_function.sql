create or replace function public.publish_dance_card(
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
returns uuid
language plpgsql
set search_path = public, auth, pg_temp
as $$
declare
  business_user_id uuid;
  card_id uuid;
begin
  business_user_id := public.ensure_current_business_user();

  update public.users
  set default_nickname = seller_nickname_value,
      default_wechat_id = wechat_id_value
  where id = business_user_id
    and status = 'active';

  if not found then
    raise exception 'active_user_required' using errcode = '42501';
  end if;

  insert into public.dance_cards (
    user_id, studio_id, seller_nickname, wechat_id, remaining_count,
    price_per_class, expire_date, dance_scope, dance_types, dance_type_other,
    usage_restrictions, description
  ) values (
    business_user_id, studio_id_value, seller_nickname_value, wechat_id_value,
    remaining_count_value, price_per_class_value, expire_date_value,
    dance_scope_value, dance_types_value, dance_type_other_value,
    usage_restrictions_value, description_value
  ) returning id into card_id;

  return card_id;
end;
$$;

revoke all on function public.publish_dance_card(
  uuid, text, text, integer, numeric, date, text, text[], text, text, text
) from public;
grant execute on function public.publish_dance_card(
  uuid, text, text, integer, numeric, date, text, text[], text, text, text
) to authenticated;
