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
      sprinting: false,
    }),
    { x: 0, y: 0 },
  );
});

test("횡스크롤 이동은 수평 속도만 만든다", () => {
  const velocity = calculateStageOneVelocity({
    horizontal: 1,
    sprinting: false,
  });

  assert.deepEqual(velocity, { x: STAGE_ONE_WALK_SPEED, y: 0 });
});

test("Shift 입력 중 달리기 속도를 사용한다", () => {
  const velocity = calculateStageOneVelocity({
    horizontal: -1,
    sprinting: true,
  });

  assert.deepEqual(velocity, { x: -STAGE_ONE_SPRINT_SPEED, y: 0 });
});
