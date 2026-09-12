revoke select on public.districts from anon, authenticated;

drop view public.districts;

drop index public.studios_legacy_district_lookup_idx;

alter table public.studios drop column district_id;
