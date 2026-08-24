create or replace function public.get_dance_card_contact(card_id uuid)
returns table (wechat_id text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select card.wechat_id::text
  from public.dance_cards as card
  where card.id = card_id
    and public.is_dance_card_public(
      card.user_id, card.studio_id, card.visibility, card.hidden_reason, card.deleted_at, card.expire_date
    )
  limit 1
$$;

revoke all on function public.get_dance_card_contact(uuid) from public;
grant execute on function public.get_dance_card_contact(uuid) to anon, authenticated, service_role;

comment on function public.get_dance_card_contact(uuid) is 'Single-listing contact endpoint; rechecks every public visibility condition';
