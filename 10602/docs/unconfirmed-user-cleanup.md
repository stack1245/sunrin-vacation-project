# 미인증 사용자 자동 정리 운영 가이드

OutOfBounds는 Supabase Cron과 PostgreSQL 함수로 오래된 미인증 회원가입
요청을 정리한다. 브라우저, Next.js 서버, Vercel Cron 또는 GitHub
Actions는 사용자 삭제에 관여하지 않는다.

## 정책

- 회원가입 후 24시간 동안 이메일 인증을 완료하지 않은 계정을 삭제한다.
- Cron Job은 10분마다 삭제 대상을 검사한다.
- 다음 조건을 모두 만족하는 `auth.users` 행만 대상이 된다.
  - `email is not null`
  - `email_confirmed_at is null`
  - `created_at < now() - max_age`
  - `last_sign_in_at is null`
- 함수는 삭제 직전에 같은 조건을 다시 확인한다.
- 함수가 반환하는 정수는 해당 실행에서 실제로 삭제된 사용자 수다.

현재 프로젝트에는 별도의 애플리케이션 관리자 또는 시스템 계정 구분
컬럼이 없다. 불확실한 `role` 또는 metadata 값을 관리자 표식으로
가정하지 않는다. 정상적으로 인증한 이메일 사용자와 OAuth 사용자는
`email_confirmed_at` 또는 `last_sign_in_at`이 존재하므로 정리 대상에서
제외된다. 향후 애플리케이션 관리자 계정을 `auth.users`에 별도로 만들
경우에는 신뢰할 수 있는 관리자 데이터 모델을 먼저 추가하고 정리
함수에도 명시적인 제외 조건을 추가해야 한다.

## 구성 요소

Migration:

```text
supabase/migrations/20260727030000_cleanup_unconfirmed_auth_users.sql
```

정리 함수:

```text
private.cleanup_unconfirmed_auth_users(
  max_age interval default interval '24 hours'
) returns integer
```

Cron Job:

```text
이름: cleanup-unconfirmed-auth-users
주기: */10 * * * *
명령: select private.cleanup_unconfirmed_auth_users(interval '24 hours');
```

Migration은 같은 이름의 기존 Job만 `cron.unschedule()`로 제거한 후 다시
생성한다. 다른 Cron Job은 변경하지 않는다.

## 적용 방법

운영 DB에 적용하기 전에 테스트 프로젝트 또는 스테이징 프로젝트에서
Migration을 먼저 검증한다. 연결된 Supabase CLI 환경에서는 프로젝트
절차에 맞춰 다음 명령으로 아직 적용되지 않은 Migration을 반영할 수
있다.

```bash
supabase db push
```

CLI가 프로젝트에 연결되어 있지 않다면 Supabase SQL Editor에서 Migration
파일의 전체 SQL을 실행할 수 있다. 일부 프로젝트에서 SQL을 통한
`pg_cron` 활성화 권한이 제한되어 Migration이 실패하면 다음 위치에서
Cron을 먼저 활성화한 뒤 Migration을 다시 적용한다.

```text
Supabase Dashboard
→ Integrations
→ Cron
→ pg_cron 활성화
```

운영 데이터가 삭제되는 Migration이므로 적용 전에 프로젝트 백업 정책을
확인하고, 아래 미리보기 SQL로 대상을 먼저 검토한다.

## 삭제 대상 미리보기

다음 SQL은 조회만 수행하며 사용자를 삭제하지 않는다.

```sql
select
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
from auth.users
where email is not null
  and email_confirmed_at is null
  and created_at < now() - interval '24 hours'
  and last_sign_in_at is null
order by created_at asc;
```

개인정보가 포함된 결과를 외부 문서, 이슈, 채팅 또는 화면 캡처에
첨부하지 않는다.

## 수동 실행

관리자는 Supabase SQL Editor에서 다음 SQL로 기본 24시간 정책을 한 번
실행할 수 있다.

```sql
select private.cleanup_unconfirmed_auth_users(interval '24 hours');
```

반환값은 실제로 삭제된 사용자 수다. 실행 전에는 반드시 미리보기 SQL을
먼저 확인한다.

함수의 `max_age`에는 양수 interval만 전달할 수 있다. `null`, 0 또는 음수
interval은 오류로 거부된다.

