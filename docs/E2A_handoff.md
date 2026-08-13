# E2A 인수인계 — stage-1 · 보안 통제실

## 1. 기본 정보

| 항목 | 내용 |
| --- | --- |
| 기획 차수 | 1차 |
| 개발 단계 | `stage-1` |
| 담당 파트 | E |
| 담당 영역 | 보안 통제실 |
| 담당자 | 10602 김보민 |
| 작업 브랜치 | `feat/stage-1/E-10602` |
| 원격 추적 브랜치 | `origin/feat/stage-1/E-10602` |
| 통합 대상 | `develop/stage-1` |
| 기능 구현 기준 커밋 | `77dea2f feat: 7단계 자동 테스트 도구 및 검증 로직 구현 완료` |
| 최종 확인일 | 2026-08-10 |
| 구현 상태 | 완료 |
| PR 상태 | 없음 |
| PR | 없음 |

## 2. 인계 결론

| 항목 | 내용 |
| --- | --- |
| A 통합 판정 | 통합 가능 — 현재 `develop/stage-1`에 반영됨 |
| A가 해야 할 작업 | 추가 구현 없음. 통합 브랜치에서 실제 키보드·모달·저장 복구 회귀 QA만 수행 |
| 차단 요인 | 없음 |
| 통합 후 필수 회귀 확인 | D 완료 후 통제실 입장, OTP 인증, 2단계 저장, F 문서 보관실 해금 |

E 파트의 `control-room` Room, 가짜 개발자 도구와 OTP 퍼즐은 구현을 마쳤다. `develop/stage-1`의 `createStageOneRooms`에도 `controlRoomRoom`이 등록되어 있어 과거 인수인계서의 Room 연결 요청은 더 이상 유효하지 않다. 자동 테스트와 정적 검증·빌드는 모두 통과했으며, 통합 브랜치에서 실제 브라우저 입력과 저장 복구를 확인하는 작업만 남아 있다.

## 3. 완료 범위

- `control-room` Room과 `hallway` 왕복 전환, 과학 실험실 완료 여부에 따른 접근 제어
- 실제 브라우저 개발자 도구와 분리된 게임 내부 가짜 개발자 도구 화면
- 가상 Cookie, Console, Network, 인증 탭과 키보드 입력 처리
- 가상 쿠키·콘솔 단서를 결합해 6자리 OTP를 파생·검증하는 퍼즐
- 형식 오류, 오답 횟수, 최대 5회 실패, 완료 후 열람 전용 상태 처리
- `controlRoomSolved`와 `documentStorageUnlocked`를 나눠 저장하는 2단계 완료 흐름
- 저장 부분 실패 후 재입장·재시도로 2단계만 이어서 수행하는 복구 흐름
- 퍼즐 도메인, Room 계약, 격리 경계와 저장 멱등성을 검증하는 자동 테스트

## 4. 미완료·제외 범위

- 기능 구현 기준 미완료 항목은 없다.
- OTP 실패 횟수와 가상 쿠키 열람 상태는 세션 전용이며 Stage 1 저장 상태에 포함하지 않는다.
- 모바일·터치 조작은 지원 범위에 포함하지 않았고 데스크톱 키보드를 기준으로 구현했다.
- 이번 문서 갱신에서는 실제 브라우저로 통제실 퍼즐을 플레이하지 않았다. 자동 테스트와 프로덕션 빌드까지 확인했다.

## 5. 공개 통합 계약

### 5.1 공개 진입점

| 구분 | ID·이름 | 공개 심벌 | import 경로 | 구현 파일 | 진입 조건 | 복귀 대상 |
| --- | --- | --- | --- | --- | --- | --- |
| Room | `control-room` | `controlRoomRoom` | `../rooms/control-room/index.ts` | `src/game/stage-one/rooms/control-room/controlRoomRoom.ts` | `scienceLabPuzzleSolved === true` | `hallway` |

`src/game/stage-one/rooms/control-room/index.ts`가 `CONTROL_ROOM_ID`와 `controlRoomRoom`을 공개한다. 퍼즐 내부 클래스와 가상 저장소는 Room이 조립하므로 A가 직접 생성하지 않는다.

### 5.2 A 조립 지점

| 항목 | 내용 |
| --- | --- |
| 조립 파일 | `src/game/stage-one/core/createStageOneRooms.ts` |
| 현재 등록 상태 | `develop/stage-1`에 등록됨 |
| 필요한 변경 | 없음 |
| 충돌 주의 | `control-room`을 중복 등록하지 않는다. `hallway` 복귀 ID와 `scienceLabPuzzleSolved` 진입 조건을 유지한다. |

`createStageOneRooms`는 참조 `control-room` 슬롯을 실제 `controlRoomRoom`으로 교체한다. 기능 브랜치 코드만 볼 때 조립부가 이전 상태일 수 있으므로 최종 등록 여부는 항상 통합 브랜치의 조립 파일을 기준으로 판단한다.

## 6. 진행도·파트 간 계약

