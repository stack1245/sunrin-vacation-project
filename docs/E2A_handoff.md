# E → A 인수인계서

**보안 통제실 (Control Room)**

| | |
| --- | --- |
| 보내는 파트 | **E** · 10602 김보민 |
| 받는 파트 | **A** · 10320 탁도형 (공통 Phaser / 통합) |
| 참조 | **F** · 10405 김지산 (문서 보관실) · **D** · 10514 이동혁 (과학 실험실) |
| 브랜치 | `feat/stage-1/10602` |
| 커밋 | `77dea2f` |
| 기준일 | 2026-08-08 |

가짜 F12, 가상 쿠키·콘솔, OTP 인증, 문서 보관실 해금까지 구현과 검증을 마쳤습니다.
A 파트에서 처리가 필요한 항목은 **2건**입니다(§2).

---

## 1. 한눈에 보기

| 항목 | 상태 |
| --- | --- |
| 구현 | 담당 기능 7가지 전부 완료 |
| 자동 테스트 | **115 / 115 통과** (E 파트 신규 77개 포함) |
| 타입 검사 · 린트 | 오류 0건 |
| 프로덕션 빌드 | 성공 |
| A 처리 대기 | 2건 — Room 연결, `package.json` 확인 |
| 실기기 화면 확인 | 미완 — 통제실까지 도달할 경로가 아직 없음(§7) |

---

## 2. A 파트에 요청

둘 다 A 소유 파일이라 통합 명세 5.3(공통 파일 변경 요청) 규칙에 따라 직접 수정하지 않았습니다.

### 요청 1 — 보안 통제실을 게임에 연결

현재 `createStageOneGame` 의 `rooms` 기본값이 참조 슬롯이라, 통제실에 들어가도
`ROOM MODULE SLOT · 담당 파트 콘텐츠 연결 대기` 화면만 나옵니다.

```ts
import { controlRoomRoom } from "@/game/stage-one/rooms/control-room";

createStageOneGame({
  rooms: [...다른방들, controlRoomRoom],
});
```

- Room ID `control-room`, 표시명 `보안 통제실`, 복도 출입구 좌표 `(110, 270)` 은
  A의 참조 맵과 동일하게 맞춰두었습니다.
- `StageOneRoomModule` 계약을 그대로 만족합니다. 별도 어댑터가 필요 없습니다.
- 임시로 연결해 **프로덕션 빌드 성공까지 확인**한 뒤 원상복구했습니다. 연결만 하면 즉시 동작합니다.

### 요청 2 — `package.json` 변경 확인

`test` 스크립트 뒤에 E 파트 테스트 파일 8개를 덧붙였습니다. 기존 항목은 순서·내용 모두 그대로입니다.

그 외 `progressBridge.ts`, `src/types/stage-one.ts`, contracts, core 파일은 **일절 수정하지 않았습니다.**

---

## 3. 완료 이벤트 계약 (핵심 인계 항목)

한 patch로 두 플래그를 함께 저장하지 않고 **단계를 나눠 각각 저장**합니다.
1단계만 반영된 중간 상태에서 다시 들어와도 2단계만 이어서 복구됩니다.

### 3.1 `controlRoomSolved`

| 항목 | 내용 |
| --- | --- |
| **이벤트 이름** | `controlRoomSolved` (상수 `CONTROL_ROOM_SOLVED_EVENT`) |
| **입력 데이터** | `{ event, roomId: "control-room", source: "otp-verification", failedAttempts: number, savedFlags: ["controlRoomSolved"] }` |
| **완료 조건** | `verifyControlRoomOtp()` 통과(형식 + 값 일치) **그리고** `scienceLabPuzzleSolved === true` |
| **저장 시점** | 검증 성공 직후 `updateProgress({ controlRoomSolved: true })` 단독 저장 |
| **실패 처리** | 오답: 시도 1회 소모(최대 5회, 초과 시 단말 잠금 후 닫힘 · 재접속 시 초기화), 플래그 무변화 · 형식 오류: 시도 미소모 · 저장 예외: 이벤트 미발행, 단말 유지, 재시도 가능 |
| **중복 호출** | 이미 `true` 면 재저장 없이 2단계로 건너뜀 |
| **자동 테스트** | `completionFlow.test.ts`, `controlRoomPuzzle.test.ts` |

### 3.2 `documentStorageUnlocked`

