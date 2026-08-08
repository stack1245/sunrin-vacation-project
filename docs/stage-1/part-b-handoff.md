# Stage 1 B 파트 인계 — 연구소 외부·입구·중앙 복도

> 기준일: 2026-08-08
>
> 담당: B 파트 `10404`
>
> 브랜치: `feat/stage-1/10404`
>
> 적용 대상: A 파트 통합, C 파트 연구 자료실 연결

## 1. 구현 범위

B 파트는 Stage 1의 진입 동선 세 구간을 담당한다. 실제 플레이는 `StageOneRoomModule` 계약을 구현한 Room 모듈 세 개로 구성하며, 그래픽은 Phaser 도형과 텍스트로만 생성하고 외부 이미지 에셋을 사용하지 않는다.

| Room ID | 표시명 | 파일 |
| --- | --- | --- |
| `outside` | 연구소 외부 | `src/game/stage-one/rooms/outside/outsideRoom.ts` |
| `entrance` | 연구소 입구 | `src/game/stage-one/rooms/entrance/entranceRoom.ts` |
| `hallway` | 중앙 복도 | `src/game/stage-one/rooms/hallway/hallwayRoom.ts` |

세 모듈 모두 `id`, `displayName`, `getObjective`, `getAccess`, `getSpawnPoint`, `mount`를 내보낸다. 이동·충돌·상호작용 선택·HUD는 A 공통 계층에 맡기고 Room은 배치와 판정만 담당한다.

## 2. A 파트 등록 요청

`createStageOneGame()`의 `rooms` 인자는 A 소유이므로 B가 직접 등록할 수 없다. `createStageOneReferenceRooms()`가 제공하는 임시 슬롯 가운데 `outside`, `entrance`, `hallway` 세 개를 위 모듈로 교체하면 된다. 나머지 네 Room은 C~F 인계 전까지 기존 참조 구현을 유지한다.

## 3. Room 접근 조건

`getAccess`는 포털과 `transitionTo()` 양쪽에서 검사된다. 잠금 사유는 색상이 아니라 문구로 전달한다.

| Room | 조건 | 거부 사유 |
| --- | --- | --- |
| `outside` | 없음 | — |
| `entrance` | `entranceUnlocked` | 정문 잠금장치를 먼저 해제하세요. |
| `hallway` | `entranceUnlocked` | 정문 잠금장치를 먼저 해제하세요. |

## 4. 상호작용 계약

### 4.1 연구소 외부

| ID | 위치 | 반경 | 활성 조건 |
| --- | --- | --- | --- |
| `outside-keycard` | (250, 200) | 72 | `!hasKeycard` |
| `outside-front-door` | (820, 270) | 84 | 항상 |
| `outside-escape` | (140, 430) | 84 | 항상 |

키카드는 `enabled`로 중복 획득을 차단하고, 저장 성공 후에만 표식을 숨긴다. 정문은 상태에 따라 세 갈래로 갈라진다. 키카드가 없으면 경고 문구만 표시하고 플래그를 바꾸지 않는다. 키카드가 있고 아직 해제 전이면 `entranceUnlocked`를 저장한 뒤 이동하며, 이미 해제된 뒤에는 저장 없이 이동한다.

탈출 지점은 `confidentialDocumentObtained`가 false면 경고만 표시한다. true일 때만 `completeEscape()`를 호출하며 `complete()`는 직접 호출하지 않는다. 최종 저장과 클리어 RPC 순서는 A 세션이 담당한다.

### 4.2 연구소 입구

외부와 복도를 잇는 통로 구간이다. 가운데 (480, 270)에 160×64 충돌 벽을 두어 좌우로 우회하게 했다.

| ID | 위치 | 대상 |
| --- | --- | --- |
| `entrance-to-outside` | (110, 270) | `outside` |
| `entrance-to-hallway` | (850, 270) | `hallway` |

### 4.3 중앙 복도

네 구역으로 향하는 문은 `addPortal`이 아니라 `addInteraction`으로 구현했다. 포털은 목적지 Room의 `getAccess`로 잠금을 판정하는데 목적지가 C~F 소유이므로, B가 선행 플래그별 잠금 사유를 제어하려면 상호작용이 필요하다. 조건 충족 시에만 `transitionTo()`를 호출하므로 목적지 `getAccess`와 이중으로 검사된다. 각 문에는 `개방` 또는 `잠김` 라벨을 함께 표시한다.

| ID | 위치 | 열림 조건 | 잠김 문구 |
| --- | --- | --- | --- |
| `hallway-to-archive` | (220, 150) | `entranceUnlocked` | 정문을 먼저 해제하세요. |
| `hallway-to-science-lab` | (400, 150) | `archiveClueFound` | 연구 자료실에서 단서를 먼저 확보하세요. |
| `hallway-to-control-room` | (580, 150) | `scienceLabPuzzleSolved` | 과학 실험실 장치를 먼저 작동시키세요. |
| `hallway-to-document-storage` | (760, 150) | `documentStorageUnlocked` | 보안 통제실에서 보관실 잠금을 먼저 해제하세요. |
| `hallway-to-entrance` | (110, 430) | 항상 | — |

