import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultStageOneSaveState,
  type StageOneProgressResult,
  type StageOneRoomId,
} from "../../../types/stage-one.ts";
import type { StageOneRoomModule } from "../contracts/room.ts";
import {
  getStageOneLaunchRoomId,
  normalizeStageOneInitialProgress,
} from "./initialProgress.ts";

function createProgress(
  currentRoom: StageOneRoomId,
  entranceUnlocked = false,
): StageOneProgressResult {
  return {
    progress: {
      status: "in_progress",
      bestClearTimeMs: null,
      startedAt: "2026-08-12T00:00:00.000Z",
      clearedAt: null,
      lastPlayedAt: "2026-08-12T00:00:00.000Z",
    },
    state: {
      ...createDefaultStageOneSaveState(),
      currentRoom,
      hasKeycard: entranceUnlocked,
      entranceUnlocked,
    },
    canContinue: true,
    elapsedTimeMs: 1_000,
    lastSavedAt: "2026-08-12T00:00:00.000Z",
  };
}

function createRoom(
  id: StageOneRoomId,
  requiresEntrance = false,
): StageOneRoomModule {
  return {
    id,
    displayName: id,
    getObjective: () => "테스트 목표",
    getAccess: requiresEntrance
      ? (state) => ({ allowed: state.entranceUnlocked })
      : undefined,
    mount: () => undefined,
  };
}

const rooms = [
  createRoom("outside"),
  createRoom("hallway", true),
] satisfies readonly StageOneRoomModule[];

test("Stage 1 시작 위치는 저장된 진행과 관계없이 연구소 외부다", () => {
  assert.equal(getStageOneLaunchRoomId(), "outside");
});

test("최초 입장 정책이 지정한 연구소 외부에서 시작한다", () => {
  const savedProgress = createProgress("hallway", true);
  const normalized = normalizeStageOneInitialProgress(
    savedProgress,
    rooms,
    "outside",
  );

  assert.equal(normalized.state.currentRoom, "outside");
  assert.equal(savedProgress.state.currentRoom, "hallway");
});

test("이어하기 위치가 접근 가능하면 저장된 방을 복원한다", () => {
  const savedProgress = createProgress("hallway", true);

  assert.equal(
    normalizeStageOneInitialProgress(savedProgress, rooms).state.currentRoom,
    "hallway",
  );
});

test("저장된 방의 진입 조건이 깨졌으면 연구소 외부로 복구한다", () => {
  const inconsistentProgress = createProgress("hallway");

  assert.equal(
    normalizeStageOneInitialProgress(inconsistentProgress, rooms).state
      .currentRoom,
    "outside",
  );
});

test("연구소 외부 Room 누락을 조용히 무시하지 않는다", () => {
  assert.throws(
    () =>
      normalizeStageOneInitialProgress(createProgress("hallway", true), [
        createRoom("hallway"),
      ]),
    /연구소 외부/,
  );
});
