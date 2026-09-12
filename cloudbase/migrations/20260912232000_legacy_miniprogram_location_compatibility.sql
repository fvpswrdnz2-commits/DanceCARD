-- Temporary read-only compatibility for released DanceCARD 1.x Mini Program clients.
-- V2 remains city-owned; legacy clients see one synthetic "全市" district per city.

alter table public.studios
  add column district_id uuid generated always as (city_id) stored;

create index studios_legacy_district_lookup_idx
on public.studios (district_id, status, name, id);

create view public.districts
with (security_invoker = true)
as
select
  city.id,
  city.id as city_id,
  '全市'::varchar(80) as name,
  '全市'::varchar(80) as normalized_name,
  city.status,
  city.sort_order,
  city.created_at,
  city.updated_at
from public.cities as city;

grant select on public.districts to anon, authenticated;

comment on view public.districts is
  'Temporary DanceCARD 1.x compatibility view; V2 clients browse directly from city to studio';
comment on column public.studios.district_id is
  'Temporary generated compatibility key equal to city_id; not part of the V2 domain model';
