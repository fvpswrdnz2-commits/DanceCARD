create table public.dance_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict default public.current_business_user_id(),
  studio_id uuid not null references public.studios(id) on delete restrict,
  seller_nickname varchar(30) not null,
  wechat_id varchar(50) not null,
  remaining_count smallint not null check (remaining_count between 1 and 999),
  price_per_class numeric(10, 2) not null check (price_per_class > 0),
  expire_date date not null,
  dance_scope varchar(16) not null check (dance_scope in ('all', 'specified')),
  dance_types text[] not null default array[]::text[],
  dance_type_other varchar(80),
  usage_restrictions varchar(200),
  description varchar(500),
  visibility varchar(16) not null default 'active' check (visibility in ('active', 'hidden')),
  hidden_reason varchar(16) check (hidden_reason in ('user', 'expired', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (char_length(btrim(seller_nickname)) between 1 and 30),
  check (char_length(btrim(wechat_id)) between 1 and 50),
  check (usage_restrictions is null or char_length(usage_restrictions) <= 200),
  check (description is null or char_length(description) <= 500),
  check (dance_type_other is null or char_length(btrim(dance_type_other)) between 1 and 80),
  check (dance_types <@ array['hip-hop', 'jazz', 'locking', 'popping', 'house', 'waacking', 'k-pop']::text[]),
  check (
    (dance_scope = 'all' and cardinality(dance_types) = 0 and dance_type_other is null)
    or
    (dance_scope = 'specified' and (cardinality(dance_types) > 0 or dance_type_other is not null))
  ),
  check (
    (visibility = 'active' and hidden_reason is null and deleted_at is null)
    or
    (visibility = 'hidden' and hidden_reason is not null)
  )
);

create trigger dance_cards_touch_updated_at
before update on public.dance_cards
for each row execute function public.touch_updated_at();

comment on column public.dance_cards.seller_nickname is 'Immutable per-listing snapshot unless this listing is edited';
comment on column public.dance_cards.wechat_id is 'Private per-listing contact snapshot; never return in public list/detail payloads';
comment on table public.dance_cards is 'Information listings only; intentionally has no sold, payment, or purchase fields';
