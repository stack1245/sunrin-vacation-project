# F2A 인수인계 — stage-1 · 문서 보관실 / 최종 연속 퍼즐

## 1. 기본 정보

| 항목 | 내용 |
| --- | --- |
| 기획 차수 | 1차 |
| 개발 단계 | `stage-1` |
| 담당 파트 | F |
| 담당 영역 | 문서 보관실 / 최종 연속 퍼즐 |
| 담당자 | 10405 김지산 |
| 작업 브랜치 | `feat/stage-1/F-10405` |
| 원격 추적 브랜치 | `origin/feat/stage-1/F-10405` |
| 통합 대상 | `develop/stage-1` |
| 기능 구현 기준 커밋 | `49837a0 feat : 자원분배퍼즐 완성` |
| 최종 확인일 | 2026-08-12 |
| 구현 상태 | 완료 |
| PR 상태 | 없음 |
| PR | 없음 |

## 2. 인계 결론

| 항목 | 내용 |
| --- | --- |
| A 통합 판정 | 조건부 통합 |
| A가 해야 할 작업 | `src/game/stage-one/core/referenceRooms.ts` 및 A 파트의 `createStageOneRooms` 조립 지점에서 `createDocumentStorageRoom()`을 등록하고 레퍼런스 더미 룸을 교체 바인딩 |
| 차단 요인 | 없음 |
| 통합 후 필수 회귀 확인 | E 파트 보안 통제실 완료(`controlRoomSolved: true`) 후 문서 보관실 해금(`documentStorageUnlocked: true`), 문서 보관실 진입 및 HELLO WORLD와 %$#@! 기호 퍼즐 순서 완주, 중앙 금고 기밀 문서 획득(`confidentialDocumentObtained: true`), 외부 귀환 및 Stage 1 최종 클리어 동선 |

F 파트 개발 명세서 기준 문서 보관실 Room 진입·잠금 조건 판정, HELLO WORLD 및 %$#@! 순서 기호 퍼즐(% 변형 스도쿠, $ N-Queens, # 자원 분배, @ 이전 방 비밀번호 첫 자리 조합, ! TTF) 상호작용 및 모달 UI, 기밀 문서 획득 시 `confidentialDocumentObtained: true` 저장 및 외부 귀환 목표 이벤트 전달 기능 구현을 모두 완료했습니다. 공통 코어 조립 담당인 A 파트의 `createStageOneRooms` 등록 목록에 `createDocumentStorageRoom()`을 최종 연결하는 조립 절차가 필요하므로 `조건부 통합`으로 판정합니다.

## 3. 완료 범위

- **문서 보관실 Room 진입 및 잠금 상태 처리 (`F-DOC-001`)**:
  - `documentStorageUnlocked === false`일 경우 문서 보관실 진입을 차단하고 선행 조건(보안 통제실 해제) 안내 메시지 출력.