| 항목 | 내용 |
| --- | --- |
| **이벤트 이름** | `documentStorageUnlocked` (상수 `DOCUMENT_STORAGE_UNLOCKED_EVENT`) |
| **입력 데이터** | `{ event, roomId: "control-room", unlockedRoomId: "document-storage", source: "auto-after-solve" \| "console-lockdown-release", savedFlags: ["documentStorageUnlocked"] }` |
| **완료 조건** | `controlRoomSolved` 가 상태에 확정된 뒤에만 발행 |
| **저장 시점** | 1단계와 분리된 2단계 커밋으로 `updateProgress({ documentStorageUnlocked: true })` 단독 저장 |
| **실패 처리** | 2단계 실패 시 1단계는 유지(회귀 없음). 단말 · 봉쇄 패널 · `lockdown.release()` 로 2단계만 재시도(`resumed`) |
| **중복 호출** | 두 플래그 모두 `true` 면 `already-complete` 로 저장 0회 · 동시 호출은 in-flight Promise 재사용으로 병합 |
| **자동 테스트** | `completionFlow.test.ts`, `controlRoomRoom.test.ts` |

### 3.3 커밋 결과 분류

| 결과 | 의미 | 저장 횟수 |
| --- | --- | --- |
| `completed` | 1·2단계 모두 이번 호출에서 수행 | 2 |
| `resumed` | 1단계는 이미 완료, 2단계만 수행 | 1 |
| `already-complete` | 둘 다 완료됨 | 0 |
| `blocked` | 선행 조건 미충족, 저장 시도 안 함 | 0 |
| `failed` | 저장 계층 예외 또는 플래그 미반영 | 0~1 |

### 3.4 F 파트가 소비하는 방식

**별도 이벤트 구독이 필요 없습니다.** 저장 상태의 `state.documentStorageUnlocked` 가 `true` 인지만
확인하면 됩니다. A의 참조 Room이 이미 같은 방식으로 `document-storage` 접근을 제어하고 있습니다.

페이로드가 필요하면 통합 지점에서 `ControlRoomCompletionFlow` 생성자의 `onEvent` 리스너를 연결하면 됩니다.

---

## 4. 구현 범위와 소유 경로

| 기능 | 파일 |
| --- | --- |
| 보안 통제실 맵 · 상호작용 | `rooms/control-room/controlRoomRoom.ts` |
| 가짜 F12 렌더링 · 키 입력 | `rooms/control-room/fakeDevtoolsOverlay.ts` |
| 단말 세션 수명 관리 | `rooms/control-room/terminalSession.ts` |
| 맵 배치 상수 | `rooms/control-room/layout.ts` |
| 퍼즐 상태 머신 | `puzzles/control-room/controlRoomPuzzle.ts` |
| 가상 쿠키 저장소 | `puzzles/control-room/virtualCookieJar.ts` |
| 가상 콘솔 | `puzzles/control-room/virtualConsole.ts` |
| OTP 파생 · 검증 | `puzzles/control-room/otp.ts` |
| 완료 이벤트 커밋 | `puzzles/control-room/completionFlow.ts` |
| 화면 표현 변환 | `puzzles/control-room/viewModel.ts` |
| 퍼즐 데이터 | `puzzles/control-room/puzzleData.ts` |

계층은 **퍼즐(순수 도메인) → 뷰모델 → Phaser 어댑터** 단방향입니다.
퍼즐 계층은 Phaser·DOM·브라우저 API를 타입으로도 참조하지 않아 Node 테스트로 전 시나리오를 재현합니다.

```text
src/game/stage-one/rooms/control-room/**
src/game/stage-one/puzzles/control-room/**
docs/E2A_handoff.md
docs/stage-1/control-room-handoff.md
```

다른 파트(A~D, F) 소유 경로는 수정하지 않았습니다.

### 상호작용

| ID | 역할 | 잠금 조건 |
| --- | --- | --- |
| `control-room-terminal` | 가짜 F12를 열어 OTP 인증 수행 | `scienceLabPuzzleSolved` |
| `control-room-lockdown-panel` | 봉쇄 상태 확인 · 2단계 재시도 | 없음 (상태별 안내) |
| `control-room-notice` | 보안 수칙 힌트 열람 | 없음 |

---

## 5. Phaser 공통 계약 준수 방식

