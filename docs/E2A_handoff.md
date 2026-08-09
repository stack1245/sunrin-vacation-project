# E2A 인수인계 — 보안 통제실

## 1. 기본 정보

| 항목 | 내용 |
| --- | --- |
| 담당 파트 | E |
| 담당자 | 10602 김보민 |
| 작업 브랜치 | `feat/stage-1/E_10602` |
| 핵심 구현 커밋 | `77dea2f` |
| 상태 | 구현 완료, `develop/stage-1` 공통 조립부에 통합 완료 |

이 문서는 전달받은 E 파트 인수인계 내용을 현재 코드와 통합 상태에 맞게 정리한 문서다. Room 등록, 테스트 자동 탐색, 모달 입력 잠금은 이미 공통 기반에 반영되어 있으므로 남은 요청으로 취급하지 않는다.

## 2. 완료 범위

- `control-room` Room 모듈과 복도 왕복 전환
- 과학 실험실 완료 여부에 따른 입장 제어
- 실제 브라우저 개발자 도구와 분리된 가짜 F12 화면
- 가상 Cookie, Console, Network, 인증 탭
- 쿠키·콘솔 단서를 조합하는 6자리 OTP 퍼즐
- 오답 형식 검사, 최대 시도 횟수, 상태 복구
- 완료 플래그의 2단계 저장과 문서 보관실 해금
- Room, 퍼즐, 저장 실패 복구, 격리 경계 테스트

## 3. A 파트 공개 진입점

| 항목 | 값 |
| --- | --- |
| Room ID | `control-room` |
| Room 모듈 | `controlRoomRoom` |
| 배럴 export | `src/game/stage-one/rooms/control-room/index.ts` |
| 구현 파일 | `src/game/stage-one/rooms/control-room/controlRoomRoom.ts` |
| 복귀 Room | `hallway` |
| 입장 조건 | `scienceLabPuzzleSolved === true` |

`develop/stage-1`의 `createStageOneRooms`에 이미 등록되어 있다. 기능 브랜치의 export를 유지하고 공통 조립부를 E 파트에서 직접 수정하지 않는다.

## 4. 퍼즐 진행 순서

```text
과학 실험실 완료
  → 보안 통제실 입장
  → 단말 상호작용
  → 가짜 F12 열기
  → Cookie 단서 확인
  → Console 명령과 Network 기록 확인
  → OTP 파생
  → 인증 탭에서 OTP 제출
  → controlRoomSolved 저장
  → documentStorageUnlocked 저장
```

QA 전용 정답은 `420042`이다. 게임 화면에는 정답을 직접 노출하지 않으며 가상 쿠키와 콘솔 규칙으로 유도한다.

## 5. 진행도 계약

| 플래그 | 생산·소비 규칙 |
| --- | --- |
| `scienceLabPuzzleSolved` | D 파트가 생산하며 E Room 입장 조건으로 소비 |
| `controlRoomSolved` | OTP 성공 직후 첫 번째 저장 단계에서 생산 |
| `documentStorageUnlocked` | 첫 단계 확인 후 두 번째 저장 단계에서 생산, F 파트가 소비 |

두 완료 플래그는 의도적으로 나누어 저장한다. 첫 저장이 성공하고 두 번째 저장이 실패하면 `controlRoomSolved: true` 상태를 유지하며, 재입장 또는 재시도에서 `documentStorageUnlocked`만 이어서 저장한다.

## 6. 주요 파일

| 영역 | 파일 |
| --- | --- |
| Room | `src/game/stage-one/rooms/control-room/controlRoomRoom.ts` |
| Room 공개 export | `src/game/stage-one/rooms/control-room/index.ts` |
| 단말 세션 | `src/game/stage-one/rooms/control-room/terminalSession.ts` |
| 가짜 개발자 도구 | `src/game/stage-one/rooms/control-room/fakeDevtoolsOverlay.ts` |
| 퍼즐 상태 머신 | `src/game/stage-one/puzzles/control-room/controlRoomPuzzle.ts` |
| 가상 Cookie | `src/game/stage-one/puzzles/control-room/virtualCookieJar.ts` |
| 가상 Console | `src/game/stage-one/puzzles/control-room/virtualConsole.ts` |
| OTP 규칙 | `src/game/stage-one/puzzles/control-room/otp.ts` |
| 완료 저장 | `src/game/stage-one/puzzles/control-room/completionFlow.ts` |

퍼즐 모듈은 Supabase, DOM, Phaser에 직접 의존하지 않는다. 저장은 공통 `StageOneInteractionContext`를 통해서만 요청한다.

## 7. 입력과 격리 규칙

- F12 키는 실제 브라우저 개발자 도구를 제어하지 않고 게임 내부 가짜 화면만 연다.
- 가상 Cookie와 Console은 브라우저의 실제 `document.cookie`나 개발자 콘솔을 읽거나 수정하지 않는다.
- 가짜 화면이 열려 있으면 Phaser 이동과 상호작용 입력이 잠긴다.
- `ESC`와 화면 닫기 동작은 가짜 화면을 정리하고 입력 잠금을 해제한다.
- Room 이탈 또는 게임 종료 시 DOM, 이벤트 리스너와 세션 상태를 정리한다.

## 8. QA 동선

1. `scienceLabPuzzleSolved`가 `false`이면 입장이 차단되는지 확인한다.
2. `true` 상태에서 `hallway`를 통해 `control-room`에 입장한다.
3. 단말에서 가짜 F12를 열고 Cookie, Console, Network 단서를 확인한다.
4. 잘못된 형식과 오답에 적절한 오류가 표시되는지 확인한다.
5. `420042`를 제출해 `controlRoomSolved`와 `documentStorageUnlocked`가 순서대로 저장되는지 확인한다.
6. 저장 후 새로고침하거나 재입장했을 때 완료 상태가 복구되는지 확인한다.
7. 문서 보관실 문이 열리고 `hallway`로 정상 복귀하는지 확인한다.

## 9. 검증과 제한 사항

- 전체 테스트는 `npm test`가 자동 탐색한다.
- 핵심 테스트는 `src/game/stage-one/puzzles/control-room/*.test.ts`와 `src/game/stage-one/rooms/control-room/controlRoomRoom.test.ts`에 있다.
- 브라우저 QA에서는 키보드 포커스, 모달 입력 잠금, 새로고침 후 플래그 복구를 반드시 확인한다.
- 퍼즐 데이터나 OTP 규칙을 변경하면 코드, 테스트, QA 정답을 같은 작업에서 갱신한다.

A 파트의 추가 구현 요청은 없다. 통합 PR에서는 공개 Room ID, 두 단계 저장 순서와 F 파트 해금 조건이 유지되는지만 확인한다.
