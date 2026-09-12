begin;

do $$
declare
  beijing_id uuid;
  shanghai_id uuid;
  studio_id uuid;
  duplicate_blocked boolean := false;
  invalid_fk_blocked boolean := false;
  invalid_card_blocked boolean := false;
begin
  select id into beijing_id from public.cities where normalized_name = '北京';
  select id into shanghai_id from public.cities where normalized_name = '上海';
  select id into studio_id from public.studios
  where city_id = beijing_id and normalized_name = public.normalize_studio_name('嘉禾舞社');

  begin
    insert into public.studios (city_id, name, status, created_by)
    values (gen_random_uuid(), '无效城市舞室', 'inactive', '00000000-0000-4000-8000-000000000001');
  exception when foreign_key_violation then
    invalid_fk_blocked := true;
  end;
  if not invalid_fk_blocked then raise exception 'invalid city foreign key was accepted'; end if;

  begin
    insert into public.studios (city_id, name, status, created_by)
    values (beijing_id, ' 嘉禾-舞社 ', 'inactive', '00000000-0000-4000-8000-000000000001');
  exception when unique_violation then
    duplicate_blocked := true;
  end;
  if not duplicate_blocked then raise exception 'same-city duplicate studio was accepted'; end if;

  insert into public.studios (city_id, name, status, created_by)
  values (shanghai_id, '测试同名舞室', 'inactive', '00000000-0000-4000-8000-000000000001');
  insert into public.studios (city_id, name, status, created_by)
  values (beijing_id, '测试同名舞室', 'inactive', '00000000-0000-4000-8000-000000000001');

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'districts' and table_type = 'BASE TABLE'
  ) then raise exception 'district base table still exists in DanceCARD 2.0'; end if;

  if not exists (
    select 1 from information_schema.views
    where table_schema = 'public' and table_name = 'districts'
  ) then raise exception 'legacy Mini Program compatibility view is missing'; end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'studios' and column_name = 'city_id'
  ) then raise exception 'studio is not directly linked to a city'; end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'studios'
      and column_name = 'district_id' and is_generated = 'ALWAYS'
  ) then raise exception 'legacy studio district key is not generated from the V2 city key'; end if;

  begin
    insert into public.dance_cards (
      user_id, studio_id, seller_nickname, wechat_id, remaining_count,
      price_per_class, expire_date, dance_scope, dance_types
    ) values (
      '00000000-0000-4000-8000-000000000002', studio_id, '测试', 'test-wechat', 0,
      10, current_date + 1, 'all', array[]::text[]
    );
  exception when check_violation then
    invalid_card_blocked := true;
  end;
  if not invalid_card_blocked then raise exception 'invalid remaining count was accepted'; end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'dance_cards'
      and column_name in ('sold', 'sold_at', 'order_id', 'payment_id', 'purchase_id')
  ) then raise exception 'transaction or sold field leaked into dance_cards'; end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'public_dance_cards' and column_name = 'wechat_id'
  ) then raise exception 'public view exposes wechat_id'; end if;

  insert into public.dance_cards (
    id, user_id, studio_id, seller_nickname, wechat_id, remaining_count,
    price_per_class, expire_date, dance_scope, dance_types, visibility, hidden_reason
  ) values (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    studio_id,
    '管理员隐藏测试',
    'admin-hidden-test',
    2,
    22.00,
    (now() at time zone 'Asia/Shanghai')::date + 10,
    'all',
    array[]::text[],
    'hidden',
    'admin'
  );
end;
$$;

set local role anon;
do $$
declare
  compatibility_district_count integer;
  legacy_studio_count integer;
  visible_city_count integer;
  public_card_count integer;
begin
  select count(*) into visible_city_count from public.cities;
  if visible_city_count <> 2 then raise exception 'anon city visibility expected 2, got %', visible_city_count; end if;

  select count(*) into compatibility_district_count
  from public.districts
  where id = city_id and name = '全市' and status = 'active';
  if compatibility_district_count <> visible_city_count then
    raise exception 'legacy district compatibility expected %, got %',
      visible_city_count, compatibility_district_count;
  end if;

  select count(*) into legacy_studio_count
  from public.districts as district
  join public.studios as studio on studio.district_id = district.id
  where district.status = 'active' and studio.status = 'active';
  if legacy_studio_count <> 3 then
    raise exception 'legacy city-district-studio query expected 3 studios, got %', legacy_studio_count;
  end if;

  select count(*) into public_card_count
  from public.public_dance_cards
  where id in (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000006'
  );
  if public_card_count <> 3 then
    raise exception 'anon seed-card visibility expected 3, got %', public_card_count;
  end if;
