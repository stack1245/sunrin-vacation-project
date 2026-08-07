export const STAGE_ONE_WALK_SPEED = 175;
export const STAGE_ONE_SPRINT_SPEED = 245;

export interface StageOneMovementInput {
  horizontal: number;
  vertical: number;
  sprinting: boolean;
}

export interface StageOneVelocity {
  x: number;
  y: number;
}

export function calculateStageOneVelocity({
  horizontal,
  vertical,
  sprinting,
}: StageOneMovementInput): StageOneVelocity {
  const horizontalDirection = Math.sign(horizontal);
  const verticalDirection = Math.sign(vertical);

  if (horizontalDirection === 0 && verticalDirection === 0) {
    return { x: 0, y: 0 };
  }

  const speed = sprinting ? STAGE_ONE_SPRINT_SPEED : STAGE_ONE_WALK_SPEED;
  const length = Math.hypot(horizontalDirection, verticalDirection);

  return {
    x: (horizontalDirection / length) * speed,
    y: (verticalDirection / length) * speed,
  };
}
