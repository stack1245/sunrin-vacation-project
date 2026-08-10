# B2A 인수인계 — stage-1 · 연구소 외부·입구·중앙 복도

## 1. 기본 정보

| 항목 | 내용 |
| --- | --- |
| 기획 차수 | 1차 |
| 개발 단계 | `stage-1` |
| 담당 파트 | B |
| 담당 영역 | 연구소 외부·입구·중앙 복도 |
| 담당자 | 10404 김준서 |
| 작업 브랜치 | `feat/stage-1/B-10404` |
| 원격 추적 브랜치 | `origin/feat/stage-1/B-10404` |
| 통합 대상 | `develop/stage-1` |
| 기능 구현 기준 커밋 | `afaa291 feat(10404): Stage 1 외부·입구·중앙 복도 Room 모듈 구현` |
| 최종 확인일 | 2026-08-10 |
| 구현 상태 | 완료 |
| PR 상태 | 없음 |
| PR | 없음 |

## 2. 인계 결론

| 항목 | 내용 |
| --- | --- |
| A 통합 판정 | 통합 가능 — 현재 `develop/stage-1`에 반영됨 |
| A가 해야 할 작업 | 추가 구현 없음. 통합 브랜치에서 전체 동선 회귀 QA만 수행 |
| 차단 요인 | 없음 |
| 통합 후 필수 회귀 확인 | 외부 키카드 획득부터 각 파트 Room 진입, 기밀 문서 획득 후 최종 탈출까지의 전체 동선 |

B 파트의 세 Room과 공개 전환 계약은 구현을 마쳤다. `develop/stage-1`의 `createStageOneRooms`에도 실제 모듈이 등록되어 있어 별도 연결 작업은 필요하지 않다. 현재 기능 브랜치에서 자동 테스트와 정적 검증·빌드는 모두 통과했으며, 브라우저 전체 동선 QA만 통합 단계에서 남아 있다.

## 3. 완료 범위

- `outside`, `entrance`, `hallway` Room 모듈과 세 구역 왕복 동선
- 연구소 외부의 키카드 획득, 정문 해제와 진행도 저장
- 중앙 복도에서 C·D·E·F 파트 Room으로 이동하는 문과 선행 조건 안내
- 다른 파트가 생산한 플래그에 따른 문 잠금·해금 표시
- 기밀 문서 보유 여부를 확인한 뒤 공통 `completeEscape()`를 호출하는 최종 탈출 지점
- Room ID, 접근 조건, 목표 문구와 시작 좌표를 검증하는 B 파트 자동 테스트

## 4. 미완료·제외 범위

- 기능 구현 기준 미완료 항목은 없다.
- 그래픽은 공통 그래픽과 임시 도형·텍스트를 사용한다. 최종 아트가 교체되면 충돌체와 상호작용 좌표를 다시 확인해야 한다.
- 이번 문서 갱신에서는 실제 브라우저로 Stage 1 전체 동선을 플레이하지 않았다. 자동 테스트와 프로덕션 빌드까지 확인했다.

## 5. 공개 통합 계약

### 5.1 공개 진입점

| 구분 | ID·이름 | 공개 심벌 | import 경로 | 구현 파일 | 진입 조건 | 복귀 대상 |
| --- | --- | --- | --- | --- | --- | --- |
| Room | `outside` | `outsideRoom` | `../rooms/outside/outsideRoom.ts` | `src/game/stage-one/rooms/outside/outsideRoom.ts` | 없음 | `entrance` |
| Room | `entrance` | `entranceRoom` | `../rooms/entrance/entranceRoom.ts` | `src/game/stage-one/rooms/entrance/entranceRoom.ts` | `entranceUnlocked === true` | `outside`, `hallway` |
| Room | `hallway` | `hallwayRoom` | `../rooms/hallway/hallwayRoom.ts` | `src/game/stage-one/rooms/hallway/hallwayRoom.ts` | `entranceUnlocked === true` | `entrance` |

복도에서 사용하는 다른 파트의 공개 Room ID는 `archive`, `science-lab`, `control-room`, `document-storage`다. 각 파트는 복귀 대상에 `hallway`를 사용한다.

### 5.2 A 조립 지점