## Cron Job 확인

등록된 Job을 확인한다.

```sql
select
  jobid,
  jobname,
  schedule,
  command,
  active
from cron.job
where jobname = 'cleanup-unconfirmed-auth-users';
```

중복 여부만 확인하려면 다음 SQL을 사용한다. 결과는 `1`이어야 한다.

```sql
select count(*) as job_count
from cron.job
where jobname = 'cleanup-unconfirmed-auth-users';
```

최근 실행 기록을 확인한다.

```sql
select
  jobid,
  status,
  return_message,
  start_time,
  end_time
from cron.job_run_details
order by start_time desc
limit 20;
```

`status = 'failed'`인 실행은 `return_message`, Postgres 로그와 Auth 로그를
함께 확인한다. 별도의 정리 로그 테이블은 만들지 않는다.

## 함수 권한 확인

정리 함수는 `SECURITY DEFINER`와 빈 `search_path`를 사용한다. `public`,
`anon`, `authenticated`, `service_role`에는 실행 권한을 부여하지 않으며
`private` 스키마도 API 역할에 노출하지 않는다. Cron Job을 등록한 함수
소유자만 정리 함수를 실행한다.

다음 SQL로 공개 역할에 실행 권한이 없는지 확인할 수 있다. 결과가
모두 `false`여야 한다.

```sql
select
  has_function_privilege(
    'anon',
    'private.cleanup_unconfirmed_auth_users(interval)',
    'execute'
  ) as anon_can_execute,
  has_function_privilege(
    'authenticated',
    'private.cleanup_unconfirmed_auth_users(interval)',
    'execute'
  ) as authenticated_can_execute,
  has_function_privilege(
    'service_role',
    'private.cleanup_unconfirmed_auth_users(interval)',
    'execute'
  ) as service_role_can_execute,
  exists (
    select 1
    from information_schema.routine_privileges
    where routine_schema = 'private'
      and routine_name = 'cleanup_unconfirmed_auth_users'
      and grantee = 'PUBLIC'
      and privilege_type = 'EXECUTE'
  ) as public_can_execute;
```

브라우저 Supabase Client에서 이 함수를 RPC로 호출하지 않는다. 서비스
역할 키나 SMTP 인증 정보도 이 기능에 필요하지 않다.

## Cascade 확인

현재 Migration에서 다음 두 외래 키는 이미 `ON DELETE CASCADE`다.

```text
public.profiles.id
→ auth.users.id

public.user_stage_progress.user_id
→ auth.users.id
```

실제 DB의 제약 조건은 다음 조회로 확인할 수 있다.

```sql
select
  dependent_table.relname as table_name,
  constraint_record.conname as constraint_name,
  pg_get_constraintdef(constraint_record.oid) as definition
from pg_constraint as constraint_record
join pg_class as dependent_table
  on dependent_table.oid = constraint_record.conrelid
where constraint_record.contype = 'f'
  and constraint_record.confrelid = 'auth.users'::regclass
  and constraint_record.conrelid in (
    'public.profiles'::regclass,
    'public.user_stage_progress'::regclass
  )
order by dependent_table.relname;
```

두 제약 조건 모두 정의에 `ON DELETE CASCADE`가 있어야 한다. 따라서
미인증 Auth 사용자가 삭제되면 해당 프로필과 스테이지 진행도도 함께
삭제된다.

## Storage 객체 소유권

Supabase는 사용자가 Storage 객체의 소유자인 경우 Auth 사용자 삭제를
거부할 수 있다. 일반적인 미인증 이메일 사용자는 로그인할 수 없으므로
Storage 객체를 만들 수 없어야 하며, 현재 저장소에도 별도의 Storage
버킷이나 정책이 없다.

정리 함수는 사용자를 한 명씩 삭제한다. 특정 사용자 삭제가 Storage 등
종속 데이터의 외래 키 충돌로 실패하면 그 사용자만 건너뛰고 나머지
대상은 계속 처리한다. 해당 사용자는 다음 Cron에서도 다시 대상이 된다.
Storage 정책이나 객체는 이 Migration이 변경하거나 일괄 삭제하지 않는다.

