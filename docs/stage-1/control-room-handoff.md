# Stage 1 · E 파트(보안 통제실) 인계 문서

> 기준일: 2026-08-08
>
> 담당: E 파트 `10602 김보민`
>
> 인계 대상: A(통합), F(문서 보관실)

## 1. 구현 범위 요약

| 기능 | 구현 위치 |
| --- | --- |
| 보안 통제실 맵·상호작용 | `src/game/stage-one/rooms/control-room/controlRoomRoom.ts` |
| 가짜 F12(가상 DevTools) UI | `src/game/stage-one/rooms/control-room/fakeDevtoolsOverlay.ts` |
| 가상 쿠키 저장소 | `src/game/stage-one/puzzles/control-room/virtualCookieJar.ts` |
| 가상 콘솔 | `src/game/stage-one/puzzles/control-room/virtualConsole.ts` |
| OTP 파생·검증 | `src/game/stage-one/puzzles/control-room/otp.ts` |
| 퍼즐 상태 머신 | `src/game/stage-one/puzzles/control-room/controlRoomPuzzle.ts` |
| 완료 이벤트 커밋 | `src/game/stage-one/puzzles/control-room/completionFlow.ts` |
| 퍼즐 데이터(쿠키·네트워크 로그·힌트) | `src/game/stage-one/puzzles/control-room/puzzleData.ts` |

계층 구조는 `퍼즐(순수 도메인) → 뷰모델 → Phaser 어댑터` 단방향이다.
퍼즐 계층은 Phaser·DOM·브라우저 API를 일절 참조하지 않는다 (타입 import 포함 금지).

## 2. 실제 브라우저와의 격리 (핵심 제약)

- 가상 쿠키는 `Map` 기반 메모리 객체다. `document.cookie`·`localStorage`·`sessionStorage`·`indexedDB` 를 읽거나 쓰지 않는다.
- 가상 콘솔 로그는 배열 버퍼다. 전역 `console` 을 호출하지 않는다.
- 가짜 DevTools 창은 Phaser 도형·텍스트로만 그려지며, 실제 F12 키를 바인딩하지 않고 브라우저 개발자 도구 권한을 요구·확인하지 않는다.
- 가상 네트워크 탭은 정적 텍스트다. 실제 fetch/XHR을 발생시키지 않는다.
- 이 규칙은 `isolation.test.ts` 가 **소스 정적 스캔으로 자동 강제**한다 (금지 토큰이 코드에 들어오면 `npm test` 실패). Supabase 클라이언트·테이블명·RPC명 직접 참조도 같은 방식으로 차단된다.

## 3. 퍼즐 흐름

```text
보안 단말(E 키) → 가짜 DevTools 열림 (이동은 A의 interactionRunning으로 자동 정지)
  콘솔 탭: help / cookie.list() / cookie.get(name) / net.list() / otp.rule()
           / otp.verify(code) / lockdown.status() / lockdown.release() / clear / exit
  쿠키 탭: sec.session(마스킹) · sec.shift 등 5종 열람
  네트워크 탭: OTP 발급 규칙·봉쇄 상태 힌트 4건
  인증 탭: 숫자 6자리 입력 + Enter
```

정답 도출: `sec.session`(16진수 시드, 콘솔로 마스킹 해제) + `sec.shift`(계수) + 파생 규칙(`otp.rule()` 또는 네트워크 로그) → 6자리 OTP.

기본 데이터(`seedHex: "1A4"`, `shift: 7`) 기준 정답은 `420042` (테스트가 규칙으로 재계산하며 코드에 하드코딩되어 있지 않다).

> **D 파트 연동 지점**: `CONTROL_ROOM_OTP_CONFIG.shift` 는 과학 실험실이 인계하는 "보안 통제실 코드 단서"와 연결할 수 있다. D의 값이 확정되면 `puzzleData.ts` 의 상수만 교체하면 된다.

## 4. 완료 이벤트 명세 (6항목)

### 4.1 `controlRoomSolved`

| 항목 | 내용 |
| --- | --- |
| **이벤트 이름** | `controlRoomSolved` (`CONTROL_ROOM_SOLVED_EVENT` 상수) |
| **입력 데이터** | `ControlRoomSolvedPayload` — `{ event, roomId: "control-room", source: "otp-verification", failedAttempts: number, savedFlags: ["controlRoomSolved"] }` |
| **완료 조건** | `verifyControlRoomOtp()` 통과 (형식 + 값 일치) **그리고** `scienceLabPuzzleSolved === true` (미충족 시 `blocked`, 어떤 저장도 없음) |
| **저장 시점** | OTP 검증 성공 직후, 1단계 커밋으로 `updateProgress({ controlRoomSolved: true })` 단독 저장. 저장 경로는 A의 `StageOneInteractionContext → 세션 → 저장 큐 → progressBridge` 뿐이다 |
| **실패·중복 처리** | 오답: 시도 1회 소모(최대 5회, 초과 시 단말 잠금 후 닫힘·재접속 시 초기화), 플래그 무변화. 형식 오류: 시도 미소모. 저장 예외: 이벤트 미발행·단말 유지·재시도 가능. 이미 true: 재저장 없이 2단계로 건너뜀 |
| **자동 테스트** | `completionFlow.test.ts`(성공·멱등·부분재개·1/2단계 실패·동시호출 병합), `controlRoomPuzzle.test.ts`(정답·오답·잠금·재입장) |

