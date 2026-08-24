begin;

select set_config('request.jwt.claims', '{"role":"authenticated","sub":"dev-user-subject"}', true);
set local role authenticated;

do $$
declare
  profile_count integer;
begin
  select count(*) into profile_count
  from public.get_or_create_current_business_profile();
  if profile_count <> 1 then
    raise exception 'business profile function did not return exactly one row';
  end if;
end;
$$;

do $$
declare
  studio_id uuid;
  card_id uuid;
begin
  select id into studio_id from public.studios
  where normalized_name = public.normalize_studio_name('CASTER舞蹈教室（上海大悦城南座店）');

  select id into card_id from public.publish_dance_card_row(
    studio_id, '原子发布', 'atomic-wechat', 12, 45.50,
    (now() at time zone 'Asia/Shanghai')::date + 30,
    'specified', array['jazz']::text[], null, '工作日', '里程碑测试'
  );

  if not exists (
    select 1 from public.dance_cards
    where id = card_id and seller_nickname = '原子发布' and wechat_id = 'atomic-wechat'
  ) then raise exception 'atomic publish did not create the expected card'; end if;

  if not exists (
    select 1 from public.users
    where id = public.current_business_user_id()
      and default_nickname = '原子发布' and default_wechat_id = 'atomic-wechat'
  ) then raise exception 'atomic publish did not save account defaults'; end if;

  update public.dance_cards set visibility = 'hidden', hidden_reason = 'user' where id = card_id;
  update public.dance_cards set visibility = 'active', hidden_reason = null where id = card_id;
  if not exists (select 1 from public.public_dance_cards where id = card_id) then
    raise exception 'seller restore did not return the valid card to public results';
  end if;

end;
$$;

reset role;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"dev-admin-subject"}', true);
set local role authenticated;
update public.dance_cards
set visibility = 'hidden', hidden_reason = 'expired'
where id = '10000000-0000-4000-8000-000000000001';
reset role;

select set_config('request.jwt.claims', '{"role":"authenticated","sub":"dev-user-subject"}', true);
set local role authenticated;
do $$
declare blocked boolean := false;
begin
  begin
    update public.dance_cards set visibility = 'active', hidden_reason = null
    where id = '10000000-0000-4000-8000-000000000001';
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'seller restored an expired card'; end if;
end;
$$;
reset role;

select set_config('request.jwt.claims', '{"role":"authenticated","sub":"dev-admin-subject"}', true);
set local role authenticated;

do $$
declare
  city_id uuid;
  district_id uuid;
  studio_id uuid;
  target_card_id uuid := '10000000-0000-4000-8000-000000000001';
  log_count_before integer;
  log_count_after integer;
  duplicate_blocked boolean := false;
begin
  select count(*) into log_count_before from public.admin_action_logs;

  select id into city_id from public.admin_save_city_row(null, '测试城市', 'active', 999);
  select id into district_id from public.admin_save_district_row(
    null, city_id, '测试区', 'active', 10
  );
  select id into studio_id from public.admin_save_studio_row(
    null, district_id, 'Test Dance Studio', '测试地址', 'active'
  );

  begin
    perform public.admin_save_studio_row(
      null, district_id, ' test-dance studio ', '', 'active'
    );
  exception when unique_violation then duplicate_blocked := true;
  end;
  if not duplicate_blocked then raise exception 'normalized duplicate studio was accepted'; end if;

  perform public.admin_moderate_dance_card_row(
    target_card_id, 'hide', '里程碑违规处理'
  );
  if not exists (
    select 1 from public.dance_cards
    where id = target_card_id and visibility = 'hidden' and hidden_reason = 'admin'
  ) then raise exception 'administrator moderation did not hide the card'; end if;

  perform public.admin_set_user_status_row(
    '00000000-0000-4000-8000-000000000002', 'disabled', '里程碑禁用'
  );
  if exists (
    select 1 from public.public_dance_cards as public_card
    where public_card.id in (
      select card.id from public.dance_cards as card
      where card.user_id = '00000000-0000-4000-8000-000000000002'
    )
  ) then
    raise exception 'disabled user cards remained public';
  end if;

  select count(*) into log_count_after from public.admin_action_logs;
  if log_count_after < log_count_before + 5 then
    raise exception 'administrator mutations did not create complete audit logs';
  end if;
end;
$$;

reset role;
rollback;
select 'milestone_5_database_tests_passed' as result;
