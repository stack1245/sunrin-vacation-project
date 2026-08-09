# B2A 인수인계 — 연구소 외부·입구·중앙 복도

## 1. 기본 정보

| 항목 | 내용 |
| --- | --- |
| 담당 파트 | B |
| 담당자 | 10404 김준서 |
| 작업 브랜치 | `feat/stage-1/B-10404` |
| 핵심 구현 커밋 | `afaa291` |
| 상태 | 구현 완료, `develop/stage-1` 공통 조립부에 통합 완료 |

이 문서는 전달받은 B 파트 인수인계 내용을 현재 코드와 통합 상태에 맞게 정리한 문서다. 이전 문서에 있던 완료된 요청과 오래된 테스트 안내는 제거했다.

## 2. 완료 범위

- `outside`, `entrance`, `hallway` Room 모듈
- 연구소 외부에서 키카드 획득
- 키카드로 정문 잠금 해제 후 입구 이동
- 입구와 중앙 복도 왕복
- 중앙 복도에서 C·D·E·F Room으로 전환
- 선행 진행도에 따른 각 Room 잠금과 안내 문구
- 기밀 문서 획득 후 외부 탈출 지점에서 Stage 1 완료 요청
- Room 계약, 진행도 패치, 전환 조건 테스트

## 3. A 파트 공개 진입점

| Room ID | 공개 모듈 | 파일 |
| --- | --- | --- |
| `outside` | `outsideRoom` | `src/game/stage-one/rooms/outside/outsideRoom.ts` |
| `entrance` | `entranceRoom` | `src/game/stage-one/rooms/entrance/entranceRoom.ts` |
| `hallway` | `hallwayRoom` | `src/game/stage-one/rooms/hallway/hallwayRoom.ts` |

세 Room은 `develop/stage-1`의 `createStageOneRooms`에 이미 등록되어 있다. 중복 등록하지 말고 Room 배열의 시작 지점과 전환 ID만 유지한다.

## 4. 진행도 계약

| 플래그 | B 파트의 역할 |
| --- | --- |
| `hasKeycard` | 외부에서 획득하고 정문 해제 조건으로 사용 |
| `entranceUnlocked` | 정문 해제 시 저장하고 연구 자료실 입장 조건으로 사용 |
| `archiveClueFound` | C 파트가 저장하며 과학 실험실 문 개방에 사용 |
| `scienceLabPuzzleSolved` | D 파트가 저장하며 보안 통제실 문 개방에 사용 |
| `documentStorageUnlocked` | E 파트가 저장하며 문서 보관실 문 개방에 사용 |
| `confidentialDocumentObtained` | F 파트가 저장하며 최종 탈출 조건으로 사용 |

중앙 복도는 위 플래그를 읽기만 한다. 다른 파트 플래그를 B 코드에서 임의로 변경하지 않는다.

## 5. 이동 순서

```text
outside
  → 키카드 획득
  → 정문 해제
  → entrance
  → hallway
  → archive
  → science-lab
  → control-room
  → document-storage
  → hallway → entrance → outside
  → completeEscape()
```

복도 문은 다음 공개 Room ID를 사용한다.

- 연구 자료실: `archive`
- 과학 실험실: `science-lab`
- 보안 통제실: `control-room`
- 문서 보관실: `document-storage`

각 담당자는 해당 ID와 `hallway` 복귀 경로를 그대로 사용해야 한다.

## 6. 주요 상호작용

| ID | 위치 | 동작 |
| --- | --- | --- |
| `outside-keycard` | 외부 | `hasKeycard` 저장 |
| `outside-front-door` | 외부 | 키카드 확인, `entranceUnlocked` 저장, 입구 전환 |
| `outside-escape` | 외부 | 기밀 문서 확인 후 `completeEscape()` 호출 |
| `entrance-to-outside` | 입구 | 외부 전환 |
| `entrance-to-hallway` | 입구 | 중앙 복도 전환 |
| `hallway-to-*` | 중앙 복도 | 선행 플래그 확인 후 각 파트 Room 전환 |

## 7. QA 동선

1. `outside`에서 키카드 없이 정문이 열리지 않는지 확인한다.
2. 키카드를 줍고 정문을 열어 `entrance`, `hallway` 순서로 이동한다.
3. 저장 후 새로고침했을 때 키카드와 정문 해제 상태가 유지되는지 확인한다.
4. 각 선행 플래그를 만족하기 전후로 복도 문 잠금 상태가 바뀌는지 확인한다.
5. `confidentialDocumentObtained`가 `false`이면 외부 탈출이 거절되는지 확인한다.
6. 플래그가 `true`이면 외부 탈출 지점에서 Stage 1 완료 처리가 호출되는지 확인한다.

## 8. 검증과 제한 사항

- 파트 테스트: `src/game/stage-one/rooms/hallway/partBRooms.test.ts`
- 전체 테스트는 `npm test`가 자동 탐색한다.
- 브라우저 QA에서는 다른 파트 Room 등록과 실제 진행도 저장까지 함께 확인해야 한다.
- 시각 자산은 공통 그래픽과 임시 도형을 사용하므로 최종 아트 교체 시 상호작용 좌표를 회귀 테스트한다.

A 파트의 추가 구현 요청은 없다. 통합 PR에서는 Room ID, 저장 플래그, 최종 탈출 호출이 유지되는지만 확인한다.
