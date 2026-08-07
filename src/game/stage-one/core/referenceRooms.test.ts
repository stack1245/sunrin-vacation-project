import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultStageOneSaveState,
  STAGE_ONE_ROOM_IDS,
} from "../../../types/stage-one.ts";
import { createStageOneReferenceRooms } from "./referenceRooms.ts";

test("모든 Stage 1 Room ID에 공통 연결 모듈을 제공한다", () => {
  const roomIds = createStageOneReferenceRooms().map((room) => room.id);

  assert.deepEqual(roomIds, [...STAGE_ONE_ROOM_IDS]);
  assert.equal(new Set(roomIds).size, STAGE_ONE_ROOM_IDS.length);
});

test("입구와 내부 구역은 입구 해금 상태를 확인한다", () => {
  const rooms = new Map(
    createStageOneReferenceRooms().map((room) => [room.id, room]),
  );
  const lockedState = createDefaultStageOneSaveState();
  const unlockedState = {
    ...lockedState,
    hasKeycard: true,
    entranceUnlocked: true,
  };

  assert.equal(rooms.get("entrance")?.getAccess?.(lockedState).allowed, false);
  assert.equal(rooms.get("hallway")?.getAccess?.(unlockedState).allowed, true);
});

test("문서 보관실은 전용 해금 플래그가 있어야 진입할 수 있다", () => {
  const documentStorage = createStageOneReferenceRooms().find(
    (room) => room.id === "document-storage",
  );
  const lockedState = createDefaultStageOneSaveState();
  const unlockedState = {
    ...lockedState,
    hasKeycard: true,
    entranceUnlocked: true,
    archiveClueFound: true,
    scienceLabPuzzleSolved: true,
    controlRoomSolved: true,
    documentStorageUnlocked: true,
  };

  assert.equal(documentStorage?.getAccess?.(lockedState).allowed, false);
  assert.equal(documentStorage?.getAccess?.(unlockedState).allowed, true);
});
