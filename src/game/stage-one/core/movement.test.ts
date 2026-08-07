import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateStageOneVelocity,
  STAGE_ONE_SPRINT_SPEED,
  STAGE_ONE_WALK_SPEED,
} from "./movement.ts";

test("입력이 없으면 플레이어를 정지한다", () => {
  assert.deepEqual(
    calculateStageOneVelocity({
      horizontal: 0,
      vertical: 0,
      sprinting: false,
    }),
    { x: 0, y: 0 },
  );
});

test("대각선 이동 속도를 정규화한다", () => {
  const velocity = calculateStageOneVelocity({
    horizontal: 1,
    vertical: 1,
    sprinting: false,
  });

  assert.ok(Math.abs(Math.hypot(velocity.x, velocity.y) - STAGE_ONE_WALK_SPEED) < 0.001);
});

test("Space 입력 중 달리기 속도를 사용한다", () => {
  const velocity = calculateStageOneVelocity({
    horizontal: -1,
    vertical: 0,
    sprinting: true,
  });

  assert.deepEqual(velocity, { x: -STAGE_ONE_SPRINT_SPEED, y: 0 });
});
