# OutOfBounds Stage 1

OutOfBounds Stage 1은 폐쇄된 연구소에서 기밀 문서를 회수하고 탈출하는 웹 기반 방탈출 게임이다. Next.js가 인증·화면·HUD를 담당하고, Phaser가 이동·충돌·Room·퍼즐 실행을 담당하며, Supabase가 사용자별 진행도와 자동 저장을 관리한다.

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

기존 `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 마이그레이션 호환용으로만 인식한다. 새 환경에서는 publishable key를 사용한다. 실제 파일과 예제 파일은 값만 달라야 하며, 변수명·순서·주석·공백은 다음 명령으로 검사한다.

```powershell
npm run env:check
npm run dev
```

개발 서버는 기본 Next.js 주소인 `http://localhost:3000`에서 실행된다. `.env.local`은 Git에서 제외되며 실제 값을 커밋하거나 문서에 복사하지 않는다.

## 실행 구조

```text
Next.js StageEntryView
  → Supabase Stage 1 진행도 어댑터
  → StageOneGameHost
  → createStageOneGame
  → StageOneScene
  → Room·퍼즐 모듈
  → StageOneSession
  → StageOneSaveQueue
  → 진행도 서비스·Supabase RPC
```

| 경로 | 책임 |
| --- | --- |
| `src/components/stages/` | Stage 진입 화면, React HUD, Phaser 생명주기 |
| `src/config/` | 공개 환경변수 해석과 검증 |
| `src/game/stage-one/contracts/` | Room·이벤트·상호작용 공개 계약 |
| `src/game/stage-one/core/` | Phaser 조립, Scene, 세션, 저장 큐 |
| `src/game/stage-one/adapters/` | 게임 계약을 Supabase 진행도 서비스에 연결 |
| `src/game/stage-one/rooms/` | 장소별 Room 구현 |
| `src/game/stage-one/puzzles/` | 장소별 퍼즐 규칙과 상태 |
| `src/services/progress/` | 인증된 진행도 RPC 호출과 응답 검증 |
| `supabase/migrations/` | 저장 스키마와 RPC 변경 이력 |

Room과 퍼즐은 Supabase를 직접 참조하지 않는다. 진행 상태는 `StageOneInteractionContext`와 `StageOneProgressBridge`를 통해 세션·저장 큐로 전달하고, 구체적인 Supabase 연결은 `adapters/supabaseStageOneProgressBridge.ts`에서만 조립한다.

### 아키텍처 보호 규칙

- Room·퍼즐·게임 코어는 `contracts/`와 공통 타입에만 의존하고 Supabase SDK·진행도 서비스를 직접 가져오지 않는다.
- 외부 저장소 연결은 `adapters/`가 `StageOneProgressBridge` 계약 뒤에서 담당한다.
- 실제 Room 구현 선택과 수명 주기 조립은 `createStageOneRooms.ts`와 `createStageOneGame.ts`에 모은다.
- `architectureBoundaries.test.ts`가 별칭·상대 경로를 통한 인프라 역참조를 검사하며 `npm test`에서 자동 실행된다.

## 시각 시스템

OutOfBounds는 메인·로그인·회원가입에서 기존의 배경 이미지와 중앙형 랜딩 디자인을 유지한다. [2026 CODEGATE Layer7 체험형 웹 방탈출](https://github.com/layer7-kr/2026codegate-layer7-booth)은 스테이지 선택 이후 실제 게임 화면의 UI/UX 참고점으로만 사용한다. 참고 프로젝트의 콘텐츠·게임 규칙·코드는 복제하지 않고, 횡스크롤 시점·캔버스 일체형 HUD·월드 안 조작 안내·상호작용 표시·중앙 퍼즐 오버레이 구조를 OutOfBounds 연구소 동선에 맞게 재구성한다.

- 메인과 인증 화면은 기존 OutOfBounds 랜딩 스타일을 사용하고 시설 HUD를 섞지 않는다.
- 스테이지 선택과 실제 게임 화면은 `FacilityShell`, `--game-*` 토큰과 절제된 시설 UI를 사용한다.
- Stage HUD와 React 퍼즐 모달은 `--game-*` 색상 토큰을 사용한다.
- Phaser Room은 좌우 이동·점프·숙이기를 지원하는 횡스크롤 화면이며 제공된 SVG 캐릭터 프레임을 상태별 애니메이션으로 사용한다.
- Phaser Room과 퍼즐은 같은 팔레트와 상태 의미를 사용한다.
- 상태는 색상에만 의존하지 않고 한국어 상태 문구와 함께 표시한다.
- 과한 네온, 큰 둥근 카드와 퍼즐마다 다른 무지개 팔레트는 사용하지 않는다.

세부 색상과 적용 규칙은 [Stage 1 공통 개발 계약](./docs/stage-1.md#7-게임-시각-방향)을 기준으로 한다.

## 역할과 브랜치

| 파트 | 담당 영역 | 브랜치 |
| --- | --- | --- |
| A | 공통 Phaser·진행도·통합 | `feat/stage-1/A-10320` |
| B | 외부·입구·중앙 복도 | `feat/stage-1/B-10404` |
| C | 연구 자료실 | `feat/stage-1/C-10409` |
| D | 과학 실험실 | `feat/stage-1/D-10320` |
| E | 보안 통제실 | `feat/stage-1/E-10602` |
| F | 문서 보관실 | `feat/stage-1/F-10405` |

담당자와 세부 코드 소유 범위는 [Stage 1 공통 개발 계약](./docs/stage-1.md)을 기준으로 한다.

## 개발 명령

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm start` | 프로덕션 빌드 결과 실행 |
| `npm test` | 모든 TypeScript 단위·계약 테스트 자동 탐색 |
| `npm run env:check` | 실제·예제 환경변수 파일 구조 비교 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run lint` | ESLint 검사 |
| `npm run build` | 프로덕션 빌드 |

변경을 전달하기 전에 위의 검사 명령을 모두 실행한다. 새 테스트는 파일 목록을 수동으로 추가하지 않아도 `npm test`에서 자동으로 발견된다.

## Git 작업 흐름

```text
feat/stage-1/파트-학번 → develop/stage-1 → main
```

각 담당자는 자신의 worktree에서만 작업하고 `develop/stage-1`을 대상으로 Pull Request를 생성한다. 공통 계약이나 Room 등록 변경은 A 파트가 검토한다. 충돌 시 강제 push나 임의 rebase를 사용하지 않으며, 커밋 메시지는 `feat: 한글 설명`, `fix: 한글 설명`, `docs: 한글 설명` 형식을 사용한다.

작업을 시작할 때 현재 브랜치와 변경 상태를 확인하고, 작업 폴더가 깨끗한 경우에만 `git pull --ff-only`로 원격 변경을 반영한다. 다른 담당자의 미커밋 파일, 진행 중인 merge·rebase 또는 갈라진 브랜치는 자동으로 정리하지 않는다.

## 문서

- [Stage 1 공통 개발 계약](./docs/stage-1.md)
- [인증 운영 가이드](./docs/auth-operations.md)
- [C 파트 인수인계](./docs/C2A_handoff.md)
- [D 파트 인수인계](./docs/D2A_handoff.md)
- [F 파트 인수인계](./docs/F2A_handoff.md)
