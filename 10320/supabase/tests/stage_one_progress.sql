begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(45);

create or replace function pg_temp.stage_one_state(
  p_has_keycard boolean default false,
  p_entrance_unlocked boolean default false,
  p_archive_clue_found boolean default false,
  p_chemistry_puzzle_solved boolean default false,
  p_control_room_solved boolean default false,
  p_classified_storage_unlocked boolean default false,
  p_classified_document_obtained boolean default false,
  p_escaped boolean default false
)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'version', 1,
    'currentRoom', 'outside',
    'hasKeycard', p_has_keycard,
    'entranceUnlocked', p_entrance_unlocked,
    'archiveClueFound', p_archive_clue_found,
    'chemistryPuzzleSolved', p_chemistry_puzzle_solved,
    'controlRoomSolved', p_control_room_solved,
    'classifiedStorageUnlocked', p_classified_storage_unlocked,
    'classifiedDocumentObtained', p_classified_document_obtained,
    'escaped', p_escaped
  );
$$;

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
    '00000000-0000-0000-0000-0000000000a1',
    'stage-one-a@example.com',
    '{}'::jsonb,
    '{"nickname":"agent_a"}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-0000000000b2',
    'stage-one-b@example.com',
    '{}'::jsonb,
    '{"nickname":"agent_b"}'::jsonb,
    now(),
    now(),
    now()
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-0000000000a1',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.lives_ok(
  $$select public.start_stage_one()$$,
  '첫 시작이 성공한다'
);

select extensions.is(
  (select status from public.user_stage_progress where stage_id = 1),
  'in_progress',
  '첫 시작 시 in_progress 상태가 된다'
);

select extensions.ok(
  (select started_at is not null from public.user_stage_progress where stage_id = 1),
  '첫 시작 시 started_at을 기록한다'
);

select extensions.ok(
  (select last_played_at is not null from public.user_stage_progress where stage_id = 1),
  '첫 시작 시 last_played_at을 기록한다'
);

select extensions.is(
  (select state ->> 'currentRoom' from public.user_stage_saves where stage_id = 1),
  'outside',
  '신규 저장의 기본 위치는 outside다'
);

select extensions.ok(
  (
    select
      state -> 'hasKeycard' = 'false'::jsonb
      and state -> 'entranceUnlocked' = 'false'::jsonb
      and state -> 'archiveClueFound' = 'false'::jsonb
      and state -> 'chemistryPuzzleSolved' = 'false'::jsonb
      and state -> 'controlRoomSolved' = 'false'::jsonb
      and state -> 'classifiedStorageUnlocked' = 'false'::jsonb
      and state -> 'classifiedDocumentObtained' = 'false'::jsonb
      and state -> 'escaped' = 'false'::jsonb
    from public.user_stage_saves
    where stage_id = 1
  ),
  '신규 저장의 모든 진행 플래그는 false다'
);

select extensions.is(
  (select save_version from public.user_stage_saves where stage_id = 1),
  1,
  '신규 저장 버전은 1이다'
);

select extensions.lives_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state(p_has_keycard => true),
      1,
      1000
    )
  $$,
  '정상 중간 상태를 저장한다'
);

select extensions.lives_ok(
  $$select public.start_stage_one()$$,
  '시작 함수를 다시 호출할 수 있다'
);

select extensions.is(
  (select state -> 'hasKeycard' from public.user_stage_saves where stage_id = 1),
  'true'::jsonb,
  '재시작 시 기존 저장 상태를 초기화하지 않는다'
);

select extensions.is(
  (select elapsed_time_ms from public.user_stage_saves where stage_id = 1),
  1000::bigint,
  '재시작 시 기존 경과 시간을 초기화하지 않는다'
);

select extensions.is(
  public.get_stage_one_progress() -> 'state' -> 'hasKeycard',
  'true'::jsonb,
  '이어하기가 기존 저장 상태를 반환한다'
);

select extensions.ok(
  (select last_played_at is not null from public.user_stage_progress where stage_id = 1),
  '저장 후 last_played_at이 유지된다'
);

