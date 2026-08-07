import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultStageOneSaveState } from "../../../types/stage-one.ts";
import { StageOneSaveQueue } from "./saveQueue.ts";

test("저장 요청을 호출 순서대로 직렬 처리한다", async () => {
  const calls: string[] = [];
  let releaseFirstSave: () => void = () => {};
  const firstSaveGate = new Promise<void>((resolve) => {
    releaseFirstSave = resolve;
  });
  const queue = new StageOneSaveQueue(
    {
      async save(state) {
        calls.push(`start:${state.currentRoom}`);

        if (state.currentRoom === "entrance") {
          await firstSaveGate;
        }

        calls.push(`end:${state.currentRoom}`);
      },
    },
    { retryDelaysMs: [] },
  );

  const first = queue.enqueue(
    {
      ...createDefaultStageOneSaveState(),
      currentRoom: "entrance",
    },
    100,
  );
  const second = queue.enqueue(
    {
      ...createDefaultStageOneSaveState(),
      currentRoom: "hallway",
    },
    200,
  );

  await Promise.resolve();
  assert.deepEqual(calls, ["start:entrance"]);
  releaseFirstSave();
  await Promise.all([first, second]);

  assert.deepEqual(calls, [
    "start:entrance",
    "end:entrance",
    "start:hallway",
    "end:hallway",
  ]);
});

test("일시적인 저장 실패를 1초, 2초, 4초 간격으로 재시도한다", async () => {
  const delays: number[] = [];
  const phases: string[] = [];
  let attempts = 0;
  const queue = new StageOneSaveQueue(
    {
      async save() {
        attempts += 1;

        if (attempts < 4) {
          throw new Error("temporary network error");
        }
      },
    },
    {
      sleep: async (delayMs) => {
        delays.push(delayMs);
      },
      onStatusChange: (status) => {
        phases.push(status.phase);
      },
    },
  );

  await queue.enqueue(createDefaultStageOneSaveState(), 1_000);

  assert.equal(attempts, 4);
  assert.deepEqual(delays, [1_000, 2_000, 4_000]);
  assert.deepEqual(phases, [
    "saving",
    "retrying",
    "retrying",
    "retrying",
    "saved",
  ]);
});

test("최종 실패 상태를 보관하고 수동 재시도로 복구한다", async () => {
  let shouldFail = true;
  let saveCalls = 0;
  const queue = new StageOneSaveQueue(
    {
      async save() {
        saveCalls += 1;

        if (shouldFail) {
          throw new Error("offline");
        }
      },
    },
    { retryDelaysMs: [] },
  );

  await assert.rejects(
    queue.enqueue(createDefaultStageOneSaveState(), 500),
    /offline/,
  );

  shouldFail = false;
  assert.equal(await queue.retryFailed(), true);
  assert.equal(await queue.retryFailed(), false);
  assert.equal(saveCalls, 2);
});