end;
$$;
reset role;

select set_config('request.jwt.claims', '{"role":"authenticated","sub":"dev-user-subject"}', true);
set local role authenticated;
do $$
declare
  studio_id uuid;
  new_card_id uuid;
  own_user_id uuid := public.current_business_user_id();
  blocked boolean := false;
begin
  if own_user_id <> '00000000-0000-4000-8000-000000000002'::uuid then
    raise exception 'auth subject did not map to expected business user';
  end if;

  select id into studio_id from public.studios
  where normalized_name = public.normalize_studio_name('CASTER舞蹈教室');

  insert into public.dance_cards (
    studio_id, seller_nickname, wechat_id, remaining_count, price_per_class,
    expire_date, dance_scope, dance_types
  ) values (
    studio_id, '权限测试', 'permission-test', 1, 1.01,
    (now() at time zone 'Asia/Shanghai')::date + 1, 'all', array[]::text[]
  ) returning id into new_card_id;

  if not exists (select 1 from public.dance_cards where id = new_card_id and user_id = own_user_id) then
    raise exception 'owner insert did not bind current business user';
  end if;

  begin
    insert into public.dance_cards (
      user_id, studio_id, seller_nickname, wechat_id, remaining_count,
      price_per_class, expire_date, dance_scope, dance_types
    ) values (
      '00000000-0000-4000-8000-000000000001', studio_id, '伪造', 'forged', 1,
      1.00, (now() at time zone 'Asia/Shanghai')::date + 1, 'all', array[]::text[]
    );
  exception when insufficient_privilege then
    blocked := true;
  end;
  if not blocked then raise exception 'forged user_id was accepted'; end if;

  blocked := false;
  begin
    insert into public.cities (name) values ('越权城市');
  exception when insufficient_privilege then
    blocked := true;
  end;
  if not blocked then raise exception 'normal user could create city'; end if;

  blocked := false;
  begin
    insert into public.admin_action_logs (actor_user_id, target_type, target_id, action)
    values (own_user_id, 'city', 'forged', 'create');
  exception when insufficient_privilege then
    blocked := true;
  end;
  if not blocked then raise exception 'normal user could write audit log'; end if;

  blocked := false;
  begin
    perform public.record_admin_action('city', 'forged', 'create', 'forged');
  exception when insufficient_privilege then
    blocked := true;
  end;
  if not blocked then raise exception 'normal user could call admin audit function'; end if;

  update public.dance_cards
  set seller_nickname = '允许编辑但仍隐藏'
  where id = '20000000-0000-4000-8000-000000000001';
  if not found then raise exception 'owner could not edit administrator-hidden card content'; end if;

  blocked := false;
  begin
    update public.dance_cards
    set visibility = 'active', hidden_reason = null
    where id = '20000000-0000-4000-8000-000000000001';
  exception when insufficient_privilege then
    blocked := true;
  end;
  if not blocked then raise exception 'owner restored administrator-hidden card'; end if;

  update public.dance_cards set seller_nickname = '越权编辑'
  where id = '10000000-0000-4000-8000-000000000002';
  if found then raise exception 'normal user edited another user card'; end if;
end;
$$;
reset role;

select set_config('request.jwt.claims', '{"role":"authenticated","sub":"dev-admin-subject"}', true);
set local role authenticated;
do $$
declare
  log_id uuid;
begin
  log_id := public.record_admin_action('city', 'test-city', 'update', 'milestone test');
  if not exists (select 1 from public.admin_action_logs where id = log_id and reason = 'milestone test') then
    raise exception 'admin action did not produce an audit log';
  end if;
end;
$$;
reset role;

do $$
declare
  shanghai_id uuid;
  studio_id uuid;
  valid_card_id uuid := '10000000-0000-4000-8000-000000000001';
  hidden_card_id uuid := '10000000-0000-4000-8000-000000000004';
  today_card_id uuid;
  yesterday_card_id uuid;
  tomorrow_card_id uuid;
  affected integer;
