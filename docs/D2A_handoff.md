# D2A 인수인계 — Stage 1 · 과학 실험실

## 1. 기본 정보

| 항목 | 내용 |
| --- | --- |
| 기획 차수 | 1차 |
| 개발 단계 | `stage-1` |
| 담당 파트 | D |
| 담당 영역 | 과학 실험실 |
| 담당자 | 10320 박도현 |
| 작업 브랜치 | `feat/stage-1/D-10320` |
| 원격 추적 브랜치 | `origin/feat/stage-1/D-10320` |
| 통합 대상 | `develop/stage-1` |
| 기능 구현 기준 커밋 | `0bc5dbe feat: 과학 실험실 퍼즐과 통합 UI 구현` |
| 최종 확인일 | 2026-08-12 |
| 구현 상태 | 완료 |
| PR 상태 | 없음 |
| PR | 없음 |

## 2. 인계 결론

| 항목 | 내용 |
| --- | --- |
| A 통합 판정 | 통합 가능 |
| A가 해야 할 작업 | `develop/stage-1` 대상 Pull Request 생성·검토 후, 로그인된 테스트 계정으로 C → D → E 실제 동선을 한 번 회귀 확인 |
| 차단 요인 | 없음 |
| 통합 후 필수 회귀 확인 | 연구 자료실 단서 획득 → 과학 실험실 5단계 완료 → `scienceLabPuzzleSolved` 저장 → 보안 통제실 진입 |

D Room과 퍼즐은 공통 Room 조립 지점에 실제 구현으로 등록되어 있어 별도 연결 작업이 필요 없다. 기능·계약 자동 검증과 프로덕션 빌드는 통과했으며, 인증이 필요한 실제 플레이 동선만 통합 브랜치의 로그인된 테스트 계정으로 최종 확인하면 된다.

## 3. 완료 범위

- `science-lab` Room의 바닥, 벽, 장치 패널, 중앙 복도 복귀 포털과 안전한 스폰 위치를 구현했다.
- 연구 자료실 단서에 맞춰 화학 기호 → 용액 밀도 → 산소 공급 → 점화 → 가열 순서로만 진행되는 5단계 상태 머신을 구현했다.
- 각 단계는 선택형 모달로 제공하며 오답 피드백, 취소, Escape 닫기, 접근 가능한 라디오 그룹과 공통 입력 잠금을 지원한다.
- 마지막 가열 단계는 플래시·진동 연출이 정상 종료된 뒤에만 `scienceLabPuzzleSolved: true`를 저장한다.
- 미완료 재입장은 첫 단계로 초기화하고, 완료 재입장은 저장을 반복하지 않은 채 안전 정지 상태와 승인 코드를 다시 표시한다.
- D 파트 승인 코드 `SEC-8042-CTRL`을 E 파트의 실제 OTP `420042`와 분리했다. 현재 E 파트의 기능 해금 계약은 코드 문자열이 아니라 `scienceLabPuzzleSolved` 플래그를 사용한다.
- 메인·인증 화면은 기존 OutOfBounds 랜딩 디자인을 유지하고, Layer7 부스 프로젝트의 UI/UX 참고 범위는 스테이지 선택 이후 실제 게임으로 한정했다.
- 게임을 좌우 이동·점프·숙이기 기반의 횡스크롤 시점으로 전환하고, HUD·목표·조작 안내·상호작용 프롬프트를 큰 게임 캔버스 안에 통합했다.
- 제공된 SVG 캐릭터 17프레임을 `idle`, `walk`, `jump`, `crouch`, `interact` 애니메이션으로 연결했다.
- `FacilityShell`, `facility-*`, `--game-*` 공통 계약을 인게임에 적용하고 정상·경고·잠김 상태가 색상과 문구로 함께 구분되도록 정리했다.
- F 모달의 Phaser 장면이 서버에서 조기 평가되어 개발 서버가 실패하던 경로를 브라우저 전용 동적 로딩 경계로 수정했다.
- 퍼즐 상태 머신, Room 접근·순서·취소·가열 중단·재입장, Room 조립 회귀 테스트를 추가했다.

## 4. 미완료·제외 범위

- 기능 구현 기준 미완료 항목 없음.
- 최종 배경 일러스트·사운드·실험실 전용 원화 자산은 범위에 포함하지 않았다. 플레이어는 제공된 SVG 자산을 사용하고 시설·장치는 Phaser 도형과 텍스트로 구성했다.
- 인증된 실제 계정으로 수행하는 C → D → E 전체 브라우저 플레이는 통합 QA에 남겼다.
- D 파트는 E 파트 OTP를 계산하거나 검증하지 않는다.

## 5. 공개 통합 계약

### 5.1 공개 진입점