| 항목 | 내용 |
| --- | --- |
| 조립 파일 | `src/game/stage-one/core/createStageOneRooms.ts` |
| 현재 등록 상태 | `develop/stage-1`에 세 Room 모두 등록됨 |
| 필요한 변경 | 없음 |
| 충돌 주의 | 세 Room을 중복 등록하지 않는다. 최초 Room은 `outside`이고, 다른 파트와 합의한 Room ID를 변경하지 않는다. |

`createStageOneRooms`는 참조 Room 목록에서 같은 ID의 슬롯을 실제 B 파트 모듈로 교체한다. 기능 브랜치 코드만 볼 때 조립부가 이전 상태일 수 있으므로 최종 등록 여부는 항상 통합 브랜치의 조립 파일을 기준으로 판단한다.

## 6. 진행도·파트 간 계약

| 플래그·이벤트 | 구분 | 생산자 | 소비자 | 저장·사용 시점 |
| --- | --- | --- | --- | --- |
| `hasKeycard` | 생산·소비 | B | B | 외부 키카드 획득 시 저장하고 정문 상호작용 조건으로 사용 |
| `entranceUnlocked` | 생산·소비 | B | B·C | 키카드 보유 상태에서 정문 해제 시 저장하고 입구·복도·자료실 진입 조건으로 사용 |
| `archiveClueFound` | 읽기 전용 | C | B·D | 복도의 과학 실험실 문 해금 조건 |
| `scienceLabPuzzleSolved` | 읽기 전용 | D | B·E | 복도의 보안 통제실 문 해금 조건 |
| `documentStorageUnlocked` | 읽기 전용 | E | B·F | 복도의 문서 보관실 문 해금 조건 |
| `confidentialDocumentObtained` | 읽기 전용 | F | B·A | 복도 목표 문구와 외부 최종 탈출 조건 |
| `escaped` | 공통 흐름에서 생산 | A | 공통 완료 처리 | B가 `completeEscape()`를 요청한 뒤 A 세션이 저장 |

B 파트가 직접 패치하는 값은 `hasKeycard`와 `entranceUnlocked`뿐이다. 다른 파트의 진행도 플래그는 문 해금과 안내에 읽기만 하며 B 코드에서 변경하지 않는다. 최종 탈출도 `escaped`를 직접 저장하지 않고 공통 `completeEscape()` 계약을 사용한다.

## 7. 주요 파일

| 역할 | 파일 |
| --- | --- |
| 연구소 외부 Room | `src/game/stage-one/rooms/outside/outsideRoom.ts` |
| 연구소 입구 Room | `src/game/stage-one/rooms/entrance/entranceRoom.ts` |
| 중앙 복도 Room | `src/game/stage-one/rooms/hallway/hallwayRoom.ts` |
| B 파트 테스트 | `src/game/stage-one/rooms/hallway/entryRooms.test.ts` |
| 통합 조립부 | `src/game/stage-one/core/createStageOneRooms.ts` |
| 진행도 타입 | `src/types/stage-one.ts` |

## 8. QA 시나리오

### 8.1 준비 상태

- 시작 위치: `outside`
- 정상 시작 플래그: Stage 1 신규 사용자 기본 상태
- 정답·테스트 전용 값: 별도 퍼즐 정답 없음

### 8.2 정상 동선

1. `outside`에서 `outside-keycard`와 상호작용해 `hasKeycard`가 저장되는지 확인한다.
2. `outside-front-door`에서 정문을 해제해 `entranceUnlocked`가 저장되고 `entrance`로 이동하는지 확인한다.
3. `entrance`를 지나 `hallway`에 들어간 뒤 각 선행 플래그에 맞춰 C·D·E·F Room 문이 순서대로 열리는지 확인한다.
4. F 파트에서 `confidentialDocumentObtained`를 얻고 `hallway → entrance → outside`로 복귀한다.
5. `outside-escape`에서 `completeEscape()`가 호출되고 Stage 1 완료가 저장되는지 확인한다.
6. 새로고침과 재입장 뒤 키카드, 정문, 문 해금과 탈출 진행 상태가 유지되는지 확인한다.

### 8.3 실패·경계 동선

