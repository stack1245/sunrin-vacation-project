begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(5);

insert into auth.users (
  id,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  email_confirmed_at,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-0000000000e5',
  'account-main@example.com',
  '{}'::jsonb,
  '{"nickname":"main_user"}'::jsonb,
  now(),
  now(),
  now()
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-0000000000e5',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  public.ensure_my_profile(),
  'main_user',
  '현재 사용자의 프로필을 생성하고 닉네임을 반환한다'
);

update public.profiles
set nickname = '메인닉네임'
where id = '00000000-0000-0000-0000-0000000000e5';

select extensions.lives_ok(
  $$select public.reset_my_game_data()$$,
  '스테이지 테이블이 없는 메인 환경에서도 초기화 함수가 성공한다'
);

select extensions.is(
  (select nickname from public.profiles),
  '메인닉네임',
  '데이터 초기화 후에도 닉네임을 보존한다'
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
