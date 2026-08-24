drop function if exists public.is_current_user_admin();
drop function if exists public.current_business_user_id();
drop table if exists public.user_identities;
drop trigger if exists users_touch_updated_at on public.users;
drop table if exists public.users;
drop function if exists public.touch_updated_at();