| 플래그·이벤트 | 구분 | 생산자 | 소비자 | 저장·사용 시점 |
| --- | --- | --- | --- | --- |
| `scienceLabPuzzleSolved` | 소비 | D | E | 통제실 진입과 OTP 완료 승인 선행 조건 |
| `controlRoomSolved` | 생산 | E | E·공통 진행도 | OTP 검증 성공 직후 1단계 단독 패치로 저장 |
| `controlRoomSolved` 이벤트 | 생산 | E | 선택적 통합 리스너 | 1단계 플래그가 상태에 반영된 뒤 발행 |
| `documentStorageUnlocked` | 생산 | E | B·F | 1단계 성공 확인 뒤 2단계 단독 패치로 저장 |
| `documentStorageUnlocked` 이벤트 | 생산 | E | 선택적 통합 리스너 | 문서 보관실 해금 플래그가 상태에 반영된 뒤 발행 |

정상 완료 순서는 다음과 같다.

```text
OTP 검증 성공
  → updateProgress({ controlRoomSolved: true })
  → controlRoomSolved 이벤트
  → updateProgress({ documentStorageUnlocked: true })
  → documentStorageUnlocked 이벤트
```

1단계 저장이 끝난 뒤 2단계가 실패하면 `controlRoomSolved: true`를 유지한다. 재입장 또는 봉쇄 패널·콘솔 재시도에서는 `documentStorageUnlocked`만 다시 저장하고 결과를 `resumed`로 분류한다. 두 플래그가 이미 `true`면 추가 저장 없이 `already-complete`를 반환하며, 동시에 들어온 완료 호출은 진행 중인 Promise를 공유해 중복 저장을 막는다.

F 파트는 별도 이벤트를 구독할 필요 없이 공통 진행 상태의 `documentStorageUnlocked`를 소비하면 된다.

## 7. 주요 파일

| 역할 | 파일 |
| --- | --- |
| 공개 export | `src/game/stage-one/rooms/control-room/index.ts` |
| 보안 통제실 Room | `src/game/stage-one/rooms/control-room/controlRoomRoom.ts` |
| 단말 세션 | `src/game/stage-one/rooms/control-room/terminalSession.ts` |
| 가짜 개발자 도구 UI | `src/game/stage-one/rooms/control-room/fakeDevtoolsOverlay.ts` |
| 퍼즐 상태 머신 | `src/game/stage-one/puzzles/control-room/controlRoomPuzzle.ts` |
| 가상 Cookie·Console | `src/game/stage-one/puzzles/control-room/virtualCookieJar.ts`, `virtualConsole.ts` |
| OTP 규칙·데이터 | `src/game/stage-one/puzzles/control-room/otp.ts`, `puzzleData.ts` |
| 완료 저장 흐름 | `src/game/stage-one/puzzles/control-room/completionFlow.ts` |
| 테스트 | `src/game/stage-one/puzzles/control-room/*.test.ts`, `src/game/stage-one/rooms/control-room/controlRoomRoom.test.ts` |
| 통합 조립부 | `src/game/stage-one/core/createStageOneRooms.ts` |

퍼즐 계층은 Phaser, DOM, Supabase에 직접 의존하지 않는다. 실제 저장은 Room이 받은 공통 `StageOneInteractionContext`의 `updateProgress()`를 통해 요청한다.

## 8. QA 시나리오

### 8.1 준비 상태

- 시작 위치: `hallway`에서 `control-room` 문 앞
- 필요한 선행 플래그: 유효한 진행 순서에 따라 `hasKeycard`, `entranceUnlocked`, `archiveClueFound`, `scienceLabPuzzleSolved`가 `true`
- 정답·테스트 전용 값: `420042`

정답은 QA 전용이며 게임 화면에는 직접 노출하지 않는다. 현재 퍼즐 데이터의 16진수 시드와 시프트 규칙으로 동일한 값을 파생한다.

### 8.2 정상 동선

1. `scienceLabPuzzleSolved === true` 상태로 복도에서 `control-room`에 입장한다.
2. `control-room-terminal`과 상호작용해 게임 내부 가짜 개발자 도구를 연다.
3. Cookie, Console, Network 단서를 확인하고 인증 탭 또는 가상 콘솔에서 `420042`를 제출한다.
4. `controlRoomSolved`와 `documentStorageUnlocked`가 순서대로 저장되는지 확인한다.
5. `hallway`로 복귀해 `document-storage` 문이 열렸는지 확인한다.
6. 새로고침과 재입장 뒤 통제실이 완료·열람 전용 상태로 복구되고 중복 저장하지 않는지 확인한다.

키 조작은 `Tab`·`Shift+Tab` 탭 이동, `Enter` 제출, `Backspace` 삭제, `Escape` 닫기를 사용한다. 콘솔 탭에서는 `exit` 명령으로 닫을 수 있고, 콘솔 이외 탭에서는 `Q`도 닫기 단축키로 동작한다. 실제 브라우저 F12 키는 바인딩하지 않는다.

### 8.3 실패·경계 동선

