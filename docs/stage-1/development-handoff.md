# OutOfBounds Stage 1 개발 현황 및 GPT 인수인계

> 기준일: 2026-08-08 (Asia/Seoul)
>
> 대상 범위: `develop/stage-1` 통합 기준 및 Stage 1 역할별 기능 브랜치
>
> 목적: 다른 GPT 또는 개발자가 현재 구현 상태를 오해 없이 파악하고 Stage 1 작업을 이어가기 위한 단일 인수인계 문서

## 1. 한눈에 보는 현재 상태

Stage 1의 **PM 명세, Account & Progress 기반과 A 파트 공통 Phaser 계층이 구현됐다.** 로그인한 사용자의 Stage 1 시작 결과를 공통 게임 호스트에 한 번 전달하고, Phaser Scene·플레이어·충돌·상호작용·Room 전환·React HUD·저장 재시도를 기존 Bridge 계약에 연결한다.

현재 일곱 Room은 B~F가 실제 맵과 퍼즐을 꽂을 수 있는 코드 생성형 연결 슬롯이다. 다음 작업의 중심은 저장 계약이나 A 코어를 다시 만드는 것이 아니라, 각 담당 Room 모듈을 `StageOneRoomModule` 계약에 맞춰 등록하고 전체 진행을 통합하는 것이다.

| 영역                           | 상태   | 요약                                                                |
| ------------------------------ | ------ | ------------------------------------------------------------------- |
| Stage 1 기획·진행 순서        | 완료   | 방 구조, 퍼즐 선행 조건, 역할별 책임과 인수 기준 문서화             |
| Stage 1 저장 타입·런타임 검증 | 완료   | 버전, 방 ID, 정확한 필드, 크기, 경과 시간, 선행 조건 검증           |
| 브라우저 진행도 서비스         | 완료   | 시작·불러오기·저장·클리어 전용 RPC 연동 및 오류 코드 제공        |
| Phaser 연동 브리지             | 완료   | 게임 코드가 Supabase를 직접 알지 않도록 4개 메서드로 캡슐화         |
| Stage 1 진입 처리              | 완료   | Stage 1만 전용 시작 RPC를 사용하고 다른 Stage는 기존 범용 흐름 유지 |
| Supabase 저장 스키마·RPC·RLS | 완료   | 원격 migration 적용, 권한 최소화, 서버 측 클리어 재검증             |
| TypeScript 단위 테스트         | 완료   | 상태·이동·Room·저장 큐·세션 기준 38개 통과                         |
| SQL pgTAP 통합 테스트          | 완료   | 버전 2 계약 검증 기준 57개 통과                                     |
| Phaser Scene·캐릭터·충돌     | 완료   | 클라이언트 전용 Scene, 이동·달리기·벽 충돌·카메라·일시정지 구현  |
| Room·상호작용 공통 계약      | 완료   | 일곱 Room 슬롯, 단일 대상 선택, 출입구와 B~F용 모듈 API 제공        |
| 실제 방·퍼즐 콘텐츠           | 진행 전 | B~F 담당 맵, 오브젝트, 퍼즐 판정과 연출 통합 필요                    |
| 저장 실패 재시도 UI            | 완료   | 직렬 저장, 1초·2초·4초 자동 재시도와 수동 재시도 HUD 제공          |
| 브라우저 수동 E2E·실사용자 QA | 미완료 | 신규 시작→이어하기→클리어→Stage 2 해금 전체 UI 검증 필요         |

## 2. 저장소와 외부 연결

### Git

- 원격 저장소: `https://github.com/stack1245/sunrin-vacation-project.git`
- 통합 대상 브랜치: `develop/stage-1`
- 통합 worktree: `D:/.dev/school/sunrin/방학 프로젝트/OutOfBounds/github/develop/stage-1`
- A 공통 기반 브랜치: `feat/stage-1-10320`
- A 공통 기반 worktree: `D:/.dev/school/sunrin/방학 프로젝트/OutOfBounds/github/feat/stage-1-10320`
- 원격 추적 브랜치: 각 로컬 브랜치와 같은 이름의 `origin/*`

