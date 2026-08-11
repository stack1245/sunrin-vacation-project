import type { StageOneSaveState } from "@/types/stage-one";
import type {
  StageOneInteractionDefinition,
  StageOnePoint,
} from "../contracts/room";

const DEFAULT_INTERACTION_RADIUS = 72;
const MARKER_HORIZONTAL_MARGIN = 145;
const MARKER_MIN_Y = 80;
const MARKER_MAX_Y = 460;
const MARKER_Y_OFFSET = 86;
const STAGE_ONE_WORLD_WIDTH = 960;

export function resolveInteractionPrompt(
  interaction: StageOneInteractionDefinition,
  state: StageOneSaveState,
): string {
  return typeof interaction.prompt === "function"
    ? interaction.prompt(state)
    : interaction.prompt;
}

export function getInteractionActionLabel(prompt: string): string {
  const label = prompt.replace(/^E\s*[·:—-]\s*/u, "").trim();
  return label || "상호작용";
}

export function selectNearestInteraction(
  interactions: readonly StageOneInteractionDefinition[],
  state: StageOneSaveState,
  playerX: number,
  playerY?: number,
): StageOneInteractionDefinition | null {
  let nearest: StageOneInteractionDefinition | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const interaction of interactions) {
    if (interaction.enabled && !interaction.enabled(state)) {
      continue;
    }

    const horizontalDistance = playerX - interaction.position.x;
    const distance =
      playerY === undefined
        ? Math.abs(horizontalDistance)
        : Math.hypot(horizontalDistance, playerY - interaction.position.y);

    if (
      distance <= (interaction.radius ?? DEFAULT_INTERACTION_RADIUS) &&
      distance < nearestDistance
    ) {
      nearest = interaction;
      nearestDistance = distance;
    }
  }

  return nearest;
}

export function getInteractionMarkerPosition(
  interaction: StageOneInteractionDefinition,
): StageOnePoint {
  return {
    x: Math.max(
      MARKER_HORIZONTAL_MARGIN,
      Math.min(
        STAGE_ONE_WORLD_WIDTH - MARKER_HORIZONTAL_MARGIN,
        interaction.position.x,
      ),
    ),
    y: Math.max(
      MARKER_MIN_Y,
      Math.min(MARKER_MAX_Y, interaction.position.y - MARKER_Y_OFFSET),
    ),
  };
}
