import assert from "node:assert/strict";
import test from "node:test";

import { DocumentStorageRoomModule } from "../rooms/document-storage/index.ts";
import { createStageOneRooms } from "./createStageOneRooms.ts";

test("문서 보관실 레퍼런스 Room을 F 파트 실제 구현으로 교체한다", () => {
  const documentStorageRoom = createStageOneRooms().find(
    (room) => room.id === "document-storage",
  );

  assert.ok(documentStorageRoom instanceof DocumentStorageRoomModule);
});