select extensions.lives_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state(),
      1,
      999
    )
  $$,
  '늦게 도착한 오래된 저장 요청을 안전하게 처리한다'
);

select extensions.is(
  (select state -> 'hasKeycard' from public.user_stage_saves where stage_id = 1),
  'true'::jsonb,
  '오래된 저장 요청이 기존 진행 상태를 되돌리지 않는다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state(),
      1,
      1001
    )
  $$,
  '22023',
  'Stage 1 save state cannot regress.',
  '최신 저장 요청도 완료된 진행 플래그를 되돌릴 수 없다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state()
        || jsonb_build_object('currentRoom', 'server-room'),
      1,
      1001
    )
  $$,
  '22023',
  'Stage 1 save state has an invalid schema or value.',
  '허용되지 않은 Room ID 저장을 거부한다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state(),
      2,
      1001
    )
  $$,
  '22023',
  'Unsupported Stage 1 save version.',
  '저장 버전 불일치를 거부한다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state()
        || jsonb_build_object('hasKeycard', 'yes'),
      1,
      1001
    )
  $$,
  '22023',
  'Stage 1 save state has an invalid schema or value.',
  'boolean이 아닌 진행 플래그를 거부한다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state()
        || jsonb_build_object('unexpected', true),
      1,
      1001
    )
  $$,
  '22023',
  'Stage 1 save state has an invalid schema or value.',
  '허용되지 않은 추가 필드를 거부한다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state() - 'escaped',
      1,
      1001
    )
  $$,
  '22023',
  'Stage 1 save state has an invalid schema or value.',
  '필수 필드가 누락된 상태를 거부한다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state()
        || jsonb_build_object('padding', repeat('x', 4097)),
      1,
      1001
    )
  $$,
  '22023',
  'Stage 1 save state has an invalid schema or value.',
  '4,096바이트를 초과하는 상태를 거부한다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state(),
      1,
      -1
    )
  $$,
  '22023',
  'Stage 1 elapsed time must be a JavaScript-safe non-negative integer.',
  '음수 경과 시간을 거부한다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state(),
      1,
      9007199254740992
    )
  $$,
  '22023',
  'Stage 1 elapsed time must be a JavaScript-safe non-negative integer.',
  'JavaScript 안전 정수 범위를 벗어난 경과 시간을 거부한다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state(p_entrance_unlocked => true),
      1,
      1001
    )
  $$,
  '22023',
  'Stage 1 save state is invalid: keycard is required.',
  '키카드 없이 입구 해제 상태를 거부한다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state(p_chemistry_puzzle_solved => true),
      1,
      1001
    )
  $$,
  '22023',
  'Stage 1 save state is invalid: archive clue is required.',
  '자료실 단서 없이 화학 퍼즐 완료 상태를 거부한다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state(p_control_room_solved => true),
      1,
      1001
    )
  $$,
  '22023',
  'Stage 1 save state is invalid: chemistry puzzle is required.',
  '화학 퍼즐 완료 없이 보안실 완료 상태를 거부한다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state(p_classified_storage_unlocked => true),
      1,
      1001
    )
  $$,
  '22023',
  'Stage 1 save state is invalid: control room is required.',
  '보안실 완료 없이 보관실 해금 상태를 거부한다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state(p_classified_document_obtained => true),
      1,
      1001
    )
  $$,
  '22023',
  'Stage 1 save state is invalid: storage unlock is required.',
  '보관실 해금 없이 문서 획득 상태를 거부한다'
);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state(p_escaped => true),
      1,
      1001
    )
  $$,
  '22023',
  'Stage 1 save state is invalid: classified document is required.',
  '문서 없이 탈출 상태를 거부한다'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-0000000000b2',
  true
);

select extensions.is(
  (select count(*)::integer from public.user_stage_saves),
  0,
  '사용자 B는 사용자 A의 저장을 조회할 수 없다'
);

select extensions.throws_ok(
  $$
    update public.user_stage_saves
    set elapsed_time_ms = 1
    where user_id = '00000000-0000-0000-0000-0000000000a1'
  $$,
  '42501',
  'permission denied for table user_stage_saves',
  '사용자 B는 사용자 A의 저장을 수정할 수 없다'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);

