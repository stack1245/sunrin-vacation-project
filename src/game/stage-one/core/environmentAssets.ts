import type Phaser from "phaser";

import type { StageOneRoomId } from "@/types/stage-one";

interface StageOneEnvironmentAssetDefinition {
  readonly key: string;
  readonly path: string;
  readonly width: number;
  readonly height: number;
}

export const STAGE_ONE_ENVIRONMENT_ASSETS = {
  exteriorBackdrop: {
    key: "stage-one-environment-exterior-backdrop",
    path: "/assets/stage-1/environment/exterior-backdrop.svg",
    width: 960,
    height: 540,
  },
  interiorBackdrop: {
    key: "stage-one-environment-interior-backdrop",
    path: "/assets/stage-1/environment/interior-backdrop.svg",
    width: 960,
    height: 540,
  },
  securityDoor: {
    key: "stage-one-environment-security-door",
    path: "/assets/stage-1/environment/security-door.svg",
    width: 96,
    height: 160,
  },
  securityTerminal: {
    key: "stage-one-environment-security-terminal",
    path: "/assets/stage-1/environment/security-terminal.svg",
    width: 96,
    height: 96,
  },
  labConsole: {
    key: "stage-one-environment-lab-console",
    path: "/assets/stage-1/environment/lab-console.svg",
    width: 124,
    height: 104,
  },
  archiveCabinet: {
    key: "stage-one-environment-archive-cabinet",
    path: "/assets/stage-1/environment/archive-cabinet.svg",
    width: 190,
    height: 170,
  },
} as const satisfies Readonly<
  Record<string, StageOneEnvironmentAssetDefinition>
>;

export function preloadStageOneEnvironmentAssets(scene: Phaser.Scene): void {
  for (const asset of Object.values(STAGE_ONE_ENVIRONMENT_ASSETS)) {
    if (scene.textures.exists(asset.key)) {
      continue;
    }

    scene.load.svg(asset.key, asset.path, {
      width: asset.width,
      height: asset.height,
    });
  }
}

export function getStageOneBackdropTextureKey(
  roomId: StageOneRoomId,
): string {
  return roomId === "outside"
    ? STAGE_ONE_ENVIRONMENT_ASSETS.exteriorBackdrop.key
    : STAGE_ONE_ENVIRONMENT_ASSETS.interiorBackdrop.key;
}
