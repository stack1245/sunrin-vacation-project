# Stage 1 진행도 연동 가이드

## 저장 상태

`StageOneSaveState`는 Stage 1 내부에서 복구해야 할 최소 상태다. 저장 데이터 버전은 현재 `1`이며, 필드를 임의로 추가하거나 생략할 수 없다.

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| `version` | `1` | 저장 스키마 버전 |
| `currentRoom` | `StageOneRoomId` | 마지막으로 저장한 현재 위치 |
| `hasKeycard` | `boolean` | 연구소 외부 키카드 획득 여부 |
| `entranceUnlocked` | `boolean` | 연구소 입구 잠금 해제 여부 |
| `archiveClueFound` | `boolean` | 연구 자료실 단서 획득 여부 |
| `chemistryPuzzleSolved` | `boolean` | 과학 실험실 퍼즐 해결 여부 |
| `controlRoomSolved` | `boolean` | 보안 통제실 퍼즐 해결 여부 |
| `classifiedStorageUnlocked` | `boolean` | 문서 보관실 해금 여부 |
| `classifiedDocumentObtained` | `boolean` | 기밀 문서 획득 여부 |
| `escaped` | `boolean` | 기밀 문서를 가진 상태로 연구소 탈출 완료 여부 |

신규 저장의 위치는 `outside`, 버전은 `1`, 모든 진행 플래그는 `false`다.

## Room ID

허용되는 Room ID는 아래 일곱 개뿐이다.

- `outside`: 연구소 외부
- `entrance`: 연구소 입구
- `hallway`: 중앙 복도
- `archive`: 연구 자료실
- `chemistry-lab`: 과학 실험실
- `control-room`: 보안 통제실
- `classified-storage`: 문서 보관실

다른 문자열은 클라이언트 검증과 DB 검증에서 모두 거부된다.

`chemistry-lab`은 저장 호환성을 위해 유지하는 과학 실험실의 내부 ID이고, `classified-storage`는 저장 호환성을 위해 유지하는 문서 보관실의 내부 ID다. UI, 접근성 라벨과 제목에는 내부 ID를 직접 표시하지 않고 `STAGE_ONE_ROOM_DISPLAY_NAMES`의 사용자용 장소 명칭을 사용한다.

## 브리지 생성과 시작

브라우저에서 Phaser 게임을 생성할 때 진행 브리지도 한 번 생성한다. 이 모듈은 클라이언트 전용이며 서버 컴포넌트에서 import하지 않는다.

```ts
import { createStageOneProgressBridge } from "@/game/stage-one/progressBridge";

const progress = createStageOneProgressBridge();
const initial = await progress.start();
```

`start()`는 실제 플레이를 시작하거나 Stage 1 Scene에 진입하는 시점에 한 번 호출한다. 로그인과 접근 가능 상태를 확인하고, `unlocked`를 `in_progress`로 바꾸며 최초 시작 시각과 `last_played_at`을 기록한다. 저장이 없을 때만 기본 저장을 만들므로 재호출해도 플레이 상태가 초기화되지 않는다.

현재 Stage 1 입장 화면도 이 전용 시작 함수를 사용한다. Phaser Scene을 붙일 때에는 입장 화면에서 받은 결과를 전달하거나 Scene 부팅 시 `load()`를 호출하되, 불필요한 중복 네트워크 호출은 피한다.

## 이어하기

```ts
const saved = await progress.load();

if (saved.canContinue) {
  restoreRoom(saved.state.currentRoom);
  restoreFlags(saved.state);
  resumeTimerFrom(saved.elapsedTimeMs);
}
```

`load()` 반환값에는 스테이지 전체 진행 상태, 세부 저장 상태, 이어하기 가능 여부, 누적 경과 시간과 마지막 저장 시각이 포함된다. 접근 가능한 사용자에게 저장이 없으면 서버가 안전한 기본 저장을 생성한다.

