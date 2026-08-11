import type Phaser from "phaser";

import type { StageOneRoomId } from "@/types/stage-one";
import {
  STAGE_ONE_WORLD_HEIGHT,
  STAGE_ONE_WORLD_WIDTH,
} from "./referenceRooms";

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

/** 각 Room의 기존 상호작용 위에 공통 횡스크롤 시설 배경을 그린다. */
export function createSideViewRoomBackdrop(
  scene: Phaser.Scene,
  roomId: StageOneRoomId,
  roomName: string,
): Phaser.GameObjects.GameObject[] {
  const graphics = scene.add.graphics().setDepth(-3);
  const accent = ROOM_ACCENTS[roomId];

  graphics.fillStyle(0x050b10, 1);
  graphics.fillRect(0, 0, STAGE_ONE_WORLD_WIDTH, STAGE_ONE_WORLD_HEIGHT);

  if (roomId === "outside") {
    drawExterior(graphics, accent);
  } else {
    drawInterior(graphics, accent);
  }

  const sectorLabel = scene.add
    .text(STAGE_ONE_WORLD_WIDTH - 42, 42, roomName.toUpperCase(), {
      color: "#6f838f",
      fontFamily: "Cascadia Code, Consolas, monospace",
      fontSize: "11px",
      fontStyle: "bold",
    })
    .setOrigin(1, 0)
    .setDepth(-2);

  return [graphics, sectorLabel];
}

function drawInterior(graphics: Phaser.GameObjects.Graphics, accent: number): void {
  graphics.fillStyle(0x071018, 1);
  graphics.fillRect(0, 46, STAGE_ONE_WORLD_WIDTH, STAGE_ONE_SIDE_VIEW_FLOOR_TOP - 46);

  graphics.fillStyle(0x0b1823, 1);
  for (let x = 28; x < STAGE_ONE_WORLD_WIDTH; x += 232) {
    graphics.fillRect(x, 74, 194, 332);
  }

  graphics.lineStyle(1, 0x223341, 0.9);
  for (let x = 0; x <= STAGE_ONE_WORLD_WIDTH; x += 80) {
    graphics.lineBetween(x, 46, x, STAGE_ONE_SIDE_VIEW_FLOOR_TOP);
  }
  for (let y = 46; y <= STAGE_ONE_SIDE_VIEW_FLOOR_TOP; y += 80) {
    graphics.lineBetween(0, y, STAGE_ONE_WORLD_WIDTH, y);
  }

  graphics.fillStyle(0x0f1c27, 1);
  graphics.fillRect(0, 46, STAGE_ONE_WORLD_WIDTH, 18);
  graphics.fillRect(0, 114, STAGE_ONE_WORLD_WIDTH, 8);

  graphics.lineStyle(3, accent, 0.24);
  graphics.beginPath();
  graphics.moveTo(0, 118);
  graphics.lineTo(144, 118);
  graphics.lineTo(174, 148);
  graphics.lineTo(382, 148);
  graphics.lineTo(414, 118);
  graphics.lineTo(STAGE_ONE_WORLD_WIDTH, 118);
  graphics.strokePath();

  for (let x = 92; x < STAGE_ONE_WORLD_WIDTH; x += 188) {
    graphics.fillStyle(accent, 0.72);
    graphics.fillCircle(x, 91, 3);
    graphics.lineStyle(1, accent, 0.16);
    graphics.strokeCircle(x, 91, 10);
  }

  drawFloor(graphics);
}

function drawExterior(graphics: Phaser.GameObjects.Graphics, accent: number): void {
  graphics.fillStyle(0x071018, 1);
  graphics.fillRect(0, 0, STAGE_ONE_WORLD_WIDTH, STAGE_ONE_SIDE_VIEW_FLOOR_TOP);

  graphics.fillStyle(0x0b1823, 1);
  graphics.fillRect(560, 76, 400, STAGE_ONE_SIDE_VIEW_FLOOR_TOP - 76);
  graphics.lineStyle(2, 0x4a5f6d, 0.8);
  graphics.strokeRect(560, 76, 400, STAGE_ONE_SIDE_VIEW_FLOOR_TOP - 76);

  for (let x = 586; x < 940; x += 84) {
    graphics.fillStyle(0x132635, 1);
    graphics.fillRect(x, 112, 54, 98);
    graphics.lineStyle(1, 0x223341, 1);
    graphics.strokeRect(x, 112, 54, 98);
  }

  graphics.lineStyle(1, accent, 0.28);
  for (let x = 0; x < 560; x += 48) {
    graphics.lineBetween(x, 282, x + 48, STAGE_ONE_SIDE_VIEW_FLOOR_TOP);
  }
  graphics.lineBetween(0, 282, 560, 282);

  graphics.fillStyle(accent, 0.65);
  graphics.fillCircle(834, 110, 4);
  graphics.lineStyle(1, accent, 0.25);
  graphics.strokeCircle(834, 110, 13);

  drawFloor(graphics);
}

function drawFloor(graphics: Phaser.GameObjects.Graphics): void {
  const floorHeight = STAGE_ONE_WORLD_HEIGHT - STAGE_ONE_SIDE_VIEW_FLOOR_TOP;

  graphics.fillStyle(0x071018, 1);
  graphics.fillRect(0, STAGE_ONE_SIDE_VIEW_FLOOR_TOP, STAGE_ONE_WORLD_WIDTH, floorHeight);
  graphics.fillStyle(0x0f1c27, 1);
  graphics.fillRect(0, STAGE_ONE_SIDE_VIEW_FLOOR_TOP + 10, STAGE_ONE_WORLD_WIDTH, 24);

  graphics.lineStyle(2, 0x4a5f6d, 0.78);
  graphics.lineBetween(
    0,
    STAGE_ONE_SIDE_VIEW_FLOOR_TOP,
    STAGE_ONE_WORLD_WIDTH,
    STAGE_ONE_SIDE_VIEW_FLOOR_TOP,
  );

  graphics.lineStyle(1, 0x223341, 0.72);
  for (let x = 0; x <= STAGE_ONE_WORLD_WIDTH; x += 96) {
    graphics.lineBetween(
      x,
      STAGE_ONE_SIDE_VIEW_FLOOR_TOP,
      x - 34,
      STAGE_ONE_WORLD_HEIGHT,
    );
  }
  for (let y = STAGE_ONE_SIDE_VIEW_FLOOR_TOP + 34; y <= STAGE_ONE_WORLD_HEIGHT; y += 28) {
    graphics.lineBetween(0, y, STAGE_ONE_WORLD_WIDTH, y);
  }
}
