# OutOfBounds

OutOfBounds는 인증된 사용자가 스테이지를 순서대로 해금하며 퍼즐을 진행하는 웹 기반 방탈출 프로젝트다. Next.js 애플리케이션과 Supabase 인증·진행도 저장을 하나의 저장소에서 관리한다.

## 빠른 시작

### 요구 사항

- Node.js 22.13.0 이상
- npm
- Supabase 프로젝트의 공개 연결 정보

### 설치와 실행

```powershell
npm ci
Copy-Item .env.example .env.local
```

`.env.local`에 Supabase Dashboard의 Connect 화면에서 확인한 공개 값을 입력한다.

| 변수 | 필수 | 용도 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 예 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 예 | 브라우저용 publishable key |

환경변수 파일은 값만 달라야 한다. 변수명, 순서, 주석과 공백은 다음 명령으로 확인한다.

```powershell
npm run env:check
npm run dev
```

개발 서버는 기본 Next.js 주소인 `http://localhost:3000`에서 실행된다. `.env.local`은 Git에서 제외되며 실제 값을 커밋하지 않는다.

## 주요 기능

- Supabase PKCE 기반 회원가입·로그인·이메일 확인
- 공개 여부와 사용자 진행 상태를 반영한 스테이지 목록
- 스테이지 시작·클리어 기록과 다음 스테이지 해금
- 브라우저 환경 설정의 안전한 누락 처리

## 프로젝트 구조

```text
src/
├─ app/                 Next.js App Router 페이지
├─ components/          인증·홈·스테이지 UI
├─ config/              공개 환경변수 해석과 검증
├─ lib/supabase/        Supabase 브라우저 클라이언트
├─ services/progress/   스테이지 진행도 유스케이스
└─ types/               데이터베이스와 도메인 타입
supabase/
├─ migrations/          데이터베이스 변경 이력
└─ tests/               Supabase SQL 검증
```

UI는 Supabase 클라이언트를 직접 생성하지 않고 `src/lib/supabase/client.ts`의 단일 브라우저 클라이언트를 사용한다. 환경변수 해석은 `src/config/supabasePublicConfig.ts`에서 담당한다.

## 개발 명령

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm test` | Node 기반 단위 테스트 실행 |
| `npm run env:check` | 실제·예제 환경변수 파일 구조 비교 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run lint` | ESLint 검사 |
| `npm run build` | 프로덕션 빌드 |

변경을 전달하기 전에 테스트, 환경변수 구조 검사, 타입 검사, 린트와 빌드를 모두 확인한다.

## 관련 문서

- [인증 운영 가이드](./docs/auth-operations.md)

Stage 1 기능 개발은 `feat/stage-1/파트-학번 → develop/stage-1 → main` 순서의 Pull Request로 통합한다. 기능 브랜치에서 검증을 마친 뒤 `develop/stage-1`을 대상으로 PR을 생성하며, 커밋 메시지는 `feat: 한글 설명`, `fix: 한글 설명`과 같은 형식을 사용한다.
