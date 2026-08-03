import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultStageOneSaveState,
  STAGE_ONE_MAX_STATE_BYTES,
  STAGE_ONE_ROOM_DISPLAY_NAMES,
  STAGE_ONE_ROOM_IDS,
  validateStageOneSaveInput,
  validateStageOneSaveState,
} from "./stage-one.ts";

test("신규 사용자의 Stage 1 기본 상태를 생성한다", () => {
  assert.deepEqual(createDefaultStageOneSaveState(), {
    version: 1,
    currentRoom: "outside",
    hasKeycard: false,
    entranceUnlocked: false,
    archiveClueFound: false,
    chemistryPuzzleSolved: false,
    controlRoomSolved: false,
    classifiedStorageUnlocked: false,
    classifiedDocumentObtained: false,
    escaped: false,
  });
});

test("안정적인 Room ID를 사용자용 장소 명칭에 매핑한다", () => {
  assert.deepEqual(STAGE_ONE_ROOM_IDS, [
    "outside",
    "entrance",
    "hallway",
    "archive",
    "chemistry-lab",
    "control-room",
    "classified-storage",
  ]);
  assert.equal(STAGE_ONE_ROOM_DISPLAY_NAMES["chemistry-lab"], "과학 실험실");
  assert.equal(
    STAGE_ONE_ROOM_DISPLAY_NAMES["classified-storage"],
    "문서 보관실",
  );
});

const invalidProgressionCases = [
  {
    name: "키카드 없이 입구 해제 상태를 거부한다",
    changes: { entranceUnlocked: true },
    message: /키카드/,
  },
  {
    name: "자료실 단서 없이 과학 실험실 퍼즐 완료 상태를 거부한다",
    changes: { chemistryPuzzleSolved: true },
    message: /연구 자료실 단서/,
  },
  {
    name: "과학 실험실 퍼즐 완료 없이 보안실 완료 상태를 거부한다",
    changes: { controlRoomSolved: true },
    message: /과학 실험실 퍼즐/,
  },
  {
    name: "보안실 완료 없이 문서 보관실 해금 상태를 거부한다",
    changes: { classifiedStorageUnlocked: true },
    message: /보안 통제실/,
  },
  {
    name: "문서 보관실 해금 없이 기밀 문서 획득 상태를 거부한다",
    changes: { classifiedDocumentObtained: true },
    message: /문서 보관실/,
  },
  {
    name: "기밀 문서 없이 탈출 상태를 거부한다",
    changes: { escaped: true },
    message: /기밀 문서/,
  },
] as const;

for (const { name, changes, message } of invalidProgressionCases) {
  test(name, () => {
    assert.throws(
      () =>
        validateStageOneSaveState({
          ...createDefaultStageOneSaveState(),
          ...changes,
        }),
      message,
    );
  });
}

test("허용되지 않은 방 ID를 거부한다", () => {
  assert.throws(
    () =>
      validateStageOneSaveState({
        ...createDefaultStageOneSaveState(),
        currentRoom: "server-room",
      }),
    /방 ID/,
  );
});

test("잘못된 boolean 필드를 거부한다", () => {
  assert.throws(
    () =>
      validateStageOneSaveState({
        ...createDefaultStageOneSaveState(),
        hasKeycard: "yes",
      }),
    /boolean/,
  );
});

test("지원하지 않는 저장 버전을 거부한다", () => {
  assert.throws(
    () =>
      validateStageOneSaveState({
        ...createDefaultStageOneSaveState(),
        version: 2,
      }),
    /저장 버전/,
  );
});

test("누락된 필드가 있는 상태를 거부한다", () => {
  const state: Record<string, unknown> = {
    ...createDefaultStageOneSaveState(),
  };
  delete state.escaped;

  assert.throws(() => validateStageOneSaveState(state), /누락/);
});

test("허용되지 않은 추가 필드가 있는 상태를 거부한다", () => {
  assert.throws(
    () =>
      validateStageOneSaveState({
        ...createDefaultStageOneSaveState(),
        unexpected: true,
      }),
    /허용되지 않은 필드/,
  );
});

test("4,096바이트를 초과하는 상태를 거부한다", () => {
  assert.throws(
    () =>
      validateStageOneSaveState({
        ...createDefaultStageOneSaveState(),
        padding: "x".repeat(STAGE_ONE_MAX_STATE_BYTES),
      }),
    /4096바이트/,
  );
});

test("음수 경과 시간을 거부한다", () => {
  assert.throws(
    () =>
      validateStageOneSaveInput({
        state: createDefaultStageOneSaveState(),
        elapsedTimeMs: -1,
      }),
    /경과 시간/,
  );
});

test("안전한 정수 범위를 벗어난 경과 시간을 거부한다", () => {
  assert.throws(
    () =>
      validateStageOneSaveInput({
        state: createDefaultStageOneSaveState(),
        elapsedTimeMs: Number.MAX_SAFE_INTEGER + 1,
      }),
    /안전한 정수/,
  );
});

test("정상 진행 순서와 경과 시간을 허용한다", () => {
  const state = {
    ...createDefaultStageOneSaveState(),
    currentRoom: "outside" as const,
    hasKeycard: true,
    entranceUnlocked: true,
    archiveClueFound: true,
    chemistryPuzzleSolved: true,
    controlRoomSolved: true,
    classifiedStorageUnlocked: true,
    classifiedDocumentObtained: true,
    escaped: true,
  };

  assert.deepEqual(
    validateStageOneSaveInput({ state, elapsedTimeMs: 120_000 }),
    { state, elapsedTimeMs: 120_000 },
  );
});