| 구분 | ID·이름 | 공개 심벌 | import 경로 | 구현 파일 | 진입 조건 | 복귀 대상 |
| --- | --- | --- | --- | --- | --- | --- |
| Room 팩토리 | `science-lab` | `createScienceLabRoom` | `@/game/stage-one/rooms/science-lab` | `src/game/stage-one/rooms/science-lab/scienceLabRoom.ts` | `entranceUnlocked && archiveClueFound` | `hallway` |
| 퍼즐 상태 머신 | 과학 실험실 5단계 | `ScienceLabPuzzle` | `@/game/stage-one/puzzles/science-lab` | `src/game/stage-one/puzzles/science-lab/scienceLabPuzzle.ts` | 현재 단계와 제출 단계 일치 | 없음 |
| 모달 이벤트 경계 | 단계 요청 | `requestScienceLabStep`, `subscribeToScienceLabPuzzleOpen` | `@/game/stage-one/puzzles/science-lab` | `src/game/stage-one/puzzles/science-lab/scienceLabPuzzleEvents.ts` | 브라우저에서 Room 상호작용 발생 | 없음 |
| React UI | 선택 모달 | `ScienceLabPuzzleModal` | `@/components/stages/ScienceLabPuzzleModal` | `src/components/stages/ScienceLabPuzzleModal.tsx` | 단계 요청 이벤트 수신 | 없음 |

### 5.2 A 조립 지점

| 항목 | 내용 |
| --- | --- |
| 조립 파일 | `src/game/stage-one/core/createStageOneRooms.ts` |
| 현재 등록 상태 | 등록됨 |
| 필요한 변경 | 없음 |
| 충돌 주의 | `science-lab` ID를 유지하고 Room 배열의 기존 참조 순서를 바꾸지 않는다. 게임마다 새 `ScienceLabRoomModule`을 만들어 미완료 퍼즐 상태가 세션 사이에 공유되지 않게 한다. React 모달은 `StageOneGameHost`에 한 번만 마운트한다. |

## 6. 진행도·파트 간 계약

| 플래그·이벤트 | 구분 | 생산자 | 소비자 | 저장·사용 시점 |
| --- | --- | --- | --- | --- |
| `entranceUnlocked` | 소비 | B | D | 과학 실험실 접근 판정 |
| `archiveClueFound` | 소비 | C | D | 과학 실험실 접근 판정과 퍼즐 순서 근거 |
| `scienceLabPuzzleSolved` | 생산 | D | E | 가열 연출 성공 후 한 번 저장하며, E 보안 통제실 해금 조건으로 사용 |
| `OPEN_SCIENCE_LAB_PUZZLE_EVENT` | 내부 이벤트 | D Room | D React UI | 현재 단계 장치에 E 상호작용을 했을 때 브라우저 내 모달 요청 |
| `SCIENCE_LAB_SECURITY_CODE` | 읽기 전용 서사 값 | D | 플레이어·통합 QA | 완료 메시지와 재입장 단말에 표시. E의 OTP 검증 값으로 사용하지 않음 |

부분 단계는 DB에 저장하지 않는다. 모달 취소·Room 이탈·새로고침 시 미완료 퍼즐은 첫 단계부터 다시 시작하며, 완료 플래그가 이미 있으면 상태 머신을 완료 상태로 복구하고 중복 저장하지 않는다.

## 7. 주요 파일

| 역할 | 파일 |
| --- | --- |
| 공개 export | `src/game/stage-one/puzzles/science-lab/index.ts`, `src/game/stage-one/rooms/science-lab/index.ts`, `src/game/stage-one/rooms/index.ts` |
| Room·UI | `src/game/stage-one/rooms/science-lab/scienceLabRoom.ts`, `src/components/stages/ScienceLabPuzzleModal.tsx`, `src/components/stages/StageOneGameHost.tsx` |
| 퍼즐·도메인 | `src/game/stage-one/puzzles/science-lab/scienceLabPuzzle.ts`, `scienceLabPuzzleEvents.ts` |
| 진행도 연결 | `src/game/stage-one/core/createStageOneRooms.ts` |
| 테스트 | `src/game/stage-one/puzzles/science-lab/scienceLabPuzzle.test.ts`, `src/game/stage-one/rooms/science-lab/scienceLabRoom.test.ts`, `src/game/stage-one/core/createStageOneRooms.test.ts` |
| 공통 시각 계약 | `src/app/globals.css`, `docs/stage-1.md` |

## 8. QA 시나리오

### 8.1 준비 상태

- 시작 위치: `hallway`에서 과학 실험실 입구
- 필요한 선행 플래그: `hasKeycard: true`, `entranceUnlocked: true`, `archiveClueFound: true`
- 정답·테스트 전용 값: `H2O` → `1.0` → `21` → `ON` → `HEAT`
- 완료 후 확인용 승인 코드: `SEC-8042-CTRL`

### 8.2 정상 동선