| 계약 | 준수 방식 |
| --- | --- |
| SSR 중 `window`·`document` 미접근 | Room·퍼즐 어디에도 브라우저 전역 접근 없음. Phaser 동적 로드는 A의 게임 호스트가 담당 |
| 게임·Scene·Bridge 중복 생성 금지 | Room은 인스턴스를 만들지 않음. 단말 세션은 중복 `start()` 를 자체 차단 |
| unmount 시 정리 | `mount()` 정리 함수 → `terminalSession.dispose()` → 오버레이 오브젝트·`keydown` 리스너 전부 해제 |
| 이동·충돌·상호작용·방 전환·HUD | 전부 A 공통 기능 사용. 별도 HUD 없음 |
| Room·퍼즐 공통 인터페이스 사용 | `StageOneRoomModule` · `StageOneInteractionContext` 만 사용 |
| Supabase 직접 import 금지 | 정적 스캔 테스트로 자동 차단(§6) |
| 픽셀 렌더링 · 반응형 | 오버레이를 공통 월드 960×540 안에 `setScrollFactor(0)` 로 고정 배치. FIT 스케일에서 잘리지 않음 |

### 모달 중 이동 정지 방식

A의 `runInteraction()` 이 `onInteract` 가 반환한 Promise를 기다리는 동안 `interactionRunning` 을
유지하며 플레이어 속도를 0으로 고정합니다. 단말이 닫힐 때까지 이 Promise를 미결로 두어
**공통 계약을 바꾸지 않고** 모달 동안 이동·재상호작용을 차단했습니다. 별도 입력 잠금 코드가 없습니다.

---

## 6. 실제 브라우저와의 격리 (파트 E 핵심 제약)

가짜 F12·가상 쿠키·가상 콘솔은 실제 브라우저 저장소나 개발자 도구 권한과 완전히 분리했습니다.
규칙을 문서로만 남기지 않고 **테스트가 소스를 정적 스캔해 강제**합니다
(`puzzles/control-room/isolation.test.ts`).

```text
# 통제실 코드에서 금지 — 코드에 들어오면 npm test 실패
document.cookie   localStorage   sessionStorage   indexedDB
console.log       debugger       "F12" 키 바인딩
supabase          user_stage_saves          .rpc(

# 계층별 추가 규칙
퍼즐 계층   Phaser를 타입으로도 참조하지 않음
Room 계층   `import type Phaser` 만 허용
```

- 가상 쿠키는 메모리 `Map` 입니다. 진행도 저장에 포함되지 않습니다.
- 가상 콘솔 로그는 배열 버퍼입니다. 전역 `console` 을 호출하지 않습니다.
- 가짜 DevTools 창은 Phaser 도형·텍스트로만 그려지며, **실제 F12 키를 바인딩하지 않습니다.**
  브라우저 기본 동작을 가로채지 않기 위해서입니다.
- 가상 네트워크 탭은 정적 텍스트입니다. 실제 fetch/XHR을 발생시키지 않습니다.
- 저장은 전부 `context.updateProgress()` 를 거쳐 세션 → 저장 큐 → `progressBridge` 로만 흐릅니다.

---

## 7. 퍼즐 흐름과 정답

```text
보안 단말(E 키) → 가짜 F12 열림

  콘솔 탭     help / cookie.list() / cookie.get(name) / net.list()
              otp.rule() / otp.verify(code) / lockdown.status()
              lockdown.release() / clear / exit
  쿠키 탭     sec.session(마스킹) · sec.shift · sec.lockdown 등 5종
  네트워크 탭  OTP 발급 규칙 · 봉쇄 상태 힌트 4건
  인증 탭     숫자 6자리 입력 + Enter

  Tab 탭이동 · Enter 실행 · Backspace 지움 · Q 또는 exit 로 닫기
```

정답 도출 규칙:

```text
otp = base ++ check
  base  = dec(sec.session) 의 마지막 3자리
  check = (base 각 자리 합 × sec.shift) mod 1000, 3자리 0채움
```

기본 데이터(`seedHex: "1A4"`, `shift: 7`) 기준 정답은 `420042` 입니다.
**코드에 하드코딩되어 있지 않으며** 테스트가 같은 규칙으로 재계산해 검증합니다.

> **D 파트 연동 지점** — `CONTROL_ROOM_OTP_CONFIG.shift` 를 과학 실험실이 인계하는
> "보안 통제실 코드 단서"와 연결할 수 있습니다. D의 값이 확정되면 `puzzleData.ts` 의
> 상수만 교체하면 되고, 확정 전까지는 통제실 안내판과 네트워크 로그가 같은 값을
> 자체 제공해 퍼즐이 독립적으로 완결됩니다.

### 현재 화면 확인이 불가능한 이유

통제실까지 가려면 앞의 세 구간을 지나야 하는데, 첫 구간에서 진행이 멈춥니다.
키카드를 주는 상호작용이 아직 없어 입구가 열리지 않습니다.

