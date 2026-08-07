import {
  validateStageOneSaveState,
  type StageOneCompleteResult,
  type StageOneProgressBridge,
  type StageOneProgressResult,
  type StageOneRoomId,
  type StageOneSaveState,
} from "../../../types/stage-one.ts";
import type { StageOneProgressPatch } from "../contracts/room.ts";
import {
  StageOneSaveQueue,
  type StageOneSaveQueueOptions,
} from "./saveQueue.ts";

const MONOTONIC_FLAGS = [
  "hasKeycard",
  "entranceUnlocked",
  "archiveClueFound",
  "scienceLabPuzzleSolved",
  "controlRoomSolved",
  "documentStorageUnlocked",
  "confidentialDocumentObtained",
  "escaped",
] as const satisfies readonly (keyof StageOneSaveState)[];

export interface StageOneSessionSnapshot {
  state: StageOneSaveState;
  elapsedTimeMs: number;
  paused: boolean;
}

export interface StageOneSessionOptions
  extends Pick<
    StageOneSaveQueueOptions,
    "retryDelaysMs" | "sleep" | "onStatusChange"
  > {
  now?: () => number;
  onStateChange?: (snapshot: StageOneSessionSnapshot) => void;
}

function assertNoProgressRegression(
  currentState: StageOneSaveState,
  nextState: StageOneSaveState,
): void {
  for (const flag of MONOTONIC_FLAGS) {
    if (currentState[flag] && !nextState[flag]) {
      throw new Error(`${flag} 진행 상태는 완료 후 되돌릴 수 없습니다.`);
    }
  }
}

export class StageOneSession {
  private readonly bridge: StageOneProgressBridge;
  private state: StageOneSaveState;
  private readonly baseElapsedTimeMs: number;
  private readonly startedAtMs: number;
  private pauseStartedAtMs: number | null = null;
  private pausedDurationMs = 0;
  private disposed = false;
  private readonly now: () => number;
  private readonly onStateChange?: (snapshot: StageOneSessionSnapshot) => void;
  private readonly saveQueue: StageOneSaveQueue;

  constructor(
    bridge: StageOneProgressBridge,
    initialProgress: StageOneProgressResult,
    options: StageOneSessionOptions = {},
  ) {
    this.bridge = bridge;
    this.state = validateStageOneSaveState(initialProgress.state);
    this.baseElapsedTimeMs = initialProgress.elapsedTimeMs;
    this.now = options.now ?? (() => performance.now());
    this.startedAtMs = this.now();
    this.onStateChange = options.onStateChange;
    this.saveQueue = new StageOneSaveQueue(bridge, {
      retryDelaysMs: options.retryDelaysMs,
      sleep: options.sleep,
      onStatusChange: options.onStatusChange,
    });
  }

  getState(): StageOneSaveState {
    return { ...this.state };
  }

  getElapsedTimeMs(): number {
    const now = this.pauseStartedAtMs ?? this.now();
    const activeDurationMs = Math.max(
      0,
      now - this.startedAtMs - this.pausedDurationMs,
    );

    return Math.min(
      Number.MAX_SAFE_INTEGER,
      this.baseElapsedTimeMs + Math.floor(activeDurationMs),
    );
  }

  getSnapshot(): StageOneSessionSnapshot {
    return {
      state: this.getState(),
      elapsedTimeMs: this.getElapsedTimeMs(),
      paused: this.pauseStartedAtMs !== null,
    };
  }

  setPaused(paused: boolean): void {
    this.assertActive();

    if (paused && this.pauseStartedAtMs === null) {
      this.pauseStartedAtMs = this.now();
    } else if (!paused && this.pauseStartedAtMs !== null) {
      this.pausedDurationMs += Math.max(0, this.now() - this.pauseStartedAtMs);
      this.pauseStartedAtMs = null;
    }

    this.publishState();
  }

  async updateProgress(
    patch: StageOneProgressPatch,
  ): Promise<StageOneSaveState> {
    this.assertActive();

    const nextState = validateStageOneSaveState({
      ...this.state,
      ...patch,
    });

    assertNoProgressRegression(this.state, nextState);
    this.state = nextState;
    this.publishState();

    await this.saveQueue.enqueue(nextState, this.getElapsedTimeMs());
    return this.getState();
  }

  transitionTo(roomId: StageOneRoomId): Promise<StageOneSaveState> {
    return this.updateProgress({ currentRoom: roomId });
  }

  async completeEscape(): Promise<StageOneCompleteResult> {
    this.assertActive();

    if (!this.state.confidentialDocumentObtained) {
      throw new Error("기밀 문서를 획득한 뒤 탈출할 수 있습니다.");
    }

    await this.updateProgress({
      currentRoom: "outside",
      escaped: true,
    });

    const result = await this.bridge.complete();
    this.state = validateStageOneSaveState(result.state);
    this.publishState();
    return result;
  }

  retryFailedSave(): Promise<boolean> {
    this.assertActive();
    return this.saveQueue.retryFailed();
  }

  waitForPendingSaves(): Promise<void> {
    return this.saveQueue.drain();
  }

  dispose(): void {
    this.disposed = true;
    this.saveQueue.dispose();
  }

  private publishState(): void {
    if (!this.disposed) {
      this.onStateChange?.(this.getSnapshot());
    }
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error("종료된 Stage 1 세션은 사용할 수 없습니다.");
    }
  }
}
