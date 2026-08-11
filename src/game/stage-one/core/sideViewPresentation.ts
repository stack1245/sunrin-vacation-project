import type Phaser from "phaser";

import type { StageOneRoomId } from "@/types/stage-one";
import { STAGE_ONE_WORLD_WIDTH } from "./referenceRooms";
import { getStageOneBackdropTextureKey } from "./environmentAssets";

export const STAGE_ONE_SIDE_VIEW_FLOOR_TOP = 448;
export const STAGE_ONE_SIDE_VIEW_PLAYER_Y = 418;
export const STAGE_ONE_SIDE_VIEW_PORTAL_Y = 374;

const ROOM_ACCENTS: Readonly<Record<StageOneRoomId, number>> = {
  outside: 0x8fa1aa,
  entrance: 0xb7d8c1,
  hallway: 0x6f838f,
  archive: 0xf0cf72,
  "science-lab": 0x5dbd8b,
  "control-room": 0xe0a08f,
  "document-storage": 0xb7d8c1,
};

/** 각 Room의 기존 상호작용 위에 공통 횡스크롤 시설 배경을 배치한다. */
export function createSideViewRoomBackdrop(
  scene: Phaser.Scene,
  roomId: StageOneRoomId,
  roomName: string,
): Phaser.GameObjects.GameObject[] {
  const backdrop = scene.add
    .image(0, 0, getStageOneBackdropTextureKey(roomId))
    .setOrigin(0)
    .setDepth(-4);
  const graphics = scene.add.graphics().setDepth(-3);
  const accent = ROOM_ACCENTS[roomId];

  drawRoomAccent(graphics, accent, roomId === "outside");

  const sectorLabel = scene.add
    .text(STAGE_ONE_WORLD_WIDTH - 42, 42, roomName.toUpperCase(), {
      color: "#6f838f",
      fontFamily: "Cascadia Code, Consolas, monospace",
      fontSize: "11px",
      fontStyle: "bold",
    })
    .setOrigin(1, 0)
    .setDepth(-2);

  return [backdrop, graphics, sectorLabel];
}

function drawRoomAccent(
  graphics: Phaser.GameObjects.Graphics,
  accent: number,
  exterior: boolean,
): void {
  const lineY = exterior ? 284 : 118;

  graphics.lineStyle(3, accent, 0.24);
  graphics.lineBetween(0, lineY, STAGE_ONE_WORLD_WIDTH, lineY);

  for (let x = exterior ? 48 : 92; x < STAGE_ONE_WORLD_WIDTH; x += 188) {
    graphics.fillStyle(accent, 0.72);
    graphics.fillCircle(x, exterior ? 282 : 91, 3);
  }
}