1. `scienceLabPuzzleSolved === false`일 때 통제실 입장 또는 인증 승인이 차단되고 플래그가 바뀌지 않는지 확인한다.
2. 숫자 6자리가 아닌 입력은 시도 횟수를 소모하지 않고, 잘못된 6자리 값은 시도 횟수를 소모하는지 확인한다.
3. 오답 5회 초과 시 단말이 닫히고 재접속하면 세션 실패 횟수가 초기화되는지 확인한다.
4. 1단계 저장 성공 후 2단계 저장 실패 상태에서 재입장해 `documentStorageUnlocked`만 복구하는지 확인한다.
5. 완료 호출을 중복·동시에 실행해도 추가 저장이나 플래그 회귀가 없는지 확인한다.
6. 가짜 화면을 닫거나 Room을 떠날 때 키보드 리스너와 UI 객체가 정리되고 이동 입력이 복구되는지 확인한다.

## 9. 검증 근거

| 검사 | 실행 명령 | 결과 |
| --- | --- | --- |
| 자동 테스트 | `npm test` | 120/120 통과, E 퍼즐·Room 테스트 자동 탐색 포함 |
| 환경변수 구조 | `npm run env:check` | 값 이외의 구조가 일치함 |
| 타입 검사 | `npm run typecheck` | 통과 |
| 린트 | `npm run lint` | 통과 |
| 프로덕션 빌드 | `npm run build` | Next.js 프로덕션 빌드 성공 |
| 변경 공백 검사 | `git diff --check` | 통과 |
| 브라우저 QA | 미실행 | 이번 확인에서는 실제 키보드 조작과 저장 장애 재현을 수행하지 않음 |

위 검증은 2026-08-10에 `feat/stage-1/E-10602`에서 실행했다. `package.json`의 `test` 스크립트는 Node 테스트를 자동 탐색하므로 E 파트 테스트 경로를 별도로 나열할 필요가 없다.

## 10. 알려진 이슈와 위험

| 우선순위 | 내용 | 영향 | 후속 조치 |
| --- | --- | --- | --- |
| 중간 | 통합 브랜치의 실제 브라우저 QA 미실행 | 키보드 포커스, 모달 중 이동 잠금과 닫기 후 입력 복구는 자동 테스트·빌드만으로 완전히 확인할 수 없음 | A가 `develop/stage-1`에서 8장 동선을 실행 |
| 낮음 | OTP 실패 횟수와 쿠키 열람 상태가 세션 전용 | 새로고침·재접속하면 실패 횟수와 단서 열람 상태가 초기화됨 | 현재 저장 계약상 의도된 동작. 변경 필요 시 A와 저장 계약부터 합의 |
| 낮음 | 데스크톱 키보드 전용 | 모바일 환경에서 퍼즐 조작 불가 | 모바일 지원 범위가 결정될 때 별도 입력 어댑터 설계 |

통합을 차단하는 알려진 이슈는 없다.

## 11. 커밋·PR 정보

| 구분 | 값 |
| --- | --- |
| 기능 구현 커밋 | `77dea2f feat: 7단계 자동 테스트 도구 및 검증 로직 구현 완료` |
| 후속 수정 커밋 | 문서·환경 구조 정리 커밋만 존재하며 E 핵심 기능 계약 변경 없음 |
| PR | 현재 기능 브랜치 기준 없음 |
| `develop/stage-1` 반영 | 반영됨 — `2981a24 feat: 보안 통제실 공통 기반 통합` |

## 12. A 통합 체크리스트

- [x] `controlRoomRoom` 공개 심벌과 import 경로가 현재 코드와 일치한다.
- [x] `control-room`이 `createStageOneRooms`에 한 번 등록되어 있다.
- [x] `hallway` 복귀 경로와 `scienceLabPuzzleSolved` 진입 조건이 다른 파트 계약과 일치한다.
- [x] 두 단계 저장 순서, 부분 실패 복구, 멱등성과 동시 호출 병합을 자동 테스트로 확인했다.
- [x] E 파트 테스트가 `npm test`에서 자동 실행된다.
- [ ] 정상·실패 전체 동선을 `develop/stage-1` 브라우저에서 확인한다.
- [x] 실제 환경변수나 비밀정보가 문서와 커밋 대상에 포함되지 않았다.
- [x] 현재 통합 상태와 문서 내용이 일치한다.

## 13. 작성자 최종 확인

- [x] 자리표시자와 작성 안내를 제거했다.
- [x] 브랜치·upstream·커밋·PR 정보를 직접 확인했다.
- [x] 공개 진입점과 진행도 플래그를 코드에서 확인했다.
- [x] 실행하지 않은 브라우저 QA를 통과로 표시하지 않았다.
- [x] 해결된 과거 Room 등록·테스트 목록 요청과 ESC 결정 메모를 제거했다.
- [x] 비밀정보와 실제 환경변수 값을 기록하지 않았다.
- [x] 최종 파일명을 `E2A_handoff.md` 형식으로 저장했다.
