create extension if not exists pgcrypto;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  default_nickname varchar(30),
  default_wechat_id varchar(50),
  role varchar(16) not null default 'user' check (role in ('user', 'admin')),
  status varchar(16) not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (default_nickname is null or char_length(btrim(default_nickname)) between 1 and 30),
  check (default_wechat_id is null or char_length(btrim(default_wechat_id)) between 1 and 50)
);

create table public.user_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  provider varchar(16) not null check (provider in ('phone', 'wechat')),
  subject varchar(128) not null,
  created_at timestamptz not null default now(),
  unique (provider, subject),
  unique (user_id, provider)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_touch_updated_at
before update on public.users
for each row execute function public.touch_updated_at();

create or replace function public.current_business_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select identity.user_id
  from public.user_identities as identity
  where identity.subject = (select auth.uid())
  order by case identity.provider when 'phone' then 0 else 1 end
  limit 1
$$;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.users as app_user
    where app_user.id = public.current_business_user_id()
      and app_user.role = 'admin'
      and app_user.status = 'active'
  )
$$;

revoke all on function public.current_business_user_id() from public;
revoke all on function public.is_current_user_admin() from public;
grant execute on function public.current_business_user_id() to authenticated, service_role;
grant execute on function public.is_current_user_admin() to authenticated, service_role;

comment on table public.users is 'DanceCARD business users, independent from authentication providers';
comment on table public.user_identities is 'Maps CloudBase auth subjects to stable DanceCARD user IDs';