`canContinue`는 Stage 1 상태가 `in_progress`일 때 `true`다. 클리어 후 다시 입장하는 흐름은 새 게임 초기화와 구분해야 하므로, 게임 담당자가 명시적으로 재시작 정책을 합의하기 전에는 저장을 임의 초기화하지 않는다.

## 저장

상태를 불변 객체처럼 복사해 갱신한 다음 누적 경과 시간과 함께 저장한다.

```ts
const nextState = {
  ...saved.state,
  currentRoom: "archive" as const,
  archiveClueFound: true,
};

try {
  await progress.save(nextState, elapsedTimeMs);
} catch {
  showNonBlockingSaveWarning();
  queueSaveRetry(nextState, elapsedTimeMs);
}
```

자동 저장 권장 시점은 다음과 같다.

- 방 이동 직후
- 단서 획득 직후
- 퍼즐 해결 직후
- 문서 보관실 해금 직후
- 문서 보관실에서 기밀 문서 획득 직후
- 탈출 플래그 반영 직후

`elapsedTimeMs`는 `0` 이상 `Number.MAX_SAFE_INTEGER` 이하의 안전한 정수이며, Scene을 다시 열었을 때 서버에서 불러온 누적 시간부터 이어서 계산한다. 네트워크 응답 순서가 뒤바뀌어 더 오래된 경과 시간의 요청이 늦게 도착하면 서버는 그 요청을 무해하게 무시한다. 이미 `true`가 된 진행 플래그는 다시 `false`로 저장할 수 없다.

저장 오류가 발생해도 게임 루프를 중단하거나 이미 성공한 퍼즐을 즉시 되돌리지 않는다. 마지막 성공 저장을 기준으로 짧은 간격의 재시도 큐를 운영하고, 화면에는 비차단 경고와 수동 재시도 수단을 제공한다. 재시도는 동일 상태로 호출해도 안전하다.

## 진행 선행 조건

다음 모순 상태는 저장되지 않는다.

- `hasKeycard` 없이 `entranceUnlocked`
- `archiveClueFound` 없이 `chemistryPuzzleSolved`
- `chemistryPuzzleSolved` 없이 `controlRoomSolved`
- `controlRoomSolved` 없이 `classifiedStorageUnlocked`
- `classifiedStorageUnlocked` 없이 `classifiedDocumentObtained`
- `classifiedDocumentObtained` 없이 `escaped`

이 검증은 진행 순서만 확인한다. 퍼즐 정답 자체는 각 퍼즐 담당 코드가 판정한다.

## 클리어와 Stage 2 해금

탈출에 성공하면 먼저 최종 상태와 누적 시간을 저장한 뒤 `complete()`를 호출한다.

```ts
const escapedState = {
  ...currentState,
  currentRoom: "outside" as const,
  escaped: true,
};

await progress.save(escapedState, elapsedTimeMs);
const result = await progress.complete();

if (result.stageTwoUnlocked) {
  showStageClearSequence();
}
```

클리어는 일반 `save()`가 아니라 반드시 `complete()`로 처리한다. 서버는 클라이언트가 보낸 상태가 아니라 서버에 마지막으로 저장된 상태에서 기밀 문서 획득과 탈출 완료를 다시 확인하고, 저장된 누적 시간으로 기존 최고 기록 규칙을 적용한다. 정상 조건에서만 Stage 1을 `cleared`로 만들고 다음 공개 스테이지(Stage 2)를 해금한다.

## 금지 규칙

- Phaser Scene이나 퍼즐 코드에서 Supabase 클라이언트를 생성하지 않는다.
- 퍼즐 담당자가 `user_stage_saves`나 `user_stage_progress` 테이블을 직접 수정하지 않는다.
- Phaser에서 `userId`를 조회하거나 브리지에 전달하지 않는다. 인증 사용자는 Supabase 세션의 `auth.uid()`로만 결정된다.
- `status`, `nextStageId`, 클리어 기록을 클라이언트가 직접 지정하지 않는다.
- `escaped: true`를 일반 저장한 것만으로 클리어됐다고 가정하지 않는다.
- 저장 실패를 무시한 채 `complete()`를 먼저 호출하지 않는다.
