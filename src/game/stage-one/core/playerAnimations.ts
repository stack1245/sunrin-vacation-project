export type StageOnePlayerAnimation =
  | "idle"
  | "walk"
  | "jump"
  | "crouch"
  | "interact";

interface StageOnePlayerAnimationDefinition {
  readonly frameRate: number;
  readonly repeat: number;
  readonly frames: readonly string[];
}

function createFrames(animation: StageOnePlayerAnimation, count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) =>
      `/character/${animation}-${String(index + 1).padStart(2, "0")}.svg`,
  );
}

export const STAGE_ONE_PLAYER_ANIMATIONS: Readonly<
  Record<StageOnePlayerAnimation, StageOnePlayerAnimationDefinition>
> = {
  idle: { frameRate: 6, repeat: -1, frames: createFrames("idle", 4) },
  walk: { frameRate: 11, repeat: -1, frames: createFrames("walk", 4) },
  jump: { frameRate: 9, repeat: 0, frames: createFrames("jump", 3) },
  crouch: { frameRate: 7, repeat: -1, frames: createFrames("crouch", 3) },
  interact: { frameRate: 10, repeat: 0, frames: createFrames("interact", 3) },
};

export function getStageOnePlayerTextureKey(
  animation: StageOnePlayerAnimation,
  frameIndex: number,
): string {
  return `stage-one-player-${animation}-${frameIndex + 1}`;
}

export function getStageOnePlayerAnimationKey(
  animation: StageOnePlayerAnimation,
): string {
  return `stage-one-player-${animation}`;
}
