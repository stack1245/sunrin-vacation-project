# C2A 인수인계 — stage-1 · 연구 자료실

## 1. 기본 정보

| 항목 | 내용 |
| --- | --- |
| 기획 차수 | 1차 |
| 개발 단계 | `stage-1` |
| 담당 파트 | C |
| 담당 영역 | 연구 자료실 암호 퍼즐과 과학 실험실·문서 보관실 후속 단서 |
| 담당자 | 10409 서정권 |
| 작업 브랜치 | `feat/stage-1/C-10409` |
| 원격 추적 브랜치 | `origin/feat/stage-1/C-10409` |
| 통합 대상 | `develop/stage-1` |
| 최초 기능 구현 커밋 | `e9c1762 feat : C_10409 퍼즐 시스템 개발` |
| A 통합 보완 커밋 | `4e96c61 feat: 연구 자료실 공통 조립과 후속 단서 연결` |
| 최종 확인일 | 2026-08-10 |
| 구현 상태 | 완료 |
| PR 상태 | 열림 |
| PR | [#3 연구 자료실 퍼즐 구현](https://github.com/stack1245/sunrin-vacation-project/pull/3) |

## 2. 인계 결론

| 항목 | 내용 |
| --- | --- |
| A 통합 판정 | 통합 가능 |
| A가 해야 할 작업 | 코드 보완과 공통 조립부 등록 완료. PR #3 최종 검토·병합 및 통합 브라우저 QA |
| 차단 요인 | 코드·자동 검증 기준 없음 |
| 통합 후 필수 회귀 확인 | `hallway → archive` 진입, 두 암호 완료, 후속 단서 확인, `archiveClueFound` 복구, `science-lab` 문 해금 |

C 파트 Room과 두 암호 퍼즐은 구현 완료 상태다. A가 최신 `develop/stage-1`을 C 브랜치에 일반 merge 방식으로 반영해 PR의 공용 문서 삭제·인증 설정 변경을 제거했고, `createStageOneRooms`에 연구 자료실을 게임별 새 인스턴스로 등록했다. 비즈네르 성공 후 D·F용 단서 표시와 완료 상태 재입장 시 단서 재확인도 실제 코드와 테스트로 보완했다.

## 3. 완료 범위

- `archive` 연구 자료실 Room과 `hallway` 왕복 전환
- `entranceUnlocked`에 따른 연구 자료실 접근 제어
- 카이사르 암호 입력·정규화·정답 검증
- 카이사르 성공 전 비즈네르 입력 차단
- 비즈네르 암호 입력·정규화·정답 검증
- D 파트용 `화학 기호 → 용액 밀도 → 산소 공급 → 점화 → 가열` 단서 표시
- F 파트용 `% → $ → # → @ → !` 단서 표시
- 두 암호 완료 후 `archiveClueFound: true` 공통 진행도 패치
- 완료 상태 재입장 시 추가 저장 없이 두 단서 재확인
- 입력 중 공통 모달 잠금 획득과 완료·취소 후 해제
- Room, 입력 흐름, 진행도 패치, 후속 단서와 공통 조립부 자동 테스트

## 4. 미완료·제외 범위

- 기능 구현 기준 미완료 항목은 없다.
- 과학 실험실의 실제 장치 퍼즐과 `scienceLabPuzzleSolved` 저장은 D 파트가 담당한다.
- 보안 통제실과 `controlRoomSolved`·`documentStorageUnlocked` 저장은 E 파트가 담당한다.
- 문서 보관실 최종 기호 퍼즐과 `confidentialDocumentObtained` 저장은 F 파트가 담당한다.
- 카이사르만 완료한 중간 상태는 서버에 저장하지 않는다. 게임을 새로 시작하면 카이사르 단계부터 다시 진행하는 것이 현재 저장 계약이다.
- 이번 확인에서는 실제 브라우저에서 전체 Stage 1 동선을 플레이하지 않았다. 자동 테스트와 프로덕션 빌드까지 확인했다.

## 5. 공개 통합 계약

### 5.1 공개 진입점

| 구분 | ID·이름 | 공개 심벌 | import 경로 | 구현 파일 | 진입 조건 | 복귀 대상 |
| --- | --- | --- | --- | --- | --- | --- |
| Room 팩토리 | `archive` · 연구 자료실 | `createArchiveRoom` | `../rooms/archive/index.ts` | `src/game/stage-one/rooms/archive/archiveRoom.ts` | `entranceUnlocked === true` | `hallway` |

`src/game/stage-one/rooms/archive/index.ts`가 Room 팩토리만 공개한다. `createStageOneRooms()`를 호출할 때마다 `createArchiveRoom()`을 실행하므로 카이사르 중간 상태가 다른 게임 인스턴스나 사용자에게 공유되지 않는다.

### 5.2 A 조립 지점

| 항목 | 내용 |
| --- | --- |
| 조립 파일 | `src/game/stage-one/core/createStageOneRooms.ts` |
| 현재 등록 상태 | C 기능 브랜치에 등록됨, `develop/stage-1`은 PR #3 병합 전 |
| 필요한 변경 | 추가 코드 변경 없음 |
| 충돌 주의 | `archive`를 중복 등록하지 않고 `createArchiveRoom()` 팩토리 호출을 유지한다. |

공통 조립부는 참조 Room 목록에서 ID가 `archive`인 슬롯을 실제 C Room으로 한 번 교체한다. Room 배열 순서는 `outside → entrance → hallway → archive → science-lab → control-room → document-storage`를 유지한다.

## 6. 진행도·파트 간 계약

| 플래그·단서 | 구분 | 생산자 | 소비자 | 저장·사용 시점 |
| --- | --- | --- | --- | --- |
| `entranceUnlocked` | 소비 | B | C | 연구 자료실 접근 조건 |
| `archiveClueFound` | 생산 | C | B·D·공통 진행도 | 카이사르와 비즈네르를 순서대로 완료한 뒤 저장 |
| 과학 실험실 순서 단서 | 생산 | C | D | 비즈네르 성공 직후 표시하고 완료 재입장 시 다시 표시 |
| 문서 보관실 기호 순서 | 생산 | C | F | 비즈네르 성공 직후 표시하고 완료 재입장 시 다시 표시 |
| `scienceLabPuzzleSolved` | C 변경 금지 | D | B·E | D 퍼즐 완료 시 D가 저장 |
| `controlRoomSolved` | C 변경 금지 | E | 공통 진행도 | E OTP 완료 시 E가 저장 |

C 파트가 직접 패치하는 값은 `archiveClueFound` 하나다. Supabase를 직접 호출하지 않고 `StageOneInteractionContext.updateProgress()`를 사용해 A의 세션·저장 큐·진행도 Bridge로 전달한다.

### 저장과 재입장 규칙

1. 카이사르 성공 전에는 비즈네르 입력을 허용하지 않는다.
2. 비즈네르 성공 시 `archiveClueFound: true`를 한 번 요청한다.
3. 저장 상태가 완료로 반영된 뒤 두 후속 단서를 화면과 HUD 메시지에 표시한다.
4. 완료 상태로 재입장하면 비즈네르 단말에서 두 단서를 다시 확인할 수 있다.
5. 완료 재확인에서는 `updateProgress()`를 다시 호출하지 않는다.
6. 카이사르만 완료한 중간 상태는 게임 인스턴스 내부에만 유지한다.

## 7. 주요 파일

| 역할 | 파일 |
| --- | --- |
| 공개 Room export | `src/game/stage-one/rooms/archive/index.ts` |
| 연구 자료실 Room | `src/game/stage-one/rooms/archive/archiveRoom.ts` |
| Room·입력·저장 테스트 | `src/game/stage-one/rooms/archive/archiveRoom.test.ts` |
| 카이사르 퍼즐 | `src/game/stage-one/puzzles/archive/caesarPuzzle.ts` |
| 카이사르 테스트 | `src/game/stage-one/puzzles/archive/caesarPuzzle.test.ts` |
| 비즈네르·후속 단서 계약 | `src/game/stage-one/puzzles/archive/vigenerePuzzle.ts` |
| 비즈네르·후속 단서 테스트 | `src/game/stage-one/puzzles/archive/vigenerePuzzle.test.ts` |
| 공통 Room 조립 | `src/game/stage-one/core/createStageOneRooms.ts` |
| 공통 조립 테스트 | `src/game/stage-one/core/createStageOneRooms.test.ts` |
| 진행도 타입 | `src/types/stage-one.ts` |

## 8. QA 시나리오

### 8.1 준비 상태

- 시작 위치: `hallway`의 연구 자료실 문 앞
- 유효한 선행 플래그: `hasKeycard: true`, `entranceUnlocked: true`
- 카이사르 정답: `ACCESS GRANTED`
- 비즈네르 키워드: `LOCK`
- 비즈네르 정답: `SYMBOL ORDER FIVE`
- D 파트 단서: `화학 기호 → 용액 밀도 → 산소 공급 → 점화 → 가열`
- F 파트 단서: `% → $ → # → @ → !`

정답은 QA와 테스트 전용이다. 일반 플레이 화면에는 성공 전 정답을 직접 노출하지 않는다.

### 8.2 정상 동선

1. `entranceUnlocked === true` 상태로 `hallway`에서 `archive`에 진입한다.
2. 카이사르 단말에서 `ACCESS GRANTED`를 입력한다.
3. 카이사르 성공 후 비즈네르 단말이 활성화되는지 확인한다.
4. 비즈네르 단말에서 `SYMBOL ORDER FIVE`를 입력한다.
5. `archiveClueFound`가 `true`로 저장되는지 확인한다.
6. D용 5단계 단서와 F용 기호 순서가 모두 표시되는지 확인한다.
7. `hallway`로 복귀해 `science-lab` 문이 열렸는지 확인한다.
8. 새로고침·재입장 후 암호를 다시 풀지 않고 비즈네르 단말에서 두 단서를 재확인한다.

입력 중에는 공통 모달 입력 잠금이 유지된다. `Enter`는 제출, `Backspace`는 한 글자 삭제, `Escape`는 현재 입력 취소로 동작한다.

### 8.3 실패·경계 동선

1. `entranceUnlocked === false` 상태에서는 연구 자료실 접근이 거부되는지 확인한다.
2. 카이사르 미완료 상태에서 비즈네르 단말을 사용하면 선행 퍼즐 안내만 표시되는지 확인한다.
3. 두 퍼즐에서 오답을 제출해도 완료 플래그와 후속 단서가 노출되지 않는지 확인한다.
4. 정답의 대소문자와 연속 공백이 달라도 정규화 후 승인되는지 확인한다.
5. 입력을 `Escape`로 취소했을 때 모달 입력 잠금이 해제되는지 확인한다.
6. 완료 상태 재입장에서 단서를 확인해도 추가 진행도 패치가 발생하지 않는지 확인한다.
7. 복도 진입 스폰 `(220, 270)`이 복도 출구 `(110, 270)`와 분리되어 즉시 되돌아가지 않는지 확인한다.

## 9. 검증 근거

| 검사 | 실행 명령 | 결과 |
| --- | --- | --- |
| C·조립부 대상 테스트 | `node --test --experimental-strip-types ...` | 20/20 통과 |
| 전체 자동 테스트 | `npm test` | 151/151 통과 |
| 환경변수 구조 | `npm run env:check` | 값 이외의 구조가 일치함 |
| 타입 검사 | `npm run typecheck` | 통과 |
| 린트 | `npm run lint` | 통과 |
| 프로덕션 빌드 | `npm run build` | Next.js 프로덕션 빌드 성공 |
| 변경 공백 검사 | `git diff --check` | 통과 |
| 브라우저 QA | 미실행 | 통합 브랜치 병합 후 실제 전체 동선 수행 예정 |

위 검증은 2026-08-10에 최신 `develop/stage-1`을 반영한 `feat/stage-1/C-10409`에서 실행했다. 전체 테스트 스크립트가 C Room과 두 퍼즐 테스트를 자동 탐색하는 것도 확인했다.

## 10. 알려진 이슈와 위험

| 우선순위 | 내용 | 영향 | 후속 조치 |
| --- | --- | --- | --- |
| 중간 | 통합 브랜치의 실제 브라우저 전체 동선 QA 미실행 | Phaser 좌표, 키보드 포커스, HUD 메시지와 저장 복구의 체감 문제는 자동 테스트만으로 완전히 확인할 수 없음 | PR #3 병합 후 A가 8장 동선을 실행 |
| 낮음 | 카이사르 중간 완료 상태는 서버에 저장하지 않음 | 비즈네르 완료 전 새로고침하면 카이사르부터 다시 시작 | 현재 Stage 1 저장 계약상 의도된 동작 |
| 낮음 | Room 그래픽이 도형·텍스트 중심 | 최종 아트 교체 시 단말 위치와 상호작용 반경이 어긋날 수 있음 | 아트 반영 시 좌표 회귀 QA |

통합을 차단하는 알려진 코드 이슈는 없다.

## 11. 커밋·PR 정보

| 구분 | 값 |
| --- | --- |
| 최초 기능 구현 | `e9c1762 feat : C_10409 퍼즐 시스템 개발` |
| 담당자 후속 수정 | `1d180a1 feat : C-10409 오류 해결 및 B파트 자료실 연결` |
| A 기준 동기화 | `81ade3f chore: 최신 Stage 1 통합 기준 반영` |
| A 통합 보완 | `4e96c61 feat: 연구 자료실 공통 조립과 후속 단서 연결` |
| PR | [#3 · 열림 · `develop/stage-1` 대상](https://github.com/stack1245/sunrin-vacation-project/pull/3) |
| `develop/stage-1` 반영 | 미반영 — PR #3 병합 대기 |

## 12. A 통합 체크리스트

- [x] `createArchiveRoom` 공개 export와 import 경로가 현재 코드와 일치한다.
- [x] `archive`가 `createStageOneRooms`에 한 번 등록되어 있다.
- [x] 게임 생성마다 새 `archive` Room 인스턴스를 사용한다.
- [x] `archive` ID, `hallway` 복귀 경로와 접근 플래그가 공통 계약과 일치한다.
- [x] 카이사르 성공 전 비즈네르 입력이 잠긴다.
- [x] 비즈네르 성공 후 D용 5단계 단서와 F용 기호 순서가 표시된다.
- [x] `archiveClueFound` 저장이 공통 `updateProgress()`를 통해 연결된다.
- [x] 완료 재입장 시 추가 저장 없이 두 단서를 재확인한다.
- [x] C가 Supabase나 다른 파트 완료 플래그를 직접 변경하지 않는다.
- [x] C Room·퍼즐·공통 조립 테스트가 `npm test`에서 자동 실행된다.
- [x] 전체 테스트, 환경 구조, 타입, 린트, 빌드와 변경 공백 검사가 통과한다.
- [ ] PR #3을 `develop/stage-1`에 병합한다.
- [ ] `develop/stage-1` 브라우저에서 정상·실패 전체 동선을 확인한다.
- [x] 실제 환경변수나 비밀정보가 문서와 커밋 대상에 포함되지 않았다.

## 13. 작성자 최종 확인

- [x] 자리표시자와 깨진 출처 표기를 제거했다.
- [x] 브랜치·upstream·커밋·PR 정보를 실제 저장소에서 확인했다.
- [x] 공개 진입점과 진행도 플래그를 코드에서 확인했다.
- [x] 실행하지 않은 브라우저 QA를 통과로 표시하지 않았다.
- [x] 비밀정보와 실제 환경변수 값을 기록하지 않았다.
- [x] 최종 파일명을 `C2A_handoff.md` 형식으로 사용한다.
