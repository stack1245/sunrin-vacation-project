begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(13);

insert into auth.users (
  id,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  email_confirmed_at,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-0000000000c3',
    'account-a@example.com',
    '{}'::jsonb,
    '{"nickname":"account_a"}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-0000000000d4',
    'account-b@example.com',
    '{}'::jsonb,
    '{"nickname":"account_b"}'::jsonb,
    now(),
    now(),
    now()
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-0000000000d4',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
select public.start_stage_one();

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-0000000000c3',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  public.ensure_my_profile(),
  'account_a',
  '현재 사용자의 프로필을 보장하고 닉네임을 반환한다'
);

update public.profiles
set nickname = '새닉네임'
where id = '00000000-0000-0000-0000-0000000000c3';

select extensions.lives_ok(
  $$select public.start_stage_one()$$,
  '초기화 전 Stage 1 저장을 생성한다'
);

select extensions.lives_ok(
  $$select public.reset_my_game_data()$$,
  '로그인한 사용자의 게임 데이터 초기화가 성공한다'
);

select extensions.is(
  (select nickname from public.profiles),
  '새닉네임',
  '데이터 초기화 후에도 닉네임을 보존한다'
);

select extensions.is(
  (select count(*)::integer from public.user_stage_saves),
  0,
  '현재 사용자의 세부 저장 데이터를 모두 삭제한다'
);

select extensions.is(
  (select count(*)::integer from public.user_stage_progress),
  (select count(*)::integer from public.stages where is_published = true),
  '공개된 스테이지의 기본 진행 행을 다시 생성한다'
);

select extensions.is(
  (
    select status
    from public.user_stage_progress
    where stage_id = (
      select id
      from public.stages
      where is_published = true
      order by stage_order
      limit 1
    )
  ),
  'unlocked',
  '첫 공개 스테이지를 unlocked 상태로 되돌린다'
);

select extensions.ok(
  not exists (
    select 1
    from public.user_stage_progress as progress
    join public.stages as stage on stage.id = progress.stage_id
    where
      stage.is_published = true
      and stage.stage_order > (
        select min(first_stage.stage_order)
        from public.stages as first_stage
        where first_stage.is_published = true
      )
      and progress.status <> 'locked'
  ),
  '나머지 공개 스테이지를 locked 상태로 되돌린다'
);

select extensions.ok(
  not exists (
    select 1
    from public.user_stage_progress
    where
      best_clear_time_ms is not null
      or started_at is not null
      or cleared_at is not null
      or last_played_at is not null
  ),
  '진행 시각과 최고 기록을 모두 비운다'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-0000000000d4',
  true
);

select extensions.is(
  (select count(*)::integer from public.user_stage_saves),
  1,
  '다른 사용자의 세부 저장 데이터는 보존한다'
);

select extensions.is(
  (select status from public.user_stage_progress where stage_id = 1),
  'in_progress',
  '다른 사용자의 진행 상태는 보존한다'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);

select extensions.throws_ok(
  $$select public.reset_my_game_data()$$,
  '42501',
  'Authentication is required.',
  '비로그인 사용자의 데이터 초기화를 거부한다'
);

reset role;

set local role anon;

select extensions.throws_ok(
  $$select public.reset_my_game_data()$$,
  '42501',
  'permission denied for function reset_my_game_data',
  '익명 역할은 데이터 초기화 함수를 실행할 수 없다'
);

select * from extensions.finish();

rollback;
