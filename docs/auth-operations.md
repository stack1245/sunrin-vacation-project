# 인증 운영 가이드

이 문서는 OutOfBounds의 인증 메일과 미확인 사용자 정리 작업에 필요한 운영 계약만 모아 둔다. 실제 비밀값은 저장소, 문서, 이슈 또는 채팅에 남기지 않는다.

## 1. 보안 원칙

- 애플리케이션에는 Supabase 공개 연결 정보만 둔다.
- SMTP 비밀번호, 서비스 역할 키, 개인용 토큰은 Git에 커밋하지 않는다.
- 실제 값은 Git에서 제외된 `.env.local`과 서비스 대시보드에서만 관리한다.
- `.env.example`은 변수명·순서·주석을 `.env.local`과 동일하게 유지하되 안전한 예시값만 사용한다.
- 환경변수를 바꾼 뒤에는 `npm run env:check`로 구조를 확인한다.

## 2. Supabase Gmail SMTP

### 대시보드 설정

Supabase Dashboard의 Auth SMTP 설정에 다음 값을 사용한다.

| 항목 | 값 |
| --- | --- |
| SMTP 호스트 | `smtp.gmail.com` |
| SSL 포트 | `465` |
| STARTTLS 포트 | `587` |
| 사용자명 | 발신 Gmail 주소 |
| 비밀번호 | Google 앱 비밀번호 |
| 발신자 주소 | 사용자명과 같은 Gmail 주소 |

Gmail 계정에서 2단계 인증을 활성화한 뒤 앱 비밀번호를 발급한다. 일반 Google 계정 비밀번호를 SMTP 비밀번호로 사용하지 않는다.

### URL 설정

로컬 개발 환경은 다음 주소를 등록한다.

```text
Site URL: http://localhost:3000
Redirect URL: http://localhost:3000/auth/confirm
```

운영 환경에는 실제 HTTPS 도메인과 같은 도메인의 `/auth/confirm` 경로를 추가한다. 메일 템플릿은 Supabase가 제공하는 `{{ .ConfirmationURL }}` 변수를 유지한다.

### 확인 절차

1. 신규 주소로 회원가입한다.
2. 받은 메일의 인증 링크가 `/auth/confirm`으로 연결되는지 확인한다.
3. 인증 전 로그인 차단과 인증 후 로그인 성공을 확인한다.
4. 인증 메일 재전송과 화면의 60초 재전송 대기 시간을 확인한다.
5. 로컬과 운영 환경에서 각각 한 번씩 확인한다.

메일이 오지 않으면 SMTP 인증, 앱 비밀번호, 발신자 주소, Supabase 메일 로그, Gmail 스팸함과 발송 제한을 차례로 확인한다.

## 3. 미확인 사용자 자동 정리

정리 정책은 다음과 같다.

| 항목 | 기준 |
| --- | --- |
| 대상 | 이메일이 있고 인증되지 않았으며 로그인 기록이 없는 계정 |
| 보존 시간 | 생성 후 24시간 |
| 실행 주기 | 10분마다 |
| 데이터 처리 | `auth.users` 삭제에 연결된 데이터는 외래 키 정책에 따라 처리 |

구현은 `supabase/migrations/20260727030000_cleanup_unconfirmed_auth_users.sql`에 있다.

- 함수: `private.cleanup_unconfirmed_auth_users(max_age interval default interval '24 hours')`
- Cron 작업: `cleanup-unconfirmed-auth-users`
- 일정: `*/10 * * * *`

### 배포 전 점검

운영 프로젝트에 적용하기 전에 백업 정책을 확인하고 삭제 후보를 먼저 조회한다.

```sql
select id, email, created_at
from auth.users
where email is not null
  and email_confirmed_at is null
  and created_at < now() - interval '24 hours'
  and last_sign_in_at is null
order by created_at;
```

Supabase Cron 기능이 비활성화된 프로젝트는 Dashboard의 Integrations에서 Cron을 먼저 활성화한다. 그다음 마이그레이션을 적용한다.

```text
supabase db push
```

### 운영 확인

```sql
select private.cleanup_unconfirmed_auth_users(interval '24 hours');

select jobid, jobname, schedule, active
from cron.job
where jobname = 'cleanup-unconfirmed-auth-users';

select status, return_message, start_time, end_time
from cron.job_run_details
where jobid = (
  select jobid
  from cron.job
  where jobname = 'cleanup-unconfirmed-auth-users'
)
order by start_time desc
limit 10;
```

정리 함수는 `SECURITY DEFINER`로 실행되며 검색 경로를 비워 둔다. `public`, `anon`, `authenticated`, `service_role`에는 실행 권한을 부여하지 않는다. `profiles`, `user_stage_progress`처럼 사용자 ID를 참조하는 테이블은 삭제 정책을 확인하고, Storage 객체처럼 자동 삭제되지 않을 수 있는 리소스는 별도로 점검한다.

정책이나 실행 주기를 바꿀 때 기존 마이그레이션을 수정하지 말고 새 마이그레이션을 추가한다. 삭제 로직은 운영 데이터에 적용하기 전에 격리된 프로젝트에서 검증한다.
