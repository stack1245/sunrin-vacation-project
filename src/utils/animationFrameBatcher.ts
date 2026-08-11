type RequestAnimationFrame = (callback: FrameRequestCallback) => number;
type CancelAnimationFrame = (animationFrameId: number) => void;

export interface AnimationFrameBatcher {
  schedule(task: () => void): void;
  cancel(): void;
}

/** 같은 렌더링 프레임에 들어온 반복 작업을 마지막 요청 하나로 합친다. */
export function createAnimationFrameBatcher(
  requestAnimationFrame: RequestAnimationFrame,
  cancelAnimationFrame: CancelAnimationFrame,
): AnimationFrameBatcher {
  let animationFrameId: number | null = null;
  let pendingTask: (() => void) | null = null;

  return {
    schedule(task) {
      pendingTask = task;

      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null;
        const taskToRun = pendingTask;
        pendingTask = null;
        taskToRun?.();
      });
    },
    cancel() {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = null;
      pendingTask = null;
    },
  };
}