각 역할은 독립된 브랜치와 worktree를 사용하지만 프로젝트는 모두 저장소 루트의 같은 Next.js 앱 구조를 사용한다. 학번별 프로젝트 복사본을 새로 만들지 않는다. B~F 브랜치는 A 공통 기반 커밋에서 분기하며, 역할별 소유 경로와 통합 순서는 [역할별 브랜치·worktree 운영 가이드](./branch-workflow.md)를 기준으로 한다. 기존 `dev/stage-1`, `feat/stage-1`, `assets` 브랜치는 활성 목록에서 제거했으며 고유 이력은 운영 가이드에 기록한 원격 태그로 복구할 수 있다.

### Supabase

- 원격 프로젝트 이름: `OutOfBounds`
- 프로젝트 Ref: `gokpyiorhhdqfblxwwea`
- 로컬 Supabase project ID: `main`
- PostgreSQL major version: `17`
- 연결 메타데이터: `supabase/.temp/`에 있으며 Git에서 무시됨
- 원격에 적용된 Stage 1 기반 migration: `20260803010000_add_stage_one_saves.sql`
- 원격에 적용된 저장 버전 2 migration: `20260804011248_rename_stage_one_save_contract.sql`

2026-08-04 재확인 결과 아래 네 migration의 로컬·원격 버전이 모두 일치한다.

| Local              | Remote             | 내용                                  |
| ------------------ | ------------------ | ------------------------------------- |
| `20260727010000` | `20260727010000` | 프로필 및 Stage 진행도 기반           |
| `20260727030000` | `20260727030000` | 미확인 인증 사용자 정리               |
| `20260803010000` | `20260803010000` | Stage 1 세부 저장과 전용 RPC          |
| `20260804011248` | `20260804011248` | Stage 1 저장 버전 2 및 내부 명칭 계약 |

원격 migration을 다시 Push할 필요는 없다. 새 SQL 변경이 생긴 경우에만 새 timestamp migration을 추가하고 dry-run 후 적용한다. 이미 적용된 migration 파일을 수정해 원격 이력과 불일치시키지 않는다.

## 3. 기술 스택

| 구분         | 현재 버전 또는 설정                      |
| ------------ | ---------------------------------------- |
| Node.js      | `>=22.13.0`                            |
| Next.js      | `16.2.12`, App Router, Turbopack build |
| React        | `19.2.6`                               |
| TypeScript   | `5.9.3`, strict, noEmit, incremental   |
| Phaser       | `4.2.1`                                |
| Supabase JS  | `2.110.8`                              |
| Tailwind CSS | `4.2.1`                                |
| ESLint       | `9.39.4`                               |
| 테스트       | Node 내장 test runner, Supabase pgTAP    |

Phaser 버전은 기존 합의에 따라 `4.2.1`을 유지한다. 상태 관리 라이브러리나 외부 그래픽 패키지는 아직 추가하지 않았다.

## 4. Stage 1 게임 진행 계약

### 전체 진행 순서

```text
연구소 외부
→ 키카드 획득
→ 입구 잠금 해제
→ 중앙 복도
→ 연구 자료실에서 과학 실험실 정보 획득
→ 과학 실험실 퍼즐 해결
→ 보안 통제실 정보 획득
→ 보안 통제실 퍼즐 해결
→ 문서 보관실 해금
→ 문서 보관실에서 기밀 문서 획득
→ 연구소 외부로 탈출
→ Stage 1 클리어
→ 다음 공개 스테이지(Stage 2) 해금
```

방 이동의 분기는 허용하지만 저장 플래그는 이 선행 순서를 건너뛸 수 없다. 클라이언트와 데이터베이스가 동일한 순서를 검증한다. 퍼즐의 정답 판정은 게임·퍼즐 코드의 책임이며, 진행도 계층은 “성공 판정 이후 전달된 상태”만 저장한다.

중앙 복도에서는 연구 자료실, 과학 실험실, 보안 통제실로 이동할 수 있고, 선행 조건을 충족해 해금한 뒤에는 문서 보관실로 이동할 수 있다.

### 허용되는 Room ID