select extensions.throws_ok(
  $$
    select public.save_stage_one_progress(
      pg_temp.stage_one_state(),
      1,
      0
    )
  $$,
  '42501',
  'Authentication is required.',
  '비로그인 사용자의 저장을 거부한다'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-0000000000a1',
  true
);

select extensions.throws_ok(
  $$select public.complete_stage_one()$$,
  '55000',
  'The classified document must be obtained before completion.',
  '문서 미획득 상태에서 클리어를 거부한다'
);

select public.save_stage_one_progress(
  pg_temp.stage_one_state(
    p_has_keycard => true,
    p_entrance_unlocked => true,
    p_archive_clue_found => true,
    p_chemistry_puzzle_solved => true,
    p_control_room_solved => true,
    p_classified_storage_unlocked => true,
    p_classified_document_obtained => true
  ),
  1,
  5000
);

select extensions.throws_ok(
  $$select public.complete_stage_one()$$,
  '55000',
  'The Stage 1 escape must be completed.',
  '탈출 미완료 상태에서 클리어를 거부한다'
);

select public.save_stage_one_progress(
  pg_temp.stage_one_state(
    p_has_keycard => true,
    p_entrance_unlocked => true,
    p_archive_clue_found => true,
    p_chemistry_puzzle_solved => true,
    p_control_room_solved => true,
    p_classified_storage_unlocked => true,
    p_classified_document_obtained => true,
    p_escaped => true
  ),
  1,
  5000
);

select extensions.lives_ok(
  $$select public.complete_stage_one()$$,
  '정상 조건에서 Stage 1 클리어가 성공한다'
);

select extensions.is(
  (select status from public.user_stage_progress where stage_id = 1),
  'cleared',
  '정상 클리어 시 Stage 1이 cleared 상태가 된다'
);

select extensions.is(
  (select status from public.user_stage_progress where stage_id = 2),
  'unlocked',
  '정상 클리어 시 Stage 2가 unlocked 상태가 된다'
);

select extensions.is(
  (select best_clear_time_ms from public.user_stage_progress where stage_id = 1),
  5000::bigint,
  '서버에 저장한 경과 시간으로 최고 기록을 갱신한다'
);

select extensions.ok(
  (select cleared_at is not null from public.user_stage_progress where stage_id = 1),
  '정상 클리어 시 클리어 시각을 기록한다'
);

reset role;
create temporary table stage_one_completion_snapshot as
select cleared_at, best_clear_time_ms
from public.user_stage_progress
where
  user_id = '00000000-0000-0000-0000-0000000000a1'
  and stage_id = 1;
grant select on table stage_one_completion_snapshot to authenticated;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-0000000000a1',
  true
);

select extensions.lives_ok(
  $$select public.complete_stage_one()$$,
  '중복 클리어 호출이 성공한다'
);

select extensions.is(
  (
    select progress.cleared_at
    from public.user_stage_progress as progress
    where progress.stage_id = 1
  ),
  (select snapshot.cleared_at from stage_one_completion_snapshot as snapshot),
  '중복 클리어 호출이 최초 클리어 시각을 유지한다'
);

select extensions.is(
  (
    select progress.best_clear_time_ms
    from public.user_stage_progress as progress
    where progress.stage_id = 1
  ),
  (select snapshot.best_clear_time_ms from stage_one_completion_snapshot as snapshot),
  '중복 클리어 호출이 최고 기록을 유지한다'
);

select extensions.lives_ok(
  $$select public.complete_stage(1, 1)$$,
  '기존 범용 클리어 함수도 Stage 1 서버 상태를 검사해 처리한다'
);

select extensions.is(
  (select best_clear_time_ms from public.user_stage_progress where stage_id = 1),
  5000::bigint,
  '범용 클리어 함수가 클라이언트의 Stage 1 기록 값을 신뢰하지 않는다'
);

select * from extensions.finish();

rollback;
