create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null,
  normalized_name varchar(80) generated always as (lower(btrim(name))) stored,
  status varchar(16) not null default 'active' check (status in ('active', 'inactive')),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(btrim(name)) between 1 and 80),
  unique (normalized_name)
);

create table public.districts (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  name varchar(80) not null,
  normalized_name varchar(80) generated always as (lower(btrim(name))) stored,
  status varchar(16) not null default 'active' check (status in ('active', 'inactive')),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(btrim(name)) between 1 and 80),
  unique (city_id, normalized_name)
);

create trigger cities_touch_updated_at
before update on public.cities
for each row execute function public.touch_updated_at();

create trigger districts_touch_updated_at
before update on public.districts
for each row execute function public.touch_updated_at();

comment on table public.cities is 'Enabled launch cities, initially Beijing and Shanghai';
comment on table public.districts is 'Administrative districts only; commercial areas are out of scope';
