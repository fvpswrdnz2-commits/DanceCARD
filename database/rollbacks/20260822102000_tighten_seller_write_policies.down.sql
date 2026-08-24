drop policy if exists dance_cards_owner_insert on public.dance_cards;
drop policy if exists dance_cards_owner_update on public.dance_cards;

create policy dance_cards_owner_insert on public.dance_cards
for insert to authenticated
with check (
  user_id = public.current_business_user_id()
  and visibility = 'active'
  and hidden_reason is null
  and deleted_at is null
);

create policy dance_cards_owner_update on public.dance_cards
for update to authenticated
using (user_id = public.current_business_user_id())
with check (user_id = public.current_business_user_id());
