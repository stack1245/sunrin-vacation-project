/**
 * E 파트 · 보안 통제실 배치 상수
 *
 * 좌표는 A의 공통 월드(960×540) 기준이다. 벽·상호작용·출입구 위치를 한곳에 모아
 * 맵 조정이 씬 코드 수정으로 번지지 않게 한다.
 */

/** 공통 월드 크기. A의 `referenceRooms.ts` 와 같은 값을 유지한다. */
export const CONTROL_ROOM_WORLD_WIDTH = 960;
export const CONTROL_ROOM_WORLD_HEIGHT = 540;

/** 외벽 두께. */
export const CONTROL_ROOM_WALL_THICKNESS = 32;

/** 중앙 보안 단말 위치. 메인 퍼즐 상호작용 지점이다. */
export const CONTROL_ROOM_TERMINAL_POSITION = { x: 560, y: 300 } as const;

/** 봉쇄 제어 패널 위치. 해제 상태 확인과 2단계 재시도 지점이다. */
export const CONTROL_ROOM_LOCKDOWN_PANEL_POSITION = { x: 800, y: 190 } as const;

/** 보안 수칙 안내판 위치. 보조 힌트 지점이다. */
export const CONTROL_ROOM_NOTICE_POSITION = { x: 300, y: 170 } as const;

/** 중앙 복도로 나가는 출입구 위치. A의 참조 맵과 같은 좌표를 쓴다. */
export const CONTROL_ROOM_EXIT_POSITION = { x: 110, y: 270 } as const;

/** 중앙 복도에서 들어왔을 때의 등장 위치. */
export const CONTROL_ROOM_SPAWN_FROM_HALLWAY = { x: 210, y: 330 } as const;

/** 방향 정보가 없을 때의 기본 등장 위치. */
export const CONTROL_ROOM_DEFAULT_SPAWN = { x: 420, y: 380 } as const;

/** 색상 팔레트. 어두운 연구소 픽셀 톤과 라일락 포인트를 따른다. */
export const CONTROL_ROOM_COLORS = {
  floor: 0x050b10,
  grid: 0x223341,
  wall: 0x0b1823,
  serverRack: 0x17242c,
  serverLight: 0x5dbd8b,
  monitorFrame: 0x344854,
  monitorScreen: 0x071218,
  terminal: 0x315447,
  terminalScreen: 0x0c2529,
  panelLocked: 0x6d3e3b,
  panelReleased: 0x315447,
  notice: 0x29404a,
} as const;

/** 서버 랙 배치. 장식이자 충돌 벽이다. */
export const CONTROL_ROOM_SERVER_RACKS: readonly {
  x: number;
  y: number;
  width: number;
  height: number;
}[] = [
  { x: 470, y: 118, width: 84, height: 96 },
  { x: 570, y: 118, width: 84, height: 96 },
  { x: 670, y: 118, width: 84, height: 96 },
];

/** 하단 케이블 트레이. 이동 경로를 정리하는 낮은 장애물이다. */
export const CONTROL_ROOM_CABLE_TRAY = {
  x: 620,
  y: 452,
  width: 420,
  height: 28,
} as const;