### 4.2 `documentStorageUnlocked`

| 항목 | 내용 |
| --- | --- |
| **이벤트 이름** | `documentStorageUnlocked` (`DOCUMENT_STORAGE_UNLOCKED_EVENT` 상수) |
| **입력 데이터** | `DocumentStorageUnlockedPayload` — `{ event, roomId: "control-room", unlockedRoomId: "document-storage", source: "auto-after-solve" \| "console-lockdown-release", savedFlags: ["documentStorageUnlocked"] }` |
| **완료 조건** | `controlRoomSolved` 가 상태에 확정된 뒤에만 발행 (같은 호출 안에서 1단계 성공 직후 자동, 또는 부분 완료 상태에서 인증 탭 Enter / `lockdown.release()` / 봉쇄 패널 상호작용) |
| **저장 시점** | 1단계와 분리된 2단계 커밋으로 `updateProgress({ documentStorageUnlocked: true })` 단독 저장 |
| **실패·중복 처리** | 2단계 저장 실패 시 `controlRoomSolved` 는 유지(회귀 없음), 단말·봉쇄 패널에서 2단계만 재시도(`resumed`). 두 플래그 모두 true면 `already-complete` 로 저장 0회. 동시 호출은 in-flight Promise 재사용으로 병합 |
| **자동 테스트** | `completionFlow.test.ts`, `controlRoomRoom.test.ts`(봉쇄 패널 재개·중복 무저장) |

### 4.3 F 파트가 소비하는 방식

F는 별도 이벤트 구독 없이 **저장 상태 `state.documentStorageUnlocked`** 로 해금을 확인하면 된다
(A의 참조 Room이 이미 같은 방식으로 `document-storage` 접근을 제어하고 있음).
페이로드가 필요하면 `ControlRoomCompletionFlow` 생성자의 `onEvent` 리스너를 A 통합 지점에서 연결한다.

## 5. A 통합 방법

```ts
import { controlRoomRoom } from "@/game/stage-one/rooms/control-room";

createStageOneGame({
  // referenceRooms의 control-room 슬롯을 이 모듈로 교체
  rooms: [...otherRooms, controlRoomRoom],
  ...
});
```

- Room ID(`control-room`)·표시명(`보안 통제실`)·복도 출입구 좌표(110, 270)는 A 참조 맵과 동일하다.
- 단말 모달 중 이동 정지는 A의 `runInteraction()` await 동작을 그대로 이용한다 (공통 계약 무변경).
- 오버레이 키 리스너는 Phaser `scene.input.keyboard` 의 `keydown` 구독이며, Room `mount()` 정리 함수 → `terminalSession.dispose()` → `overlay.destroy()` 경로에서 반드시 해제된다.

## 6. 공통 파일 변경 사항 (A 승인 필요)

- `package.json` — `test` 스크립트에 E 파트 테스트 파일 8개 추가 (기존 목록 뒤에 append, 다른 변경 없음).

그 외 `progressBridge.ts`, `src/types/stage-one.ts`, contracts, core 파일은 **일절 수정하지 않았다.**

## 7. 검증 결과 (2026-08-08)

| 검사 | 결과 |
| --- | --- |
| `npm test` | 115/115 통과 (E 파트 신규 77개 포함) |
| `npm run typecheck` | 오류 0건 |
| `npm run lint` | 오류 0건 |
| `npm run build` | 성공 |

## 8. 알려진 제한

- OTP 시도 횟수·쿠키 마스킹 해제 상태는 **세션 한정**이다. 저장 계약 v2에 실패 상태 필드가 없고, 실패 패널티 영구 저장은 통합 명세 16장의 미결정 항목이므로 재접속 시 초기화된다.
- 가짜 DevTools는 데스크톱 키보드 입력 전용이다. 모바일 입력은 통합 명세 16장 미결정 항목이라 반영하지 않았다.
- `shift` 값의 D 파트 단서 연동은 D 확정값 대기 중 (3장 참고). 현재는 통제실 자체 힌트로 완결된다.
- 오버레이는 실 브라우저 플레이 확인(A 통합 후 QA) 전이다. 렌더링 좌표는 A 공통 월드(960×540) FIT 스케일 기준으로 배치했다.