| 값                   | 의미                           |
| -------------------- | ------------------------------ |
| `outside`          | 연구소 외부 및 시작·탈출 지점 |
| `entrance`         | 연구소 입구                    |
| `hallway`          | 중앙 복도                      |
| `archive`          | 연구 자료실                    |
| `science-lab`      | 과학 실험실                    |
| `control-room`     | 보안 통제실                    |
| `document-storage` | 문서 보관실                    |

사용자에게는 `STAGE_ONE_ROOM_DISPLAY_NAMES`를 통해 내부 ID 대신 한국어 장소 명칭을 표시한다.

### 저장 상태 스키마

저장 버전은 현재 `2`다. 버전 2 migration은 `user_stage_saves`의 Stage 1 행만 초기화했으며 Auth 사용자, 프로필, 전체 Stage 진행도, 클리어 기록, 최고 기록과 Stage 2 해금 상태는 건드리지 않았다. 구버전 상태를 읽거나 변환하는 런타임 호환 계층은 없다.

```ts
interface StageOneSaveState {
  version: 2;
  currentRoom: StageOneRoomId;
  hasKeycard: boolean;
  entranceUnlocked: boolean;
  archiveClueFound: boolean;
  scienceLabPuzzleSolved: boolean;
  controlRoomSolved: boolean;
  documentStorageUnlocked: boolean;
  confidentialDocumentObtained: boolean;
  escaped: boolean;
}
```

신규 상태는 `currentRoom: "outside"`이고 모든 진행 플래그가 `false`다. 다음 제약이 적용된다.

- 정확히 정의된 필드만 허용하며 누락 필드와 추가 필드를 모두 거부한다.
- 저장 버전은 `2`만 허용한다.
- Stage 1 JSON 상태는 UTF-8 기준 최대 4,096바이트다.
- `elapsedTimeMs`는 `0` 이상 `Number.MAX_SAFE_INTEGER` 이하의 안전한 정수다.
- 이미 `true`가 된 진행 플래그는 다시 `false`로 저장할 수 없다.
- 서버에 저장된 시간보다 작은 경과 시간을 가진 늦은 요청은 상태를 덮어쓰지 않는다.

## 5. 구현 구조와 호출 흐름

```text
StageEntryView
  → StageOneProgressBridge 생성 및 start() Promise 1회 재사용
  → StageOneGameHost
    → Phaser composition root
      → StageOneScene + StageOneRoomModule
        → StageOneSession + StageOneSaveQueue
          → StageOneProgressBridge
            → Stage 1 브라우저 서비스
              → Supabase public RPC
                → private 검증·초기화 함수
                  → user_stage_progress + user_stage_saves
                    → 정상 클리어 시 다음 공개 Stage 해금
```

### 핵심 클라이언트 API

게임 코드는 `createStageOneProgressBridge()`를 한 번 생성하고 아래 계약만 사용한다.

| 메서드                         | 역할                        | 중요한 동작                                                              |
| ------------------------------ | --------------------------- | ------------------------------------------------------------------------ |
| `start()`                    | 최초 시작 또는 Stage 1 진입 | 접근 권한 확인, `unlocked`→`in_progress`, 기본 저장을 없을 때만 생성 |
| `load()`                     | 이어하기 데이터 조회        | 저장 상태, 누적 시간, 진행도, `canContinue` 반환                        |
| `save(state, elapsedTimeMs)` | 방·플래그·시간 저장       | 클라이언트 런타임 검증 후 전용 RPC 호출                                  |
| `complete()`                 | Stage 1 클리어              | 서버 저장 상태를 재검증하고 최고 기록 및 다음 Stage 해금 처리            |

`StageOneProgressError`는 다음 안정적인 클라이언트 오류 코드를 제공한다.

- `AUTH_REQUIRED`
- `SERVICE_UNAVAILABLE`
- `STAGE_LOCKED`
- `INVALID_STATE`
- `NOT_READY_TO_COMPLETE`
- `REQUEST_FAILED`

현재 RPC 오류 매핑 일부는 PostgreSQL 오류 메시지의 핵심 문자열을 기준으로 한다. 서버 오류 문구를 바꾸면 클라이언트 매핑과 테스트도 함께 확인한다.

### 시작과 진입

