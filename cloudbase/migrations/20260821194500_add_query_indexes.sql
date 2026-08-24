create index cities_public_order_idx on public.cities (status, sort_order, name, id);
create index districts_city_public_order_idx on public.districts (city_id, status, sort_order, name, id);
create index studios_district_public_order_idx on public.studios (district_id, status, name, id);
create index studios_normalized_search_idx on public.studios (normalized_name);
create index user_identities_subject_idx on public.user_identities (subject, provider, user_id);
create index dance_cards_public_listing_idx on public.dance_cards (
  studio_id,
  price_per_class asc,
  created_at desc,
  id
) where visibility = 'active' and deleted_at is null;
create index dance_cards_owner_idx on public.dance_cards (user_id, created_at desc, id) where deleted_at is null;
create index dance_cards_expiration_idx on public.dance_cards (expire_date, id) where visibility = 'active' and deleted_at is null;
create index admin_action_logs_target_idx on public.admin_action_logs (target_type, target_id, created_at desc);
create index admin_action_logs_actor_idx on public.admin_action_logs (actor_user_id, created_at desc);