외래 키 충돌이 반복되면 Postgres 로그에서 경고와 사용자 ID를 확인하고,
해당 사용자가 소유한 객체를 보존·이관·삭제할지 운영자가 별도로
판단해야 한다. 실제 이메일 주소는 로그에 기록하지 않는다. 예상하지
못한 다른 종류의 오류는 숨기지 않으며 Cron 실행을 실패시켜
`cron.job_run_details`에 남긴다.

## 보관 시간 변경

운영 Cron의 보관 시간을 24시간에서 다른 값으로 변경하려면 기존
Migration을 수정하지 말고 새 Migration을 추가한다. 예를 들어 테스트
프로젝트에서 1시간으로 변경하려면 다음과 같이 Job 명령을 변경한다.

```sql
select cron.alter_job(
  (
    select jobid
    from cron.job
    where jobname = 'cleanup-unconfirmed-auth-users'
  ),
  command := $command$
    select private.cleanup_unconfirmed_auth_users(interval '1 hour');
  $command$
);
```

이 변경은 Cron이 전달하는 함수 인자만 바꾸며 삭제 함수 본문을 변경하지
않는다. 운영 환경에서는 Gmail SMTP 전달 지연과 사용자의 인증 시간을
고려해 지나치게 짧은 값을 사용하지 않는다.

함수를 인자 없이 수동 호출할 때도 새 기본값을 사용하게 하려면 새
Migration에서 함수 선언의 기본값도 함께 변경하고 운영 문서를
동기화한다.

```text
interval '24 hours'
→ interval '1 hour'
```

## 검사 주기 변경

10분 주기를 변경할 때도 새 Migration에서 해당 Job만 수정한다. 예를
들어 1시간마다 실행하려면 다음 SQL을 사용한다.

```sql
select cron.alter_job(
  (
    select jobid
    from cron.job
    where jobname = 'cleanup-unconfirmed-auth-users'
  ),
  schedule := '0 * * * *'
);
```

주기 변경 후에는 `cron.job` 조회로 `schedule`, `command`, `active`를
다시 확인한다.

## 안전한 테스트 절차

운영 사용자의 `created_at`을 임의로 변경하지 않는다. 다음 테스트는
격리된 테스트 Supabase 프로젝트에서 수행한다.

1. 테스트용 이메일 사용자로 회원가입하고 인증하지 않는다.
2. 24시간이 지나기 전 미리보기 결과에서 대상이 아닌지 확인한다.
3. 이메일을 인증한 별도 사용자가 삭제 대상에 포함되지 않는지 확인한다.
4. `last_sign_in_at`이 있는 사용자가 대상에 포함되지 않는지 확인한다.
5. 시간 경계 직전 사용자가 대상에 포함되지 않는지 확인한다.
6. 테스트 전용 미인증 사용자를 만든 뒤 1분 이상 기다린다.
7. 다음 SQL을 테스트 프로젝트에서만 실행한다.

```sql
select private.cleanup_unconfirmed_auth_users(interval '1 minute');
```

8. 해당 미인증 사용자와 연결된 `profiles`,
   `user_stage_progress` 행이 함께 삭제됐는지 확인한다.
9. 인증 완료 사용자와 로그인 기록이 있는 사용자가 유지되는지 확인한다.
10. Migration을 재적용한 뒤 같은 이름의 Job이 하나만 존재하는지
    확인한다.

테스트용 `interval '1 minute'`을 운영 Cron Job에 적용하지 않는다.

## 운영 전 체크리스트

- [ ] 테스트 또는 스테이징 프로젝트에서 Migration을 먼저 적용함
- [ ] Supabase Dashboard → Integrations → Cron이 활성화됨
- [ ] 삭제 대상 미리보기 결과를 검토함
- [ ] `cleanup-unconfirmed-auth-users` Job이 정확히 하나 존재함
- [ ] Job 주기가 `*/10 * * * *`임
- [ ] Job 명령의 보관 시간이 `24 hours`임
- [ ] `anon`, `authenticated`, `service_role`, `public`의 함수 실행 권한이 없음
- [ ] `profiles`와 `user_stage_progress` 외래 키가 `ON DELETE CASCADE`임
- [ ] 최근 Cron 실행 상태와 반환 메시지를 확인함
- [ ] Storage 소유권 충돌 경고가 반복되는지 확인함
- [ ] 운영 환경에서 복구 또는 백업 정책을 확인함
