# Stage 1 Phaser·Room 통합 가이드

> 기준일: 2026-08-09
>
> 담당: A 파트 `10320`
>
> 적용 대상: B~F Room·퍼즐 모듈

## 1. 공통 실행 흐름

```text
StageEntryView
  → StageOneProgressBridge 1회 생성 및 start() 1회 실행
  → StageOneGameHost (React HUD·ResizeObserver·생명주기)
  → createStageOneGame (composition root)
  → StageOneScene (입력·플레이어·충돌·상호작용·Room 전환)
  → StageOneSession (불변 상태·타이머·클리어 순서)
  → StageOneSaveQueue (직렬 저장·1초/2초/4초 재시도)
  → 기존 StageOneProgressBridge
```

Phaser는 `StageOneGameHost`의 브라우저 `useEffect` 안에서 동적으로 불러온다. 서버 렌더링 중 `window`나 `document`에 접근하지 않으며, React가 다시 렌더링되어도 시작 Promise와 Bridge를 재사용한다. 컴포넌트가 종료되면 게임, 키 입력, Scene 이벤트와 `ResizeObserver`가 정리된다.

## 2. 공통 파일 지도

| 경로 | 책임 |
| --- | --- |
| `src/components/stages/StageOneGameHost.tsx` | React HUD, 캔버스 컨테이너, 일시정지·저장 재시도 UI |
| `src/game/stage-one/adapters/supabaseStageOneProgressBridge.ts` | 게임 진행도 계약과 Supabase 진행도 서비스 조립 |
| `src/game/stage-one/core/createStageOneGame.ts` | Phaser, 세션, Room과 Bridge 조립 |
| `src/game/stage-one/core/StageOneScene.ts` | 이동·충돌·상호작용 선택·Room 전환 |
| `src/game/stage-one/core/stageOneSession.ts` | 진행 상태, 타이머, 상태 회귀 방지, 클리어 순서 |
| `src/game/stage-one/core/saveQueue.ts` | 저장 직렬화와 자동·수동 재시도 |
| `src/game/stage-one/contracts/room.ts` | B~F가 구현할 Room·상호작용 계약 |
| `src/game/stage-one/contracts/events.ts` | Phaser와 React HUD 사이 이벤트 계약 |
| `src/game/stage-one/core/referenceRooms.ts` | 모든 Room ID를 연결하는 임시 공통 슬롯 |

`referenceRooms.ts`는 퍼즐 구현이 아니라 통합용 슬롯이다. 실제 Room이 준비되면 A가 `createStageOneGame()`의 `rooms` 인자에 B~F 모듈을 등록한다.

## 3. Room 모듈 계약

Room은 `StageOneRoomModule` 하나를 내보낸다.

```ts
import type { StageOneRoomModule } from "@/game/stage-one/contracts";

export const archiveRoom: StageOneRoomModule = {
  id: "archive",
  displayName: "연구 자료실",
  getObjective(state) {
    return state.archiveClueFound
      ? "확보한 단서를 가지고 중앙 복도로 돌아가세요."
      : "암호화된 연구 기록을 해독하세요.";
  },
  getAccess(state) {
    return state.entranceUnlocked
      ? { allowed: true }
      : { allowed: false, reason: "연구소 입구를 먼저 해제하세요." };
  },
  mount(context) {
    const terminal = context.scene.add.rectangle(520, 260, 72, 56, 0x66558f);
    context.track(terminal);
    context.addWall({ x: 480, y: 32, width: 960, height: 64 });
    context.addInteraction({
      id: "archive-terminal",
      position: { x: 520, y: 260 },
      prompt: "E · 연구 기록 확인",
      enabled: (state) => !state.archiveClueFound,
      async onInteract(game) {
        // 퍼즐 정답 판정이 성공한 뒤에만 호출한다.
        await game.updateProgress(
          { archiveClueFound: true },
          "과학 실험실 단서를 확보했습니다.",
        );
      },
    });
    context.addPortal({
      id: "archive-to-hallway",
      targetRoomId: "hallway",
      position: { x: 110, y: 270 },
    });
  },
};
```

### `StageOneRoomMountContext`

- `scene`: Room 그래픽·타일맵·오브젝트를 생성할 현재 Phaser Scene
- `getState()`: 최신 `StageOneSaveState` 복사본 조회
- `track(gameObject)`: Room 전환 때 A 코어가 자동 제거할 게임 오브젝트 등록
- `addWall(bounds, color?)`: 플레이어와 충돌하는 고정 벽 등록
- `addInteraction(definition)`: 반경 안에서 E 입력으로 실행할 상호작용 등록
- `addPortal(definition)`: 접근 조건 확인, Room 저장과 전환을 담당하는 출입구 등록

