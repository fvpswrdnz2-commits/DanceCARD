drop function if exists public.admin_moderate_dance_card_row(uuid, text, text);
drop function if exists public.admin_set_user_status_row(uuid, text, text);
drop function if exists public.admin_save_studio_row(uuid, uuid, text, text, text);
drop function if exists public.admin_save_district_row(uuid, uuid, text, text, integer);
drop function if exists public.admin_save_city_row(uuid, text, text, integer);
drop function if exists public.publish_dance_card_row(
  uuid, text, text, integer, numeric, date, text, text[], text, text, text
);
drop function if exists public.get_or_create_current_business_profile();
