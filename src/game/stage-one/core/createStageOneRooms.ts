import type { StageOneRoomModule } from "../contracts/room";
import { createDocumentStorageRoom } from "../rooms/document-storage/index.ts";
import { createStageOneReferenceRooms } from "./referenceRooms.ts";

/** 실제 Room 구현을 공통 레퍼런스 Room과 교체하는 조립 지점이다. */
export function createStageOneRooms(): readonly StageOneRoomModule[] {
  const documentStorageRoom = createDocumentStorageRoom();
  const implementedRooms = new Map<
    StageOneRoomModule["id"],
    StageOneRoomModule
  >([[documentStorageRoom.id, documentStorageRoom]]);

  return createStageOneReferenceRooms().map(
    (room) => implementedRooms.get(room.id) ?? room,
  );
}