`StageEntryView`는 로그인, 사용자 초기화, 공개 Stage, 잠금 상태를 확인한다. 조회된 Stage ID가 `1`이면 Bridge를 한 번 생성해 `bridge.start()`를 호출하고, 다른 Stage에는 기존 범용 `startStage()` 흐름을 유지한다.

현재 이 화면은 Stage 1 시작 결과와 같은 Bridge 인스턴스를 `StageOneGameHost`에 전달한다. Phaser는 브라우저 effect에서만 동적으로 로드되고, Scene은 시작 결과의 `currentRoom`, 플래그와 누적 시간을 복구하므로 불필요한 `start()`·`load()` 중복 호출이 없다.

### 자동 저장 권장 지점

- 방 이동 직후
- 키카드나 단서 획득 직후
- 각 퍼즐 해결 직후
- 기밀 문서 획득 직후
- 탈출 플래그 반영 직후

저장 실패는 게임 오버로 처리하지 않는다. 마지막 정상 저장을 유지하고 비차단 경고, 짧은 재시도 큐, 수동 재시도 수단을 제공한다.

### 클리어 순서

반드시 아래 순서를 지킨다.

1. 기밀 문서를 획득한다.
2. 연구소 외부로 탈출한다.
3. `escaped: true`인 최종 상태와 양수 누적 시간을 `save()`한다.
4. 저장 성공 후 `complete()`를 호출한다.
5. `stageTwoUnlocked` 응답에 따라 클리어 및 해금 연출을 표시한다.

일반 `save()`는 Stage 상태를 `cleared`로 바꾸지 않는다. 클라이언트가 `escaped: true`를 보냈다는 이유만으로도 클리어되지 않는다. 서버는 마지막으로 저장된 상태와 시간을 다시 읽어 검증한다.

## 6. 데이터베이스 계약과 보안

### `public.user_stage_saves`

| 항목                   | 내용                                                          |
| ---------------------- | ------------------------------------------------------------- |
| 기본 키                | `(user_id, stage_id)`                                       |
| 사용자 FK              | `auth.users(id)`, 사용자 삭제 시 cascade                    |
| Stage FK               | `public.stages(id)`, Stage 삭제 시 cascade                  |
| 주요 값                | `state`, `save_version`, `elapsed_time_ms`              |
| 시간                   | `created_at`, `updated_at`; 공통 trigger로 수정 시각 갱신 |
| 공통 상태 크기 상한    | 65,536바이트                                                  |
| Stage 1 상태 크기 상한 | 검증 함수에서 4,096바이트                                     |
| 경과 시간              | `0..9007199254740991`                                       |

`user_stage_progress`는 Stage 단위 상태, 시작·클리어·최근 플레이 시각과 최고 기록을 담당한다. `user_stage_saves`는 Stage 내부의 현재 방, 플래그, 저장 버전, 누적 시간을 담당한다. 두 책임을 섞지 않는다.

### 공개 RPC

| RPC                                                 | 권한              | 역할                                             |
| --------------------------------------------------- | ----------------- | ------------------------------------------------ |
| `get_stage_one_progress()`                        | `authenticated` | 접근 확인, 기본 저장 보장, 현재 상태 반환        |
| `start_stage_one()`                               | `authenticated` | 범용 시작 처리 후 Stage 1 저장 보장 및 상태 반환 |
| `save_stage_one_progress(jsonb, integer, bigint)` | `authenticated` | 스키마·순서·회귀·시간 검증 후 저장            |
| `complete_stage_one()`                            | `authenticated` | 서버 저장 상태로 클리어 및 다음 Stage 해금       |

기존 `complete_stage(stage_id, clear_time_ms)`도 Stage ID가 `1`이면 클라이언트의 기록 값을 신뢰하지 않고 Stage 1 서버 저장을 다시 검사하도록 강화됐다.

### 권한 원칙

- RLS가 활성화되어 사용자는 자신의 저장만 조회할 수 있다.
- `authenticated`는 테이블에 직접 `SELECT`만 할 수 있다.
- 직접 `INSERT`·`UPDATE` 권한은 부여하지 않았으며 저장은 전용 RPC를 통해 수행한다.
- 함수는 필요한 곳에서 `security definer`를 사용하고 `search_path = ''`로 고정했다.
- 함수의 `PUBLIC`·`anon` 권한을 회수하고 `authenticated`·`service_role`에 필요한 실행 권한만 부여했다.
- 사용자 ID, 진행 상태, 다음 Stage ID를 클라이언트 입력으로 받지 않는다. 현재 세션의 `auth.uid()`와 서버 데이터를 신뢰한다.
- 서비스 역할과 관리자용 자격 증명을 브라우저 코드나 문서에 넣지 않는다.