```text
연구소 외부 ──> 연구소 입구 ──> 중앙 복도 ──> 보안 통제실
  B 파트          B 파트         B 파트         E 파트
  키카드 미구현    (대기)         (대기)        구현 완료
  ↑ 여기서 막힘
```

필요하면 Supabase 저장 상태에 선행 플래그(`hasKeycard`, `entranceUnlocked`,
`archiveClueFound`, `scienceLabPuzzleSolved`)를 직접 넣어 통제실부터 시작할 수 있습니다.

---

## 8. 검증 결과 (2026-08-08)

| 검사 | 명령 | 결과 |
| --- | --- | --- |
| 단위 테스트 | `npm test` | **115 / 115 통과** (E 파트 신규 77개) |
| 타입 검사 | `npm run typecheck` | 오류 0건 |
| 린트 | `npm run lint` | 오류 0건 |
| 프로덕션 빌드 | `npm run build` | 성공 |
| 변경 검사 | `git diff --check` | 이상 없음 |

E 파트 테스트만 실행:

```bash
node --test --experimental-strip-types \
  src/game/stage-one/puzzles/control-room/*.test.ts \
  src/game/stage-one/rooms/control-room/*.test.ts
```

### 테스트가 덮는 시나리오

- OTP 파생·검증, 형식 오류와 값 불일치 구분, 잘못된 설정 거부
- 가상 쿠키 마스킹·열람·재설정, 가상 콘솔 명령 10종과 버퍼 한도
- 퍼즐 전체 흐름: 정답 / 오답 누적 / 5회 초과 잠금 / 부분 완료 재입장 / 완료 후 열람 전용
- 완료 커밋: 정상 · 멱등 · 부분 재개 · 1단계 실패 · 2단계 실패 · 플래그 미반영 · 동시 호출 병합
- Room 계약: ID·표시명·접근 조건·스폰·목표 문구, 상호작용 3개 등록, 정리 함수
- 격리 규칙 정적 스캔

---

## 9. 알려진 제한

- **실기기 화면 확인 전.** 도달 경로가 없어 좌표·폰트·조작감은 통합 QA 때 확인해야 합니다.
  렌더링 좌표는 공통 월드(960×540) FIT 스케일 기준으로 배치했습니다.
- **OTP 시도 횟수와 쿠키 열람 상태는 저장되지 않습니다.** 저장 계약 v2에 실패 상태 필드가 없고,
  실패 패널티 영구 저장은 통합 명세 16장 미결정 항목이라 세션 한정으로 두었습니다.
- **데스크톱 키보드 전용.** 모바일 입력 역시 16장 미결정 항목이라 반영하지 않았습니다.
- **모달 중 ESC 동작** — 창이 떠 있을 때 ESC를 누르면 창이 닫히면서 공통 일시정지도 함께
  걸릴 것으로 보입니다. `Scene.update()` 가 일시정지 검사를 `interactionRunning` 조기 반환보다
  먼저 수행하기 때문입니다. 코드를 읽고 낸 추정이며 아직 실제로 확인하지 못했습니다.
  동작이 깨지지는 않고 ESC를 한 번 더 누르면 진행되므로, **통합 QA 때 눌러보고 판단**하면 됩니다.
  거슬리면 씬에 모달 상태를 두거나(A), E 쪽에서 ESC 바인딩만 제거하면(E) 됩니다.
  `Q` 키와 `exit` 명령으로도 닫히므로 ESC를 빼도 기능 손실이 없습니다.

---

## 10. 통합 체크리스트

- [ ] `controlRoomRoom` 을 `createStageOneGame` 의 `rooms` 에 등록 (§2 요청 1)
- [ ] `package.json` 테스트 목록 변경 확인 (§2 요청 2)
- [ ] 통제실 진입 → 벽·출입구·상호작용 위치 실제 플레이 확인
- [ ] 과학 실험실 미완료 상태에서 단말이 잠기는지 확인
- [ ] OTP 오답·정답·5회 초과 동작 확인
- [ ] 인증 통과 후 문서 보관실 진입 가능 여부 확인 (F 연계)
- [ ] 저장 실패 상황에서 퍼즐 성공 상태가 유지되는지 확인
- [ ] 재입장 시 완료 상태가 열람 전용으로 열리는지 확인
- [ ] 모달 중 ESC 동작 확인 (§9)
- [ ] 작은 화면에서 가짜 F12 창이 잘리지 않는지 확인
