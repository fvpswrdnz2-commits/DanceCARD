create or replace view public.public_dance_cards
with (security_invoker = true)
as
select
  card.id,
  card.studio_id,
  card.seller_nickname,
  card.remaining_count,
  card.price_per_class,
  card.expire_date,
  card.dance_scope,
  card.dance_types,
  card.dance_type_other,
  card.usage_restrictions,
  card.description,
  card.created_at,
  card.updated_at
from public.dance_cards as card
where public.is_dance_card_public(
  card.user_id, card.studio_id, card.visibility, card.hidden_reason, card.deleted_at, card.expire_date
);