## 7. 주요 파일 지도

| 파일                                                                      | 책임                                                   |
| ------------------------------------------------------------------------- | ------------------------------------------------------ |
| `docs/stage-1/README.md`                                                | Stage 1 기획, 역할 분리, 진행 순서, PM 체크리스트      |
| `docs/stage-1/progress-integration.md`                                  | Phaser·퍼즐 담당자를 위한 저장·클리어 연동 계약      |
| `docs/stage-1/game-integration.md`                                      | B~F Room 모듈, 상호작용, 저장과 인계 계약              |
| `src/types/stage-one.ts`                                                | 저장 타입, 기본 상태, 상수, 런타임 검증                |
| `src/types/stage-one.test.ts`                                           | TypeScript 상태 검증 단위 테스트                       |
| `src/services/progress/stageOne.ts`                                     | 인증 확인, RPC 호출, 응답 파싱, 오류 코드 변환         |
| `src/game/stage-one/progressBridge.ts`                                  | Phaser가 사용할 Supabase 비의존 인터페이스             |
| `src/game/stage-one/contracts/*.ts`                                     | Room·이벤트·HUD 공통 타입                              |
| `src/game/stage-one/core/StageOneScene.ts`                              | 플레이어, 충돌, 입력, 상호작용과 Room 전환              |
| `src/game/stage-one/core/stageOneSession.ts`                            | 상태·타이머·클리어 순서                                |
| `src/game/stage-one/core/saveQueue.ts`                                  | 저장 직렬화와 1초·2초·4초 재시도                       |
| `src/game/stage-one/core/referenceRooms.ts`                             | B~F 콘텐츠가 교체할 일곱 Room 연결 슬롯                 |
| `src/components/stages/StageEntryView.tsx`                              | Stage 접근 확인 및 Stage 1 전용 시작 연결              |
| `src/components/stages/StageOneGameHost.tsx`                            | Phaser 생명주기, ResizeObserver와 React HUD             |
| `src/types/database.ts`                                                 | `user_stage_saves`와 Stage 1 RPC의 정적 DB 타입      |
| `supabase/migrations/20260803010000_add_stage_one_saves.sql`            | 테이블, 검증, RPC, RLS, 권한, Stage 2 해금             |
| `supabase/migrations/20260804011248_rename_stage_one_save_contract.sql` | 버전 2 상태, 새 내부 키, Stage 1 세부 저장 초기화      |
| `supabase/tests/stage_one_progress.sql`                                 | 인증·권한·검증·멱등성·클리어를 다루는 pgTAP 테스트 |

## 8. 검증 현황

### 2026-08-08 A 파트 공통 기반 재검증

| 검사 | 결과 |
| --- | --- |
| `npm test` | 성공, 상태·이동·Room·저장 큐·세션 38/38 통과 |
| `npm run typecheck` | 성공 |
| `npm run lint` | 성공 |
| `npm run build` | 성공, SSR 중 Phaser 전역 접근 오류 없음 |
| 브라우저 런타임 | 캔버스 1개, 960×540 내부 해상도, HUD·일시정지·재개·정리 정상 |
| 브라우저 콘솔 | 경고·오류 없음 |

브라우저 런타임 검증은 실제 계정이나 Supabase 데이터를 변경하지 않는 임시 Bridge로 같은 `StageOneGameHost`를 실행했다. 검증 뒤 임시 페이지를 삭제했으며 최종 소스에는 포함되지 않는다.

### 2026-08-04 문서 작성 시 재검증

| 검사                                 | 결과                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `npm test`                         | 성공, 25/25 통과                                                              |
| `npm run typecheck`                | 성공                                                                          |
| `npm run lint`                     | 성공                                                                          |
| `npm run build`                    | 성공, 정적 8개 페이지와 동적 `/stages/[slug]` 생성                          |
| `supabase migration list --linked` | 성공, 로컬·원격 migration 4개 일치                                           |
| Git 상태                             | 검사 시작 시 `feat/stage-1`과 `origin/feat/stage-1` 일치, 작업 트리 깨끗함 |

