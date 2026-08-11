import assert from "node:assert/strict";
import test from "node:test";

import {
  getStageOnePlayerTextureKey,
  STAGE_ONE_PLAYER_ANIMATIONS,
} from "./playerAnimations.ts";

test("제공된 SVG 캐릭터 17프레임을 상태별로 등록한다", () => {
  const frames = Object.values(STAGE_ONE_PLAYER_ANIMATIONS).flatMap(
    (animation) => animation.frames,
  );

  assert.equal(frames.length, 17);
  assert.equal(new Set(frames).size, 17);
  assert.ok(frames.every((frame) => frame.endsWith(".svg")));
});

test("Phaser 텍스처 키가 상태와 프레임을 구분한다", () => {
  assert.equal(getStageOnePlayerTextureKey("walk", 0), "stage-one-player-walk-1");
  assert.equal(getStageOnePlayerTextureKey("interact", 2), "stage-one-player-interact-3");
});
