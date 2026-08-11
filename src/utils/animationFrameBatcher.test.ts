import assert from "node:assert/strict";
import test from "node:test";

import { createAnimationFrameBatcher } from "./animationFrameBatcher.ts";

test("같은 프레임의 반복 요청은 마지막 작업 한 번만 실행한다", () => {
  let frameCallback: FrameRequestCallback | null = null;
  const calls: string[] = [];
  const batcher = createAnimationFrameBatcher(
    (callback) => {
      frameCallback = callback;
      return 7;
    },
    () => undefined,
  );

  batcher.schedule(() => calls.push("첫 번째"));
  batcher.schedule(() => calls.push("두 번째"));

  assert.deepEqual(calls, []);
  assert.ok(frameCallback);
  (frameCallback as FrameRequestCallback)(0);
  assert.deepEqual(calls, ["두 번째"]);
});

test("취소하면 예약된 프레임과 작업을 모두 폐기한다", () => {
  let frameCallback: FrameRequestCallback | null = null;
  const cancelledFrameIds: number[] = [];
  let executed = false;
  const batcher = createAnimationFrameBatcher(
    (callback) => {
      frameCallback = callback;
      return 11;
    },
    (animationFrameId) => cancelledFrameIds.push(animationFrameId),
  );

  batcher.schedule(() => {
    executed = true;
  });
  batcher.cancel();

  assert.deepEqual(cancelledFrameIds, [11]);
  assert.ok(frameCallback);
  (frameCallback as FrameRequestCallback)(0);
  assert.equal(executed, false);
});