begin
  select id into shanghai_id from public.cities where normalized_name = '上海';
  select id into studio_id from public.studios
  where city_id = shanghai_id
    and normalized_name = public.normalize_studio_name('CASTER舞蹈教室');

  if (select wechat_id from public.get_dance_card_contact(valid_card_id)) <> 'dancecard-dev-user' then
    raise exception 'valid public contact was not returned';
  end if;
  if exists (select 1 from public.get_dance_card_contact(hidden_card_id)) then
    raise exception 'hidden card contact was returned';
  end if;

  update public.cities set status = 'inactive' where id = shanghai_id;
  if exists (select 1 from public.get_dance_card_contact(valid_card_id)) then
    raise exception 'contact remained visible while city inactive';
  end if;
  update public.cities set status = 'active' where id = shanghai_id;

  update public.studios set status = 'inactive' where id = studio_id;
  if exists (select 1 from public.get_dance_card_contact(valid_card_id)) then
    raise exception 'contact remained visible while studio inactive';
  end if;
  update public.studios set status = 'active' where id = studio_id;

  update public.users set status = 'disabled' where id = '00000000-0000-4000-8000-000000000002';
  if exists (select 1 from public.get_dance_card_contact(valid_card_id)) then
    raise exception 'contact remained visible while seller disabled';
  end if;
  if not exists (select 1 from public.dance_cards where id = valid_card_id) then
    raise exception 'seller disable deleted historical card data';
  end if;
  update public.users set status = 'active' where id = '00000000-0000-4000-8000-000000000002';

  insert into public.dance_cards (
    user_id, studio_id, seller_nickname, wechat_id, remaining_count, price_per_class,
    expire_date, dance_scope, dance_types
  ) values (
    '00000000-0000-4000-8000-000000000002', studio_id, '今天到期', 'today', 1, 10,
    (now() at time zone 'Asia/Shanghai')::date, 'all', array[]::text[]
  ) returning id into today_card_id;

  insert into public.dance_cards (
    user_id, studio_id, seller_nickname, wechat_id, remaining_count, price_per_class,
    expire_date, dance_scope, dance_types
  ) values (
    '00000000-0000-4000-8000-000000000002', studio_id, '昨天到期', 'yesterday', 1, 10,
    (now() at time zone 'Asia/Shanghai')::date - 1, 'all', array[]::text[]
  ) returning id into yesterday_card_id;

  insert into public.dance_cards (
    user_id, studio_id, seller_nickname, wechat_id, remaining_count, price_per_class,
    expire_date, dance_scope, dance_types
  ) values (
    '00000000-0000-4000-8000-000000000002', studio_id, '明天到期', 'tomorrow', 1, 10,
    (now() at time zone 'Asia/Shanghai')::date + 1, 'all', array[]::text[]
  ) returning id into tomorrow_card_id;

  if not public.is_dance_card_public(
    '00000000-0000-4000-8000-000000000002', studio_id, 'active', null, null,
    (now() at time zone 'Asia/Shanghai')::date
  ) then raise exception 'card should remain valid through Shanghai end-of-day'; end if;

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    perform public.expire_dance_cards(now());
    raise exception 'anonymous expiration call unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claims', '{"role":"service_role","sub":"scheduled-expiration"}', true);
  affected := public.expire_dance_cards(now());
  if affected < 1 then raise exception 'expiration task marked no yesterday cards'; end if;
  if (select hidden_reason from public.dance_cards where id = yesterday_card_id) <> 'expired' then
    raise exception 'yesterday card was not marked expired';
  end if;
  if (select visibility from public.dance_cards where id in (today_card_id, tomorrow_card_id) limit 1) <> 'active' then
    raise exception 'today or tomorrow card was incorrectly expired';
  end if;
end;
$$;

do $$
declare
  ordered_prices numeric[];
  public_count integer;
begin
  select array_agg(price_per_class order by price_per_class asc, created_at desc, id asc)
  into ordered_prices
  from public.public_dance_cards
  where id in (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003'
  );
  if ordered_prices <> array[45.00, 60.00, 60.00]::numeric[] then
    raise exception 'public price order mismatch: %', ordered_prices;
  end if;

  select count(*) into public_count
  from (
    select id
    from public.public_dance_cards
    where id in (
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000003'
    )
    order by price_per_class asc, created_at desc, id asc
    limit 20
  ) as page;
  if public_count <> 3 then raise exception 'stable first page expected 3 cards, got %', public_count; end if;
end;
$$;

rollback;
select 'milestone_3_database_tests_passed' as result;
