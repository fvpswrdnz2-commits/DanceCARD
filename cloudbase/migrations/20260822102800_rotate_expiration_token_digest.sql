create or replace function public.expire_dance_cards(
  reference_time timestamptz default now(),
  maintenance_token text default null
)
returns integer
language plpgsql
security definer
set search_path = public, auth, extensions, pg_temp
as $$
declare
  affected_count integer;
begin
  if (select auth.role()) is distinct from 'service_role'
    and digest(coalesce(maintenance_token, ''), 'sha256')
      <> decode('f47661879d022cd8b29634ece679fbdcf3a710a5c006909e244860b6ea5691b7', 'hex')
  then
    raise exception 'maintenance_token_required' using errcode = '42501';
  end if;

  update public.dance_cards
  set visibility = 'hidden', hidden_reason = 'expired', updated_at = now()
  where visibility = 'active'
    and deleted_at is null
    and expire_date < (reference_time at time zone 'Asia/Shanghai')::date;

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

revoke all on function public.expire_dance_cards(timestamptz, text) from public;
grant execute on function public.expire_dance_cards(timestamptz, text) to anon, service_role;
