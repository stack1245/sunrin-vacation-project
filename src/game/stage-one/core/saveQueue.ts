import type {
  StageOneProgressBridge,
  StageOneSaveState,
} from "../../../types/stage-one.ts";
import type { StageOneSaveStatus } from "../contracts/events.ts";

export const STAGE_ONE_SAVE_RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const;

interface StageOneSaveJob {
  state: StageOneSaveState;
  elapsedTimeMs: number;
}

export interface StageOneSaveQueueOptions {
  retryDelaysMs?: readonly number[];
  sleep?: (delayMs: number) => Promise<void>;
  onStatusChange?: (status: StageOneSaveStatus) => void;
}

function defaultSleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "진행 상태를 저장하지 못했습니다.";
}

export class StageOneSaveQueue {
  private readonly bridge: Pick<StageOneProgressBridge, "save">;
  private readonly retryDelaysMs: readonly number[];
  private readonly sleep: (delayMs: number) => Promise<void>;
  private readonly onStatusChange?: (status: StageOneSaveStatus) => void;
  private tail: Promise<void> = Promise.resolve();
  private lastFailedJob: StageOneSaveJob | null = null;
  private disposed = false;

  constructor(
    bridge: Pick<StageOneProgressBridge, "save">,
    options: StageOneSaveQueueOptions = {},
  ) {
    this.bridge = bridge;
    this.retryDelaysMs =
      options.retryDelaysMs ?? STAGE_ONE_SAVE_RETRY_DELAYS_MS;
    this.sleep = options.sleep ?? defaultSleep;
    this.onStatusChange = options.onStatusChange;
  }

  enqueue(state: StageOneSaveState, elapsedTimeMs: number): Promise<void> {
    this.assertActive();

    const job: StageOneSaveJob = {
      state: { ...state },
      elapsedTimeMs,
    };
    const result = this.tail.then(() => this.execute(job));

    this.tail = result.catch(() => undefined);

    return result;
  }

  async retryFailed(): Promise<boolean> {
    this.assertActive();

    if (!this.lastFailedJob) {
      return false;
    }

    const { state, elapsedTimeMs } = this.lastFailedJob;
    await this.enqueue(state, elapsedTimeMs);
    return true;
  }

  async drain(): Promise<void> {
    await this.tail;
  }

  dispose(): void {
    this.disposed = true;
  }

  private async execute(job: StageOneSaveJob): Promise<void> {
    const maxAttempts = this.retryDelaysMs.length + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (attempt === 1) {
        this.publishStatus({
          phase: "saving",
          attempt,
          maxAttempts,
          message: "진행 상황을 저장하고 있습니다.",
        });
      } else {
        const retryDelayMs = this.retryDelaysMs[attempt - 2];

        this.publishStatus({
          phase: "retrying",
          attempt,
          maxAttempts,
          message: `${retryDelayMs / 1_000}초 후 저장을 다시 시도합니다.`,
        });
        await this.sleep(retryDelayMs);
      }

      try {
        await this.bridge.save(job.state, job.elapsedTimeMs);
        this.lastFailedJob = null;
        this.publishStatus({
          phase: "saved",
          attempt,
          maxAttempts,
          message: "진행 상황이 저장되었습니다.",
        });
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          this.lastFailedJob = {
            state: { ...job.state },
            elapsedTimeMs: job.elapsedTimeMs,
          };
          this.publishStatus({
            phase: "failed",
            attempt,
            maxAttempts,
            message: getErrorMessage(error),
          });
          throw error;
        }
      }
    }
  }

  private publishStatus(status: StageOneSaveStatus): void {
    if (!this.disposed) {
      this.onStatusChange?.(status);
    }
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error("종료된 Stage 1 저장 큐는 사용할 수 없습니다.");
    }
  }
}
