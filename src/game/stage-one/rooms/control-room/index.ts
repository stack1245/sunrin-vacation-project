/**
 * E 파트 · 보안 통제실 Room 공개 진입점
 *
 * A는 `createStageOneGame({ rooms: [...] })` 에 `controlRoomRoom` 을 등록하면 된다.
 * 그 외 내부 파일은 직접 import하지 않는다.
 */

export { CONTROL_ROOM_ID, controlRoomRoom } from "./controlRoomRoom.ts";
export { ControlRoomTerminalSession } from "./terminalSession.ts";
export {
  FakeDevtoolsOverlay,
  type FakeDevtoolsOverlayHandlers,
} from "./fakeDevtoolsOverlay.ts";
export {
  CONTROL_ROOM_COLORS,
  CONTROL_ROOM_DEFAULT_SPAWN,
  CONTROL_ROOM_EXIT_POSITION,
  CONTROL_ROOM_LOCKDOWN_PANEL_POSITION,
  CONTROL_ROOM_NOTICE_POSITION,
  CONTROL_ROOM_SPAWN_FROM_HALLWAY,
  CONTROL_ROOM_TERMINAL_POSITION,
} from "./layout.ts";