Room 전용 DOM 이벤트, 타이머나 별도 구독을 만들었다면 `mount()`에서 정리 함수를 반환한다. `track()`한 Phaser 게임 오브젝트는 정리 함수에서 다시 파괴하지 않는다.

## 4. 상호작용 규칙

- `id`는 Room 안에서 충돌하지 않는 안정적인 영문 kebab-case를 사용한다.
- 활성 반경 안의 가장 가까운 상호작용 하나만 HUD에 표시된다.
- 텍스트 입력 요소에 포커스가 있으면 이동·상호작용 입력을 처리하지 않는다.
- 빠른 E 연타 중에는 같은 상호작용을 중복 실행하지 않는다.
- 퍼즐 오답은 `showMessage()`로 표시하고 저장 플래그를 변경하지 않는다.
- 퍼즐 정답 판정이 성공한 뒤에만 `updateProgress()`를 호출한다.

## 5. 저장과 진행도 갱신

```ts
await game.updateProgress(
  { scienceLabPuzzleSolved: true },
  "과학 실험실 퍼즐을 해결했습니다.",
);
```

`updateProgress()`는 기존 상태를 직접 수정하지 않고 새 객체를 만든다. 상태는 게임 안에서 즉시 유지되고 저장 요청은 호출 순서대로 직렬 처리된다. 저장이 실패하면 1초, 2초, 4초 뒤 자동 재시도하며 최종 실패 시 React HUD에 수동 재시도 버튼이 나타난다. 네트워크 실패만으로 성공한 퍼즐 상태를 되돌리지 않는다.

다음 행위는 자동 저장된다.

- `addPortal()`로 Room 전환
- `updateProgress()`로 아이템·단서·퍼즐 완료 플래그 갱신
- `completeEscape()`의 최종 `escaped` 상태

Phaser·Room·퍼즐 모듈에서 Supabase, RPC, 테이블 또는 사용자 ID를 직접 사용하지 않는다.

## 6. 최종 클리어

F는 문서 보관실에서 아래 상태까지만 저장한다.

```ts
await game.updateProgress(
  { confidentialDocumentObtained: true },
  "기밀 문서를 확보했습니다.",
);
```

B의 외부 탈출 상호작용은 기밀 문서 보유 여부를 확인한 뒤 `completeEscape()`를 호출한다. A 세션은 `currentRoom: "outside"`, `escaped: true` 상태 저장이 성공한 뒤에만 Bridge의 `complete()`를 실행한다. 최종 저장이 실패하면 클리어 RPC를 호출하지 않는다.

## 7. 입력과 HUD

| 기능 | 입력 | 공통 처리 |
| --- | --- | --- |
| 이동 | WASD, 방향키 | 대각선 속도 정규화, 벽·월드 경계 충돌 |
| 달리기 | Space | 이동 중 공통 달리기 속도 적용 |
| 상호작용 | E | 가장 가까운 활성 대상 하나만 실행 |
| 일시정지 | Escape | 물리와 경과 시간 일시정지, 같은 키로 재개 |

Room은 별도 HUD를 만들지 않고 목표, 장소, 시간, 진행 수, 저장 상태와 메시지를 공통 React HUD에 맡긴다. 퍼즐 전용 오버레이가 필요하면 키보드 포커스와 Scene 입력을 분리하고 종료 시 DOM과 이벤트를 정리한다.

## 8. 파트 인계 체크리스트

- [ ] Room ID와 한국어 표시명이 공통 상수와 일치한다.
- [ ] Room 모듈이 `StageOneRoomModule` 계약을 만족한다.
- [ ] 생성한 Phaser 게임 오브젝트를 `track()`에 등록한다.
- [ ] 벽, 출입구와 상호작용 위치를 실제 플레이로 확인한다.
- [ ] 잠금 조건과 오답에서 진행 플래그가 변하지 않는다.
- [ ] 성공 플래그와 선행 조건이 저장 버전 2 계약을 지킨다.
- [ ] 저장 실패에도 성공한 퍼즐 UI가 유지된다.
- [ ] 재입장 시 완료된 퍼즐 보상과 단서를 다시 확인할 수 있다.
- [ ] Room 전용 테스트와 입력·출력·알려진 제한을 A에게 전달한다.
- [ ] `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`가 통과한다.
