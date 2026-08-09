import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultStageOneSaveState } from "../../../../types/stage-one.ts";
import { createArchiveRoom } from "./archiveRoom.ts";

test("id와 displayName이 자료실을 가리킨다", () => {
  const room = createArchiveRoom();
  assert.equal(room.id, "archive");
  assert.equal(room.displayName, "연구 자료실");
});

test("입구가 해제되지 않으면 접근할 수 없다", () => {
  const room = createArchiveRoom();
  const lockedState = createDefaultStageOneSaveState();

  assert.equal(room.getAccess?.(lockedState).allowed, false);
});

test("입구가 해제되면 접근할 수 있다", () => {
  const room = createArchiveRoom();
  const unlockedState = {
    ...createDefaultStageOneSaveState(),
    hasKeycard: true,
    entranceUnlocked: true,
  };

  assert.equal(room.getAccess?.(unlockedState).allowed, true);
});

test("자료실 단서를 아직 못 찾았으면 카이사르 해독 목표를 안내한다", () => {
  const room = createArchiveRoom();
  const state = {
    ...createDefaultStageOneSaveState(),
    entranceUnlocked: true,
  };

  assert.match(room.getObjective(state), /카이사르/);
});

test("자료실 단서를 찾았으면 중앙 복도로 복귀를 안내한다", () => {
  const room = createArchiveRoom();
  const state = {
    ...createDefaultStageOneSaveState(),
    entranceUnlocked: true,
    archiveClueFound: true,
  };

  assert.match(room.getObjective(state), /중앙 복도/);
});

test("중앙 복도에서 진입하면 오른쪽 스폰 지점을 사용한다", () => {
  const room = createArchiveRoom();
  const spawn = room.getSpawnPoint?.("hallway");

  assert.deepEqual(spawn, { x: 220, y: 150 });
});

test("복도 외 경로로 진입하면 기본 스폰 지점을 사용한다", () => {
  const room = createArchiveRoom();
  const spawn = room.getSpawnPoint?.(null);

  assert.deepEqual(spawn, { x: 480, y: 270 });
});