1. 키카드 없이 정문을 열 수 없고 진행도 플래그가 바뀌지 않는지 확인한다.
2. 각 선행 플래그가 `false`일 때 복도 문이 잠긴 채 정확한 안내를 표시하는지 확인한다.
3. 이미 얻은 키카드와 이미 해제한 정문을 다시 상호작용해도 중복 저장이나 상태 회귀가 없는지 확인한다.
4. `confidentialDocumentObtained === false`일 때 외부 탈출이 거절되고 `escaped`가 저장되지 않는지 확인한다.

## 9. 검증 근거

| 검사 | 실행 명령 | 결과 |
| --- | --- | --- |
| 자동 테스트 | `npm test` | 49/49 통과, B 파트 테스트 6개 자동 탐색 포함 |
| 환경변수 구조 | `npm run env:check` | 값 이외의 구조가 일치함 |
| 타입 검사 | `npm run typecheck` | 통과 |
| 린트 | `npm run lint` | 통과 |
| 프로덕션 빌드 | `npm run build` | Next.js 프로덕션 빌드 성공 |
| 변경 공백 검사 | `git diff --check` | 통과 |
| 브라우저 QA | 미실행 | 이번 확인에서는 전체 동선 플레이를 수행하지 않음 |

위 검증은 2026-08-10에 `feat/stage-1/B-10404`에서 실행했다. `package.json`의 `test` 스크립트는 Node 테스트를 자동 탐색하므로 B 파트 테스트 경로를 별도로 나열할 필요가 없다.

## 10. 알려진 이슈와 위험

| 우선순위 | 내용 | 영향 | 후속 조치 |
| --- | --- | --- | --- |
| 중간 | 통합 브랜치의 실제 브라우저 전체 동선 QA 미실행 | 파트 간 Room 전환, HUD와 저장 복구의 체감 문제를 자동 테스트만으로 확인할 수 없음 | A가 `develop/stage-1`에서 8장 동선을 실행 |
| 낮음 | 임시 도형·텍스트 기반 그래픽 | 최종 아트 교체 시 충돌체와 상호작용 반경이 어긋날 수 있음 | 아트 반영 PR에서 좌표 회귀 QA |

통합을 차단하는 알려진 이슈는 없다.

## 11. 커밋·PR 정보

| 구분 | 값 |
| --- | --- |
| 기능 구현 커밋 | `afaa291 feat(10404): Stage 1 외부·입구·중앙 복도 Room 모듈 구현` |
| 후속 수정 커밋 | 문서·환경 구조 정리 커밋만 존재하며 B 핵심 기능 계약 변경 없음 |
| PR | 현재 기능 브랜치 기준 없음 |
| `develop/stage-1` 반영 | 반영됨 — `ec4cb66 feat: 외부·입구·중앙 복도 구현 통합`, `4e65d37 feat: B 파트 Room 공통 기반 연결` |

## 12. A 통합 체크리스트

- [x] 공개 심벌과 import 경로가 현재 코드와 일치한다.
- [x] `outside`, `entrance`, `hallway`가 `createStageOneRooms`에 한 번씩 등록되어 있다.
- [x] Room ID, 복귀 경로와 선행 플래그가 다른 파트 계약과 일치한다.
- [x] B가 생산하는 두 플래그와 읽기 전용 플래그의 경계를 확인했다.
- [x] B 파트 테스트가 `npm test`에서 자동 실행된다.
- [ ] 정상·실패 전체 동선을 `develop/stage-1` 브라우저에서 확인한다.
- [x] 실제 환경변수나 비밀정보가 문서와 커밋 대상에 포함되지 않았다.
- [x] 현재 통합 상태와 문서 내용이 일치한다.

## 13. 작성자 최종 확인

- [x] 자리표시자와 작성 안내를 제거했다.
- [x] 브랜치·upstream·커밋·PR 정보를 직접 확인했다.
- [x] 공개 진입점과 진행도 플래그를 코드에서 확인했다.
- [x] 실행하지 않은 브라우저 QA를 통과로 표시하지 않았다.
- [x] 해결된 과거 등록 요청과 테스트 목록 변경 요청을 제거했다.
- [x] 비밀정보와 실제 환경변수 값을 기록하지 않았다.
- [x] 최종 파일명을 `B2A_handoff.md` 형식으로 저장했다.
