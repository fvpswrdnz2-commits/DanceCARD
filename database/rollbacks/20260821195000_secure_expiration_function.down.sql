create or replace function public.expire_dance_cards(reference_time timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_count integer;
begin
  update public.dance_cards
  set visibility = 'hidden', hidden_reason = 'expired', updated_at = now()
  where visibility = 'active'
    and deleted_at is null
    and expire_date < (reference_time at time zone 'Asia/Shanghai')::date;
  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;
