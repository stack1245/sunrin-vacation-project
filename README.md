# OutOfBounds

OutOfBounds는 경계 밖으로 나아가는 스토리형 웹 방탈출 게임이다. 현재 `main` 브랜치는 반응형 메인 페이지와 Supabase 기반 회원가입·로그인·이메일 확인 기능을 제공하며, 실제 게임 Stage는 Stage별 개발 브랜치에서 완성한 뒤 통합한다.

## 현재 범위

- `/` 메인 랜딩 페이지와 로그인 상태 표시
- `/login`, `/signup` 계정 화면
- `/auth/confirm` PKCE 이메일 인증 처리
- 인증 메일 재전송과 로그아웃
- 로그인 여부를 확인하는 `START` 버튼
- 미확인 계정 정리용 Supabase 마이그레이션

로그인한 사용자가 `START`를 선택하면 `/stages`로 이동한다. 이 경로의 실제 Stage 목록과 게임은 현재 `main`에 포함되어 있지 않으며, Stage 개발 완료 후 통합한다.

## 요구 사항

- Node.js 22.13.0 이상
- npm
- Supabase 프로젝트의 공개 연결 정보

## 빠른 시작

```powershell
npm ci
Copy-Item .env.example .env.local
npm run env:check
npm run dev
```

이미 `.env.local`이 있다면 복사하지 않고 기존 파일을 사용한다. 개발 서버는 기본 Next.js 주소인 `http://localhost:3000`에서 실행된다.

### 환경변수

| 변수 | 필수 | 용도 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 예 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 예 | 브라우저용 publishable key |

실제 값은 Git에서 제외된 `.env.local`에만 입력한다. `.env.example`에는 공개 가능한 예시만 유지하고, 두 파일의 변수명·순서·주석·공백은 `npm run env:check`로 확인한다.

## 개발 명령

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | Next.js 개발 서버 실행 |
| `npm test` | 단위·아키텍처 경계 테스트 실행 |
| `npm run env:check` | 실제·예제 환경변수 구조 비교 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run lint` | ESLint 검사 |
| `npm run build` | 프로덕션 빌드 생성 |
| `npm start` | 프로덕션 빌드 실행 |

변경을 전달하기 전에 환경변수 구조, 테스트, 타입, 린트와 프로덕션 빌드를 모두 확인한다.

## 구조와 경계

```text
src/app/                    App Router 페이지와 전역 레이아웃
src/components/auth/        로그인·회원가입·이메일 확인 UI
src/components/common/      메인 페이지 공통 UI
src/components/home/        메인 페이지의 인증 확인 동작
src/config/                 공개 Supabase 환경변수 해석
src/lib/auth/               인증 리디렉션 규칙
src/lib/supabase/           Supabase 브라우저 클라이언트와 오류 변환
supabase/migrations/        인증 운영 마이그레이션
docs/auth-operations.md     SMTP와 미확인 계정 정리 운영 가이드
```

인증 UI는 `src/lib/supabase/`의 브라우저 클라이언트를 통해 Supabase Auth만 사용한다. 사용자 표시명은 회원가입 시 저장한 인증 메타데이터에서 읽으며, Stage 진행도 서비스나 Stage 데이터베이스 테이블을 직접 참조하지 않는다. 이 경계는 `authBoundaries.test.ts`에서 자동으로 검사한다.

## 인증 운영

Supabase Dashboard에는 로컬과 운영 환경의 `/auth/confirm` 주소를 허용된 Redirect URL로 등록해야 한다. SMTP 설정, 인증 메일 확인 절차와 미확인 사용자 정리 정책은 [인증 운영 가이드](./docs/auth-operations.md)를 따른다.

## 브랜치 운영

```text
기능 브랜치 → develop/stage-1 또는 develop/stage-2 → main
```

`main`은 메인 페이지·인증 기준과 통합이 완료된 결과만 유지한다. Stage 구현과 검증은 해당 `develop/stage-*` 브랜치와 기능별 worktree에서 진행한다.