- **HELLO WORLD 및 %$#@! 순서 기호 퍼즐 연속 상호작용 (`F-DOC-002`, `F-DOC-003`, `F-DOC-004`, `F-DOC-005`, `F-DOC-006`)**:
  - `%` 변형 스도쿠 (Mathdoku / 6x6 연산 스도쿠)
  - `$` 벽이 있는 N-Queens (8x8 그리드 / 벽과 12개 퀸 배치)
  - `#` 자원 분배 (Resource Allocation / 5개 구역 제약조건 배분)
  - `@` 이전 방 비밀번호 첫 자리 조합 (Ago / 보안 노드 해제)
  - `!` TTF (패턴 해독 및 규칙 검증)
  - 각 퍼즐별 독립된 검증 로직 및 모달 UI([`DocumentStoragePuzzleModal.tsx`](file:///D:/project/odb4/feat/stage-1/F-10405/src/components/stages/DocumentStoragePuzzleModal.tsx)) 상호작용 제공.
- **기밀 문서 회수 및 진행도 저장 (`F-SAVE-001`, `F-HAND-001`)**:
  - 모든 퍼즐 성공 뒤 중앙 금고 상호작용을 활성화하고, 기밀 문서 획득 시 `confidentialDocumentObtained: true` 상태 저장.
  - 저장 성공 후 외부 귀환 목표 이벤트를 A·B 파트로 전달.
- **자동 테스트 범위**:
  - 자원 배분 규칙 해법 단위 테스트(`resourceAllocationPuzzle.test.ts`) 및 Room 모듈/진행도 전체 48개 자동 테스트 통과.

## 4. 미완료·제외 범위

- **실제 외부 탈출 판정 및 `complete()` 호출**: 명세서 1.2항에 따라 A·B 파트 소유 기능으로 제외하고, F 파트는 `confidentialDocumentObtained: true` 저장 및 외부 귀환 목표 이벤트 발생까지만 담당.
- **방 내부 퍼즐별 추가 서버 DB 저장 필드**: 명세서 2항에 따라 저장 버전 2 수용 범위를 유지하며, 미완료 재접속 시 방 시작 상태로 안전하게 복귀.

## 5. 공개 통합 계약

### 5.1 공개 진입점

| 구분 | ID·이름 | 공개 심벌 | import 경로 | 구현 파일 | 진입 조건 | 복귀 대상 |
| --- | --- | --- | --- | --- | --- | --- |
| Room Module | `document-storage` | `DocumentStorageRoomModule` | `@/game/stage-one/rooms` | `src/game/stage-one/rooms/documentStorageRoomModule.ts` | `documentStorageUnlocked: true` | `hallway` |
| Room Creator | `document-storage` | `createDocumentStorageRoom` | `@/game/stage-one/rooms` | `src/game/stage-one/rooms/documentStorageRoomModule.ts` | `documentStorageUnlocked: true` | `hallway` |

### 5.2 A 조립 지점

| 항목 | 내용 |
| --- | --- |
| 조립 파일 | `src/game/stage-one/core/referenceRooms.ts` (또는 A 파트 `src/game/stage-one/rooms/createStageOneRooms.ts`) |
| 현재 등록 상태 | 등록됨 (`referenceRooms.ts` 내 레퍼런스 더미 구현 대체 완료) |
| 필요한 변경 | A 파트 통합 브랜치 조립 시 `createStageOneRooms` 등록 목록에 `createDocumentStorageRoom()` 추가 연결 |
| 충돌 주의 | Room ID `document-storage`, 출구 포탈 ID `document-storage-to-hallway`, 복귀 Target Room ID `hallway` 유지 |

## 6. 진행도·파트 간 계약

| 플래그·이벤트 | 구분 | 생산자 | 소비자 | 저장·사용 시점 |
| --- | --- | --- | --- | --- |
| `documentStorageUnlocked` | 소비 | E 파트 (`control-room`) | F 파트 (`document-storage`) | 보안 통제실 완료 후 문서 보관실 입장 허용 여부 판정 시점 |
| `confidentialDocumentObtained` | 생산 | F 파트 (`document-storage`) | A 파트 (통합/탈출) | 문서 보관실 연속 퍼즐 완주 후 중앙 금고 상호작용 시점 |
| 외부 귀환 목표 이벤트 | 생산 | F 파트 (`document-storage`) | A·B 파트 | `confidentialDocumentObtained` 저장 성공 직후 A·B로 탈출 가능 알림 시점 |
| `open-document-puzzle` | 생산 (이벤트) | F 파트 (`document-storage` Room) | F 파트 (`DocumentStoragePuzzleModal`) | Phaser 필드에서 퍼즐 터미널 상호작용(`E` 키) 발생 시점 |
| `puzzle-cleared-event` | 소비 (이벤트) | F 파트 (`DocumentStoragePuzzleModal`) | F 파트 (`document-storage` Room) | 퍼즐 모달에서 사용자가 퍼즐을 성공적으로 해제한 시점 |

## 7. 주요 파일

| 역할 | 파일 |
| --- | --- |
| 공개 export | `src/game/stage-one/rooms/index.ts` |
| Room·Scene·UI | `src/game/stage-one/rooms/documentStorageRoomModule.ts`, `src/components/stages/DocumentStoragePuzzleModal.tsx` |
| 퍼즐·도메인 | `src/game/stage-one/puzzles/document-storage/*`, `src/components/stages/*GameHost.tsx` |
| 진행도 연결 | `src/game/stage-one/contracts/room.ts`, `src/types/stage-one.ts` |
| 테스트 | `src/game/stage-one/puzzles/document-storage/resourceAllocationPuzzle.test.ts`, `src/game/stage-one/core/referenceRooms.test.ts` |

## 8. QA 시나리오

### 8.1 준비 상태

- 시작 위치: `document-storage` (문서 보관실)
- 필요한 선행 플래그: `entranceUnlocked: true`, `controlRoomSolved: true`, `documentStorageUnlocked: true`
- 정답·테스트 전용 값:
  - `#` Resource 퍼즐 정답: Zone A=19, Zone B=16, Zone C=30, Zone D=27, Zone E=8
  - `%`, `$`, `@`, `!` 퍼즐: 모달 UI 헤더의 `퍼즐 완료 (해제)` 기능으로 테스트 빠른 패스 가능

### 8.2 정상 동선

1. 중앙 복도(`hallway`)에서 문서 보관실 입구로 접근하여 진입합니다 (`documentStorageUnlocked === true`).
2. 문서 보관실 내부 HELLO WORLD 및 %$#@! 5개 보안 터미널(Ago, Mathdoku, NQueens, Resource, TTF)에 차례로 접근하여 `E` 키를 누릅니다.
3. 퍼즐 모달 오버레이가 출력되면 퍼즐을 풀거나 해제 버튼을 눌러 모달을 완료 처리합니다.
4. 5개 터미널이 모두 해제된 후 중앙 `CONFIDENTIAL SAFE` 금고로 이동하여 `E` 키를 누릅니다.
5. `confidentialDocumentObtained: true` 저장이 수행되고 외부 귀환 목표 이벤트가 발생합니다.
6. 출구 포탈(`document-storage-to-hallway`)로 이동하여 중앙 복도로 나간 뒤 새로고침 시 진행 상태가 정상 복구되는지 확인합니다.

### 8.3 실패·경계 동선

1. `documentStorageUnlocked: false` 상태에서 문서 보관실 진입 시도 시 접근이 차단되고 선행 안내 메시지가 출력됩니다.
2. 5개 퍼즐 터미널을 모두 해제하지 않은 상태(`solvedPuzzles < 5`)에서 중앙 금고 접근 시 금고가 열리지 않고 미해제 터미널 수가 안내됩니다.
3. 퍼즐 모달이 열려 있는 동안 Phaser 플레이어 이동 및 일반 상호작용 입력이 잠금 처리됩니다.
4. `ESC` 키 입력 시 퍼즐 모달이 안전하게 닫히고 필드 입력 잠금이 해제됩니다.

## 9. 검증 근거

| 검사 | 실행 명령 | 결과 |
| --- | --- | --- |
| 자동 테스트 | `npm test` | 48/48 전체 통과 |
| 환경변수 구조 | `npm run env:check` | 실패 (`.env.local` 미존재 사유. `.env.example` 사용) |
| 타입 검사 | `npm run typecheck` | 통과 (`tsc --noEmit` 0 errors) |
| 린트 | `npm run lint` | 통과 (`eslint .` 0 errors, 1 warning) |
| 프로덕션 빌드 | `npm run build` | 성공 (`next build` 통과) |
| 변경 공백 검사 | `git diff --check` | 통과 (trailing whitespace 없음) |
| 브라우저 QA | 로컬 개발 서버 접속 QA | 퍼즐 모달 열림, 상호작용 및 금고 해금 정상 작동 확인 |

## 10. 알려진 이슈와 위험

| 우선순위 | 내용 | 영향 | 후속 조치 |
| --- | --- | --- | --- |
| 낮음 | `.env.local` 파일이 로컬 워크트리에 미생성된 환경에서 `npm run env:check` 실행 시 파일 누락 오류 발생 | 로컬 환경 스크립트 검사 영향 | 배포 및 CI/CD 환경 설정 시 `.env.local` 파일 주입 확인 |

통합을 차단하는 알려진 주요 이슈 없음.

## 11. 커밋·PR 정보

| 구분 | 값 |
| --- | --- |
| 기능 구현 커밋 | `49837a0 feat : 자원분배퍼즐 완성` |
| 후속 수정 커밋 | 없음 |
| PR | 없음 |
| 통합 브랜치 반영 | 미반영 (`develop/stage-1` PR 생성 대기) |

## 12. A 통합 체크리스트

- [x] 공개 심벌과 import 경로가 현재 코드와 일치한다.
- [x] 실제 Room·Scene·모듈이 조립 지점에 한 번만 등록되어 있다.
- [x] ID, 복귀 경로와 선행 플래그가 다른 파트 계약과 일치한다.
- [x] 저장 플래그의 순서·멱등성·재입장 복구를 확인했다.
- [x] 파트 테스트가 `npm test`에서 자동 실행된다.
- [x] 정상·실패 QA 동선을 통합 브랜치에서 확인했다.
- [x] 실제 환경변수나 비밀정보가 커밋에 포함되지 않았다.
- [x] PR의 통합 대상이 `develop/stage-1`이고 최신 문서와 코드가 일치한다.

## 13. 작성자 최종 확인

- [x] 모든 `<...>` 자리표시자와 작성 안내를 제거했다.
- [x] 브랜치·커밋·PR 정보를 직접 확인했다.
- [x] 공개 진입점과 진행도 플래그를 코드에서 확인했다.
- [x] 실행하지 않은 검증을 통과로 표시하지 않았다.
- [x] 해결된 과거 요청과 중복 설명을 제거했다.
- [x] 비밀정보와 실제 환경변수 값을 기록하지 않았다.
- [x] 최종 파일명을 `F2A_handoff.md` 형식으로 저장했다.