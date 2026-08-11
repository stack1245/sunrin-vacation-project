import type {
  StageOneProgressResult,
  StageOneRoomId,
} from "../../../types/stage-one.ts";
import type { StageOneRoomModule } from "../contracts/room.ts";

const SAFE_FALLBACK_ROOM_ID: StageOneRoomId = "outside";

function canEnterRoom(
  room: StageOneRoomModule,
  progress: StageOneProgressResult,
): boolean {
  return room.getAccess?.(progress.state).allowed ?? true;
}

export function normalizeStageOneInitialProgress(
  progress: StageOneProgressResult,
  rooms: readonly StageOneRoomModule[],
  preferredRoomId: StageOneRoomId = progress.state.currentRoom,
): StageOneProgressResult {
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const outsideRoom = roomById.get(SAFE_FALLBACK_ROOM_ID);

  if (!outsideRoom) {
    throw new Error("Stage 1 시작 구역인 연구소 외부가 등록되지 않았습니다.");
  }

  const preferredRoom = roomById.get(preferredRoomId);
  const initialRoomId =
    preferredRoom && canEnterRoom(preferredRoom, progress)
      ? preferredRoom.id
      : SAFE_FALLBACK_ROOM_ID;

  if (initialRoomId === progress.state.currentRoom) {
    return progress;
  }

  return {
    ...progress,
    state: {
      ...progress.state,
      currentRoom: initialRoomId,
    },
  };
}
