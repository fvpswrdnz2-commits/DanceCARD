create or replace function public.normalize_studio_name(value text)
returns text
language sql
immutable
parallel safe
as $$
  select lower(regexp_replace(btrim(value), '[[:space:][:punct:]]+', '', 'g'))
$$;

create table public.studios (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts(id) on delete restrict,
  name varchar(120) not null,
  normalized_name varchar(120) generated always as (public.normalize_studio_name(name)) stored,
  address varchar(300),
  status varchar(16) not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(btrim(name)) between 1 and 120),
  check (normalized_name <> ''),
  check (address is null or char_length(btrim(address)) between 1 and 300),
  unique (district_id, normalized_name)
);

create trigger studios_touch_updated_at
before update on public.studios
for each row execute function public.touch_updated_at();

comment on column public.studios.normalized_name is 'Exact duplicate key after case, whitespace, and punctuation normalization';
