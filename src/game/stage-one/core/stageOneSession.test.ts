import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultStageOneSaveState,
  type StageOneCompleteResult,
  type StageOneProgressBridge,
  type StageOneProgressResult,
  type StageOneSaveState,
} from "../../../types/stage-one.ts";
import { StageOneSession } from "./stageOneSession.ts";

function createProgressResult(
  state: StageOneSaveState = createDefaultStageOneSaveState(),
  elapsedTimeMs = 0,
): StageOneProgressResult {
  return {
    progress: {
      status: "in_progress",
      bestClearTimeMs: null,
      startedAt: "2026-08-08T00:00:00.000Z",
      clearedAt: null,
      lastPlayedAt: "2026-08-08T00:00:00.000Z",
    },
    state,
    canContinue: true,
    elapsedTimeMs,
    lastSavedAt: "2026-08-08T00:00:00.000Z",
  };
}

function createBridge(
  overrides: Partial<StageOneProgressBridge> = {},
): StageOneProgressBridge {
  const progress = createProgressResult();

  return {
    start: async () => progress,
    load: async () => progress,
    save: async () => undefined,
    complete: async () => ({
      ...progress,
      stageTwoUnlocked: true,
    }),
    ...overrides,
  };
}

test("서버 누적 시간부터 시작하고 일시정지 시간은 제외한다", () => {
  let now = 1_000;
  const session = new StageOneSession(
    createBridge(),
    createProgressResult(createDefaultStageOneSaveState(), 10_000),
    { now: () => now, retryDelaysMs: [] },
  );

  now = 2_500;
  assert.equal(session.getElapsedTimeMs(), 11_500);

  session.setPaused(true);
  now = 7_500;
  assert.equal(session.getElapsedTimeMs(), 11_500);

  session.setPaused(false);
  now = 8_500;
  assert.equal(session.getElapsedTimeMs(), 12_500);
});

test("상태를 불변 객체로 갱신하고 저장 실패에도 게임 상태를 유지한다", async () => {
  const initialState = createDefaultStageOneSaveState();
  const session = new StageOneSession(
    createBridge({
      save: async () => {
        throw new Error("offline");
      },
    }),
    createProgressResult(initialState),
    { retryDelaysMs: [] },
  );

  await assert.rejects(
    session.updateProgress({ hasKeycard: true }),
    /offline/,
  );

  assert.equal(initialState.hasKeycard, false);
  assert.equal(session.getState().hasKeycard, true);
});

test("완료된 진행 플래그가 false로 회귀하는 것을 거부한다", async () => {
  const session = new StageOneSession(
    createBridge(),
    createProgressResult({
      ...createDefaultStageOneSaveState(),
      hasKeycard: true,
    }),
    { retryDelaysMs: [] },
  );

  await assert.rejects(
    session.updateProgress({ hasKeycard: false }),
    /되돌릴 수 없습니다/,
  );
});

test("최종 탈출 상태를 저장한 뒤에만 complete를 호출한다", async () => {
  const calls: string[] = [];
  const completedState: StageOneSaveState = {
    ...createDefaultStageOneSaveState(),
    currentRoom: "outside",
    hasKeycard: true,
    entranceUnlocked: true,
    archiveClueFound: true,
    scienceLabPuzzleSolved: true,
    controlRoomSolved: true,
    documentStorageUnlocked: true,
    confidentialDocumentObtained: true,
    escaped: true,
  };
  const completeResult: StageOneCompleteResult = {
    ...createProgressResult(completedState, 120_000),
    progress: {
      ...createProgressResult().progress,
      status: "cleared",
    },
    stageTwoUnlocked: true,
  };
  const bridge = createBridge({
    async save(state) {
      calls.push(`save:${state.escaped}`);
    },
    async complete() {
      calls.push("complete");
      return completeResult;
    },
  });
  const session = new StageOneSession(
    bridge,
    createProgressResult({ ...completedState, escaped: false }),
    { retryDelaysMs: [] },
  );

  const result = await session.completeEscape();

  assert.deepEqual(calls, ["save:true", "complete"]);
  assert.equal(result.stageTwoUnlocked, true);
  assert.equal(session.getState().escaped, true);
});