### 데이터베이스 검증 이력

Stage 1 저장 버전 2 migration 적용 시 아래 검증을 통과했다.

- 로컬 `supabase db reset`: 성공
- `supabase test db`: pgTAP 57/57 통과
- 로컬 `public,private` DB lint: 오류 없음
- 원격 `public,private` DB lint: 오류 없음
- 원격 스키마 읽기 검증: 테이블, PK·FK, 제약, RLS, 정책, 권한, 빈 `search_path`, 강화된 `complete_stage` 확인
- 적용 후 `supabase db push --dry-run`: 원격 DB가 최신 상태임을 확인

2026-08-04 최종 재검증에서도 아래 명령이 원격 스키마 분석을 완료했으며 경고와 오류를 보고하지 않았다.

```powershell
supabase db lint --linked --schema public,private --level warning --fail-on warning
```

비밀번호나 토큰 값을 문서, Git, 터미널 출력에 남기지 않는다.

## 9. 실행과 검증 명령

### 환경 설정

`.env.example`을 참고해 로컬의 `.env.local`에 다음 공개 클라이언트 값만 설정한다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

`.env.local`, `supabase/.temp/`, 빌드 결과와 캐시는 Git에서 무시된다. 실제 키 값은 공유 문서에 복사하지 않는다.

### 애플리케이션

```powershell
npm ci
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```

### Supabase

```powershell
supabase migration list --linked
supabase db push --dry-run
supabase start
supabase test db
supabase db lint --local --schema public,private --level warning --fail-on warning
supabase stop --backup
```

`supabase db reset`은 로컬 DB 데이터를 다시 만들기 때문에, 기존 로컬 테스트 데이터가 필요한지 확인한 뒤에만 실행한다. 원격 `db push`는 반드시 migration 목록과 dry-run을 먼저 확인한다.

## 10. 다음 구현 우선순위

### 완료: Phaser 뼈대와 Scene 생명주기

- Phaser 클라이언트 전용 동적 로드, 게임·Scene·Bridge 생명주기
- 플레이어 이동·달리기·벽 충돌·카메라·단일 상호작용 대상
- 일곱 Room 연결 슬롯과 출입구 접근 조건
- `currentRoom`, 진행 플래그와 누적 시간 복구
- React HUD, 일시정지, 저장 상태와 수동 재시도
- 직렬 저장, 1초·2초·4초 자동 재시도와 최종 저장 후 클리어 호출

### 1순위: B 외부·입구·중앙 복도 통합

- `referenceRooms`의 외부·입구·복도 슬롯을 B Room 모듈로 교체한다.
- 키카드, 입구 잠금장치, 이동 게이트와 외부 탈출 상호작용을 공통 API에 연결한다.
- 실제 맵 충돌 영역과 Room spawn 위치를 확인한다.

### 2순위: C→D→E→F Room·퍼즐 통합

- 각 담당 모듈을 `StageOneRoomModule`로 등록한다.
- 퍼즐 성공 뒤 `updateProgress()`로 합의된 플래그만 저장한다.
- F의 기밀 문서 획득을 B의 외부 탈출과 A의 `completeEscape()`에 연결한다.
- Stage 2 해금 응답과 최종 연출을 연결한다.

### 3순위: 통합 QA

- 신규 사용자 시작
- 같은 계정으로 새로고침·재접속 후 이어하기
- 네트워크 저장 실패와 재시도
- 이전 저장보다 오래된 비동기 요청 도착
- 잘못된 진행 순서 거부
- `science-lab`과 `document-storage`가 각각 과학 실험실과 문서 보관실로 표시되는지 확인
- 탈출 전 클리어 거부
- 정상 클리어와 Stage 2 해금
- 중복 클리어 시 최초 클리어 시각 및 최고 기록 보존
- 다른 사용자 저장 접근 차단
- 데스크톱·모바일 입력과 화면 크기
- 기존 로그인·회원가입·Stage 목록·다른 Stage 흐름 회귀

