import type Phaser from "phaser";

import type {
  StageOneRoomId,
  StageOneSaveState,
} from "@/types/stage-one";

export interface StageOnePoint {
  x: number;
  y: number;
}

export interface StageOneRectangle extends StageOnePoint {
  width: number;
  height: number;
}

export interface StageOneRoomAccess {
  allowed: boolean;
  reason?: string;
}

export interface StageOneProgressPatch {
  currentRoom?: StageOneRoomId;
  hasKeycard?: boolean;
  entranceUnlocked?: boolean;
  archiveClueFound?: boolean;
  scienceLabPuzzleSolved?: boolean;
  controlRoomSolved?: boolean;
  documentStorageUnlocked?: boolean;
  confidentialDocumentObtained?: boolean;
  escaped?: boolean;
}

/** 모달 입력 잠금을 해제한다. 여러 번 호출해도 첫 호출만 반영되어야 한다. */
export type StageOneModalInputRelease = () => void;

export interface StageOneInteractionContext {
  getState(): StageOneSaveState;
  updateProgress(
    patch: StageOneProgressPatch,
    successMessage?: string,
  ): Promise<StageOneSaveState>;
  transitionTo(roomId: StageOneRoomId): Promise<void>;
  completeEscape(): Promise<void>;
  acquireModalInputLock(): StageOneModalInputRelease;
  showMessage(text: string, tone?: "info" | "success" | "warning" | "error"): void;
}

export interface StageOneInteractionDefinition {
  id: string;
  position: StageOnePoint;
  radius?: number;
  prompt: string | ((state: StageOneSaveState) => string);
  enabled?: (state: StageOneSaveState) => boolean;
  onInteract(context: StageOneInteractionContext): void | Promise<void>;
}

export interface StageOnePortalDefinition {
  id: string;
  targetRoomId: StageOneRoomId;
  position: StageOnePoint;
  prompt?: string;
}

export interface StageOneRoomMountContext {
  scene: Phaser.Scene;
  getState(): StageOneSaveState;
  addWall(bounds: StageOneRectangle, color?: number): void;
  addInteraction(definition: StageOneInteractionDefinition): void;
  addPortal(definition: StageOnePortalDefinition): void;
  track(gameObject: Phaser.GameObjects.GameObject): void;
}

export interface StageOneRoomModule {
  id: StageOneRoomId;
  displayName: string;
  getObjective(state: StageOneSaveState): string;
  getAccess?(state: StageOneSaveState): StageOneRoomAccess;
  getSpawnPoint?(fromRoomId: StageOneRoomId | null): StageOnePoint;
  mount(context: StageOneRoomMountContext): void | (() => void);
}

export type StageOneRoomRegistry = ReadonlyMap<
  StageOneRoomId,
  StageOneRoomModule
>;
