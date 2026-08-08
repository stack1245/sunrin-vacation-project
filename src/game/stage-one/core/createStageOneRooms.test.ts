import assert from "node:assert/strict";
import test from "node:test";

import { controlRoomRoom } from "../rooms/control-room/index.ts";
import { createStageOneRooms } from "./createStageOneRooms.ts";

test("기본 Room 구성에서 보안 통제실 참조 슬롯을 실제 구현으로 교체한다", () => {
  const rooms = createStageOneRooms();
  const controlRoom = rooms.find((room) => room.id === "control-room");

  assert.equal(controlRoom, controlRoomRoom);
});

test("기본 Room 구성은 모든 Stage 1 Room ID를 중복 없이 유지한다", () => {
  const rooms = createStageOneRooms();
  const roomIds = rooms.map((room) => room.id);

  assert.equal(rooms.length, 7);
  assert.equal(new Set(roomIds).size, 7);
  assert.deepEqual(roomIds, [
    "outside",
    "entrance",
    "hallway",
    "archive",
    "science-lab",
    "control-room",
    "document-storage",
  ]);
});
