create table public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  actor_subject varchar(128),
  target_type varchar(24) not null check (target_type in ('user', 'city', 'district', 'studio', 'dance_card')),
  target_id varchar(128) not null,
  action varchar(32) not null check (action in ('create', 'update', 'activate', 'deactivate', 'hide', 'restore', 'delete', 'disable_user', 'restore_user', 'change_role')),
  reason varchar(500),
  created_at timestamptz not null default now(),
  check (actor_user_id is not null or actor_subject is not null)
);

comment on table public.admin_action_logs is 'Append-only administrator audit records retained after target deletion';
