import type { StageOneRoomModule } from "../contracts/room";
import { controlRoomRoom } from "../rooms/control-room/index.ts";
import { createStageOneReferenceRooms } from "./referenceRooms.ts";

/**
 * 실제 구현이 끝난 Room을 참조 슬롯과 교체해 기본 Stage 1 구성을 만든다.
 * 각 파트가 완료되면 이 composition root에 공개 Room 모듈만 추가한다.
 */
export function createStageOneRooms(): readonly StageOneRoomModule[] {
  const implementedRooms = new Map<
    StageOneRoomModule["id"],
    StageOneRoomModule
  >([[controlRoomRoom.id, controlRoomRoom]]);

  return createStageOneReferenceRooms().map(
    (room) => implementedRooms.get(room.id) ?? room,
  );
}
