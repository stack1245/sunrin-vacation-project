import Phaser from "phaser";

import type {
  StageOneProgressBridge,
  StageOneProgressResult,
} from "@/types/stage-one";
import type {
  StageOneGameEventMap,
  StageOneGameEvents,
} from "../contracts/events";
import type { StageOneRoomModule } from "../contracts/room";
import {
  StageOneScene,
  STAGE_ONE_SCENE_KEY,
} from "./StageOneScene";
import {
  STAGE_ONE_WORLD_HEIGHT,
  STAGE_ONE_WORLD_WIDTH,
} from "./referenceRooms";
import { createStageOneRooms } from "./createStageOneRooms";
import { StageOneSession } from "./stageOneSession";

export interface CreateStageOneGameOptions {
  parent: HTMLElement;
  initialProgress: StageOneProgressResult;
  bridge: StageOneProgressBridge;
  events: StageOneGameEvents<StageOneGameEventMap>;
  rooms?: readonly StageOneRoomModule[];
}

export interface StageOneGameHandle {
  destroy(): void;
  pause(): void;
  resume(): void;
  retrySave(): Promise<void>;
  refreshSize(): void;
}

export function createStageOneGame({
  parent,
  initialProgress,
  bridge,
  events,
  rooms = createStageOneRooms(),
}: CreateStageOneGameOptions): StageOneGameHandle {
  if (typeof window === "undefined") {
    throw new Error("Stage 1 Phaser 게임은 브라우저에서만 시작할 수 있습니다.");
  }

  const session = new StageOneSession(bridge, initialProgress, {
    onStatusChange: (status) => {
      events.emit("save-status", status);
    },
  });
  const scene = new StageOneScene({ session, events, rooms });
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: STAGE_ONE_WORLD_WIDTH,
    height: STAGE_ONE_WORLD_HEIGHT,
    backgroundColor: "#050b10",
    pixelArt: true,
    roundPixels: true,
    autoFocus: true,
    canvasStyle:
      "display:block;width:100%;height:100%;image-rendering:pixelated;outline:none;",
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
        gravity: { x: 0, y: 1400 },
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: STAGE_ONE_WORLD_WIDTH,
      height: STAGE_ONE_WORLD_HEIGHT,
    },
    scene,
  });
  let destroyed = false;

  const getScene = (): StageOneScene | null => {
    if (destroyed) {
      return null;
    }

    const activeScene = game.scene.getScene(STAGE_ONE_SCENE_KEY);
    return activeScene instanceof StageOneScene ? activeScene : null;
  };

  return {
    destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;
      session.dispose();
      game.destroy(true);
    },
    pause() {
      getScene()?.setPaused(true);
    },
    resume() {
      getScene()?.setPaused(false);
    },
    async retrySave() {
      const activeScene = getScene();

      if (activeScene) {
        await activeScene.retryFailedSave();
      }
    },
    refreshSize() {
      if (!destroyed) {
        game.scale.refresh();
      }
    },
  };
}