1. 연구 자료실을 완료해 `archiveClueFound`를 저장한 뒤 중앙 복도에서 과학 실험실로 진입한다.
2. 각 장치 앞에서 E를 누르고 `H2O`, `1.0`, `21`, `ON`, `HEAT`를 순서대로 선택한다.
3. 가열 연출이 끝난 뒤 성공 메시지와 승인 코드가 표시되는지 확인한다.
4. `scienceLabPuzzleSolved: true`가 저장되고 보안 통제실 진행이 가능해지는지 확인한다.
5. 새로고침 또는 재입장 후 안전 정지 상태와 승인 코드가 다시 보이고 추가 저장이 발생하지 않는지 확인한다.

### 8.3 실패·경계 동선

1. `archiveClueFound: false`에서 과학 실험실 진입이 차단되는지 확인한다.
2. 현재 순서가 아닌 장치를 먼저 조작했을 때 모달이 열리지 않고 다음 장치를 안내하는지 확인한다.
3. 오답을 선택했을 때 단계가 진행되지 않고 같은 모달에서 피드백을 제공하는지 확인한다.
4. 모달을 취소하거나 Escape로 닫았을 때 플레이어 입력 잠금이 해제되고 단계가 유지되는지 확인한다.
5. 가열 연출이 중단되거나 Room이 정리되면 완료 플래그가 저장되지 않는지 확인한다.
6. 완료 상태 재입장에서는 퍼즐 모달과 저장을 반복하지 않는지 확인한다.

## 9. 검증 근거

| 검사 | 실행 명령 | 결과 |
| --- | --- | --- |
| 자동 테스트 | `npm test` | 175/175 통과 |
| 환경변수 구조 | `npm run env:check` | 통과. 실제 파일과 예제 파일은 값 외 구조가 일치 |
| 타입 검사 | `npm run typecheck` | 통과 |
| 린트 | `npm run lint` | 통과 |
| 프로덕션 빌드 | `npm run build` | 성공. `/stages/[slug]` 포함 전체 라우트 생성 |
| 변경 공백 검사 | `git diff --check` | 통과 |
| 브라우저 QA | 메인 랜딩·횡스크롤 공통 HUD·연구소 외부 | 메인은 기존 디자인을 유지하고, 인게임은 큰 단일 캔버스·상단 HUD·옆 시점 바닥·SVG 캐릭터·화면 내 프롬프트로 렌더링되는 것을 확인. 인증된 실제 D 플레이는 미실행 |

`npm test`는 Node 테스트 자동 탐색으로 D 파트의 `*.test.ts`도 함께 실행한다.

## 10. 알려진 이슈와 위험

| 우선순위 | 내용 | 영향 | 후속 조치 |
| --- | --- | --- | --- |
| 낮음 | 인증된 실제 계정으로 D 전체 화면 동선을 수동 확인하지 않음 | 자동 테스트가 다루지 않는 캔버스 배치·체감 확인이 남음 | 통합 브랜치에서 C → D → E 실제 플레이 1회 |
| 낮음 | 설치 시 기존 의존성 감사에서 high 등급 경고 6건이 보고됨 | 현재 테스트·빌드를 차단하지 않음 | 별도 의존성 업데이트 작업에서 호환성 검토 후 처리 |

통합을 차단하는 알려진 이슈는 없다.

## 11. 커밋·PR 정보

| 구분 | 값 |
| --- | --- |
| 기능 구현 커밋 | `0bc5dbe feat: 과학 실험실 퍼즐과 통합 UI 구현` |
| 후속 수정 커밋 | `626278c feat: 전체 게임 화면을 산업 시설 테마로 통일` |
| PR | 없음 |
| 통합 브랜치 반영 | 미반영 |

## 12. A 통합 체크리스트

- [x] 공개 심벌과 import 경로가 현재 코드와 일치한다.
- [x] 실제 Room·Scene·모듈이 조립 지점에 한 번만 등록되어 있다.
- [x] ID, 복귀 경로와 선행 플래그가 다른 파트 계약과 일치한다.
- [x] 저장 플래그의 순서·멱등성·재입장 복구를 자동 테스트로 확인했다.
- [x] 파트 테스트가 `npm test`에서 자동 실행된다.
- [ ] 정상·실패 QA 동선을 로그인된 통합 브랜치에서 확인한다.
- [x] 실제 환경변수나 비밀정보가 커밋에 포함되지 않았다.
- [ ] PR의 통합 대상이 `develop/stage-1`인지 생성 후 확인한다.

## 13. 작성자 최종 확인

- [x] 모든 자리표시자와 작성 안내를 제거했다.
- [x] 브랜치·커밋·PR 정보를 직접 확인했다.
- [x] 공개 진입점과 진행도 플래그를 코드에서 확인했다.
- [x] 실행하지 않은 검증을 통과로 표시하지 않았다.
- [x] 해결된 과거 요청과 중복 설명을 제거했다.
- [x] 비밀정보와 실제 환경변수 값을 기록하지 않았다.
- [x] 최종 파일명을 `D2A_handoff.md` 형식으로 저장했다.