## 5. 진행 플래그 영향 범위

B가 직접 갱신하는 플래그는 두 개뿐이다. 나머지는 읽기만 하며 쓰지 않는다.

| 플래그 | 갱신 시점 |
| --- | --- |
| `hasKeycard` | 외부 키카드 상호작용 성공 시 |
| `entranceUnlocked` | 키카드 보유 상태로 정문 해제 시 |

`escaped`는 `completeEscape()`를 통해 A가 저장한다. 잠금 상태와 경고 분기에서는 어떤 플래그도 변경되지 않는다.

## 6. spawn 좌표

| Room | 이전 Room | spawn |
| --- | --- | --- |
| `outside` | `entrance` | (700, 270) |
| `outside` | 그 외 | (200, 380) |
| `entrance` | `hallway` | (720, 270) |
| `entrance` | 그 외 | (220, 270) |
| `hallway` | `entrance` | (230, 400) |
| `hallway` | 그 외 | (480, 340) |

## 7. C 파트 연결 정보

연구 자료실 담당(`10409`)이 사용할 좌표와 조건은 다음과 같다.

- 복도에서 자료실로 나가는 지점은 (220, 150)이다.
- 자료실에서 복도로 돌아올 때 복도 spawn은 (480, 340)이며, 포털 대상 Room ID는 `hallway`를 사용한다.
- 자료실 문은 `entranceUnlocked`만 확인하므로 B 쪽 추가 작업 없이 진입할 수 있다.
- 자료실 퍼즐 성공 후 `archiveClueFound`를 저장하면 복도의 과학 실험실 문이 자동으로 열린다. 복도 코드 수정은 필요 없다.

## 8. 테스트

`src/game/stage-one/rooms/hallway/partBRooms.test.ts`에 여섯 개 케이스가 있다. `mount()`는 Phaser Scene을 요구하므로 단위 테스트에서 제외했으며, `core/referenceRooms.test.ts`와 같은 방식으로 순수 함수만 검사한다.

1. Room ID와 한국어 표시명이 공통 상수와 일치한다.
2. 정문 해제 전 `entrance`·`hallway` 접근이 거부된다.
3. 정문 해제 후 두 Room 접근이 허용된다.
4. 외부 목표 문구가 `hasKeycard`, `entranceUnlocked`에 따라 달라진다.
5. 복도 목표 문구가 다음 선행 조건을 가리킨다.
6. 세 Room의 spawn 좌표가 벽 안쪽 범위에 있다.

`package.json`의 `test` 스크립트가 파일 경로를 직접 나열하는 방식이라 이 파일이 `npm test`에 포함되지 않는다. 아래 경로 추가가 필요하다.

```
src/game/stage-one/rooms/hallway/partBRooms.test.ts
```

직접 실행하면 여섯 개 모두 통과한다.

```powershell
node --test --experimental-strip-types src/game/stage-one/rooms/hallway/partBRooms.test.ts
```

## 9. 검증 결과

| 항목 | 결과 |
| --- | --- |
| B 파트 테스트 6개 | 통과 |
| `npm run typecheck` | 오류 0 |
| `npm run lint` | 오류 0 |
| `npm run build` | 성공 |
| `git diff --check` | 문제 없음 |

## 10. 알려진 제한

- 로컬 `.env.local`에 Supabase 공개 클라이언트 값이 없어 브라우저 플레이 검증을 수행하지 못했다. 배치와 반경은 좌표 기준으로만 확인했다.
- 월드 크기 960×540을 각 Room 파일에 상수로 선언했다. A가 월드 크기를 변경하면 세 파일의 `WORLD_WIDTH`, `WORLD_HEIGHT`도 함께 수정해야 한다.
- 복도에서 문 사이를 지날 때 활성 상호작용이 자주 전환된다. 실제 플레이에서 산만하면 문 간격이나 반경 조정이 필요하다.
- 좁은 화면에서 HUD와 캔버스가 겹치는지 확인하지 못했다.
- 그래픽은 도형과 텍스트로만 구성했으며 픽셀 에셋을 사용하지 않는다.

## 11. 인계 체크리스트

- [x] Room ID와 한국어 표시명이 공통 상수와 일치한다.
- [x] Room 모듈이 `StageOneRoomModule` 계약을 만족한다.
- [x] 생성한 Phaser 게임 오브젝트를 `track()`에 등록한다.
- [ ] 벽, 출입구와 상호작용 위치를 실제 플레이로 확인한다.
- [x] 잠금 조건과 경고 분기에서 진행 플래그가 변하지 않는다.
- [x] 성공 플래그와 선행 조건이 저장 버전 2 계약을 지킨다.
- [x] Room 전용 테스트와 입력·출력·알려진 제한을 A에게 전달한다.
- [x] `npm run typecheck`, `npm run lint`, `npm run build`가 통과한다.
- [ ] `npm test`에 B 파트 테스트 파일이 포함된다.