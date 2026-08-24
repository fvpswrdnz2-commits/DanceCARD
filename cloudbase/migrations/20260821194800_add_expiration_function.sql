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

revoke all on function public.expire_dance_cards(timestamptz) from public;
grant execute on function public.expire_dance_cards(timestamptz) to service_role;

comment on function public.expire_dance_cards(timestamptz) is 'Daily maintenance; public queries independently exclude expired dates in Asia/Shanghai';
