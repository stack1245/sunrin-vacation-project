import type { StageOneRoomModule } from "../contracts/room";
import { createArchiveRoom } from "../rooms/archive/index.ts";
import { controlRoomRoom } from "../rooms/control-room/index.ts";
import { createDocumentStorageRoom } from "../rooms/document-storage/index.ts";
import { entranceRoom } from "../rooms/entrance/entranceRoom.ts";
import { hallwayRoom } from "../rooms/hallway/hallwayRoom.ts";
import { outsideRoom } from "../rooms/outside/outsideRoom.ts";
import { createScienceLabRoom } from "../rooms/science-lab/index.ts";
import { createStageOneReferenceRooms } from "./referenceRooms.ts";

/**
 * 실제 구현이 끝난 Room을 참조 슬롯과 교체해 기본 Stage 1 구성을 만든다.
 * 각 파트가 완료되면 이 composition root에 공개 Room 모듈만 추가한다.
 */
export function createStageOneRooms(): readonly StageOneRoomModule[] {
  const archiveRoom = createArchiveRoom();
  const documentStorageRoom = createDocumentStorageRoom();
  const scienceLabRoom = createScienceLabRoom();
  const implementedRooms = new Map<
    StageOneRoomModule["id"],
    StageOneRoomModule
  >([
    [outsideRoom.id, outsideRoom],
    [entranceRoom.id, entranceRoom],
    [hallwayRoom.id, hallwayRoom],
    [archiveRoom.id, archiveRoom],
    [scienceLabRoom.id, scienceLabRoom],
    [controlRoomRoom.id, controlRoomRoom],
    [documentStorageRoom.id, documentStorageRoom],
  ]);

  return createStageOneReferenceRooms().map(
    (room) => implementedRooms.get(room.id) ?? room,
  );
}