## 11. 변경 금지 및 주의사항

- Phaser Scene이나 퍼즐 코드에서 Supabase 클라이언트 또는 테이블 이름을 직접 import하지 않는다.
- 클라이언트에서 `user_stage_saves`나 `user_stage_progress`를 직접 수정하지 않는다.
- 사용자 ID, Stage 상태, 다음 Stage ID, 최고 기록을 클라이언트가 결정하게 만들지 않는다.
- `start()` 또는 `load()`를 재호출할 때 기존 저장을 기본 상태로 덮어쓰지 않는다.
- 저장 실패 상태에서 `complete()`를 먼저 호출하지 않는다.
- Stage 1에서는 범용 `completeStage(stageId, clearTimeMs)`보다 전용 브리지의 `complete()`를 사용한다.
- `science-lab`, `document-storage`와 버전 2 JSON 필드는 현재 저장 계약이므로 임의로 rename하지 않는다.
- 저장 버전을 올리지 않고 상태 필드를 변경하지 않는다.
- 이미 원격 적용된 migration을 수정하지 말고 새 migration을 추가한다.
- `.env.local`, DB 비밀번호, 토큰, 서비스 역할 키를 커밋하지 않는다.
- Phaser 버전이나 핵심 패키지를 근거 없이 업그레이드하지 않는다.
- 사용자 지시 없이 worktree 병합, force push, 기존 커밋 삭제를 수행하지 않는다.

## 12. 알려진 결정 필요 사항

다음 항목은 기반 계층의 오류가 아니라 게임 담당과 PM이 후속 구현 전에 확정해야 할 정책이다.

- 이미 Stage 1을 클리어한 사용자의 재플레이를 기존 저장에서 시작할지, 별도 초기화 기능을 제공할지
- 모바일 입력 방식을 가상 패드, 탭 이동, 포인터 상호작용 중 무엇으로 할지
- 퍼즐 실패 패널티와 실패 상태를 영구 저장할지
- 클리어 후 Stage 2로 바로 이동할지 Stage 목록으로 돌아갈지

현재 공통 정책은 자동 저장 실패 시 1초·2초·4초로 세 번 재시도하고 최종 실패를 HUD에서 수동 재시도하는 방식이다. Escape 일시정지 중에는 경과 시간을 멈춘다. 정책 변경이 필요하면 A 세션과 테스트를 함께 변경한다.

`canContinue`는 Stage 진행 상태가 `in_progress`일 때만 `true`다. 버전 2 전환 migration의 의도적 초기화 이후에는 런타임에서 저장을 임의로 초기화하지 않는다.

## 13. 다음 GPT에게 전달할 작업 지시 예시

```text
docs/stage-1/development-handoff.md를 현재 사실 기준으로 읽고,
docs/stage-1/README.md, progress-integration.md와 game-integration.md의 계약을 보존해 작업해 줘.

docs/stage-1/branch-workflow.md에서 내 역할 브랜치와 worktree를 확인하고,
저장소 루트의 단일 프로젝트에서 담당 경로만 수정해. 다른 역할 worktree는 수정하지 마.
Phaser/퍼즐 코드에서는 Supabase를 직접 호출하지 말고 StageOneProgressBridge만 사용해.
장소는 사용자에게 과학 실험실과 문서 보관실로 표시하고, 저장 키는 science-lab과
document-storage 및 버전 2 JSON 필드만 사용해.
먼저 git status와 관련 파일을 확인하고, 구현 후 npm test/typecheck/lint/build 및 필요한
Supabase 테스트를 수행해. 관련 파일만 커밋하고 현재 역할 브랜치와 같은 이름의 원격 브랜치에 push해 줘.
```

## 14. 관련 상세 문서

- [Stage 1 개발 명세](./README.md)
- [Stage 1 진행도 연동 가이드](./progress-integration.md)
- [Stage 1 Phaser·Room 통합 가이드](./game-integration.md)
- [Stage 1 역할별 브랜치·worktree 운영 가이드](./branch-workflow.md)
- [Supabase Gmail SMTP 설정](../supabase-gmail-smtp.md)
- [미확인 사용자 정리](../unconfirmed-user-cleanup.md)
