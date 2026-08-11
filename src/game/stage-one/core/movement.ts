export const STAGE_ONE_WALK_SPEED = 220;
export const STAGE_ONE_SPRINT_SPEED = 300;
export const STAGE_ONE_JUMP_VELOCITY = 620;

export interface StageOneMovementInput {
  horizontal: number;
  sprinting: boolean;
}

export interface StageOneVelocity {
  x: number;
  y: number;
}

export function calculateStageOneVelocity({
  horizontal,
  sprinting,
}: StageOneMovementInput): StageOneVelocity {
  const horizontalDirection = Math.sign(horizontal);

  if (horizontalDirection === 0) {
    return { x: 0, y: 0 };
  }

  const speed = sprinting ? STAGE_ONE_SPRINT_SPEED : STAGE_ONE_WALK_SPEED;

  return {
    x: horizontalDirection * speed,
    y: 0,
  };
}
