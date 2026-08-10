import assert from "node:assert/strict";
import test from "node:test";

import {
  CONTROL_ROOM_SOLVED_EVENT,
  ControlRoomCompletionFlow,
  DOCUMENT_STORAGE_UNLOCKED_EVENT,
  type ControlRoomCompletionEvent,
} from "./completionFlow.ts";
import {
  createControlRoomReadyState,
  createFakeProgressPort,
} from "./testSupport.ts";

const COMMIT_INPUT = {
  failedAttempts: 1,
  unlockSource: "auto-after-solve",
} as const;

test("정상 완료: 두 이벤트를 순서대로 발행하고 플래그를 2단계로 저장한다", async () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState(),
  });
  const events: ControlRoomCompletionEvent[] = [];
  const flow = new ControlRoomCompletionFlow(port, (event) => {
    events.push(event);
  });

  const result = await flow.commit(COMMIT_INPUT);

  assert.equal(result.outcome, "completed");
  assert.equal(result.state.controlRoomSolved, true);
  assert.equal(result.state.documentStorageUnlocked, true);

  // 저장은 반드시 한 patch 한 플래그, 두 번으로 나뉘어야 한다.
  assert.deepEqual(
    port.updates.map((update) => update.patch),
    [{ controlRoomSolved: true }, { documentStorageUnlocked: true }],
  );

  // 이벤트 순서와 페이로드 계약.
  assert.equal(events.length, 2);
  assert.equal(events[0].event, CONTROL_ROOM_SOLVED_EVENT);
  assert.equal(events[1].event, DOCUMENT_STORAGE_UNLOCKED_EVENT);

  const solved = events[0];
  assert.ok(solved.event === CONTROL_ROOM_SOLVED_EVENT);
  assert.equal(solved.roomId, "control-room");
  assert.equal(solved.source, "otp-verification");
  assert.equal(solved.failedAttempts, 1);
  assert.deepEqual(solved.savedFlags, ["controlRoomSolved"]);

  const unlocked = events[1];
  assert.ok(unlocked.event === DOCUMENT_STORAGE_UNLOCKED_EVENT);
  assert.equal(unlocked.unlockedRoomId, "document-storage");
  assert.equal(unlocked.source, "auto-after-solve");
  assert.deepEqual(unlocked.savedFlags, ["documentStorageUnlocked"]);
});

test("멱등: 이미 완료된 상태에서 재호출하면 저장을 호출하지 않는다", async () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState({
      controlRoomSolved: true,
      documentStorageUnlocked: true,
    }),
  });
  const events: ControlRoomCompletionEvent[] = [];
  const flow = new ControlRoomCompletionFlow(port, (event) => {
    events.push(event);
  });

  const result = await flow.commit(COMMIT_INPUT);

  assert.equal(result.outcome, "already-complete");
  assert.equal(port.updates.length, 0);
  assert.equal(events.length, 0);
});

test("부분 완료 재개: 1단계만 끝난 상태면 2단계만 수행한다", async () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState({ controlRoomSolved: true }),
  });
  const events: ControlRoomCompletionEvent[] = [];
  const flow = new ControlRoomCompletionFlow(port, (event) => {
    events.push(event);
  });

  const result = await flow.commit({
    failedAttempts: 0,
    unlockSource: "console-lockdown-release",
  });

  assert.equal(result.outcome, "resumed");
  assert.deepEqual(
    port.updates.map((update) => update.patch),
    [{ documentStorageUnlocked: true }],
  );
  assert.equal(events.length, 1);
  assert.equal(events[0].event, DOCUMENT_STORAGE_UNLOCKED_EVENT);
  assert.ok(events[0].event === DOCUMENT_STORAGE_UNLOCKED_EVENT);
  assert.equal(events[0].source, "console-lockdown-release");
});

test("선행 조건 미충족: scienceLabPuzzleSolved가 없으면 저장을 시도하지 않는다", async () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState({ scienceLabPuzzleSolved: false }),
  });
  const flow = new ControlRoomCompletionFlow(port);

  const result = await flow.commit(COMMIT_INPUT);

  assert.equal(result.outcome, "blocked");
  assert.equal(port.updates.length, 0);
  assert.equal(result.state.controlRoomSolved, false);
});

test("1단계 저장 예외: 어떤 이벤트도 발행하지 않고 실패를 보고한다", async () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState(),
    failOn: { flag: "controlRoomSolved", mode: "throw" },
  });
  const events: ControlRoomCompletionEvent[] = [];
  const flow = new ControlRoomCompletionFlow(port, (event) => {
    events.push(event);
  });

  const result = await flow.commit(COMMIT_INPUT);

  assert.equal(result.outcome, "failed");
  assert.equal(events.length, 0);
  assert.ok(result.error);
});

test("2단계 저장 예외: controlRoomSolved 이벤트는 유지하고 실패를 보고한다", async () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState(),
    failOn: { flag: "documentStorageUnlocked", mode: "throw" },
  });
  const events: ControlRoomCompletionEvent[] = [];
  const flow = new ControlRoomCompletionFlow(port, (event) => {
    events.push(event);
  });

  const result = await flow.commit(COMMIT_INPUT);

  assert.equal(result.outcome, "failed");
  // 1단계는 성공했으므로 이벤트가 남고, 상태도 유지된다 (성공한 퍼즐을 되돌리지 않는다).
  assert.equal(events.length, 1);
  assert.equal(events[0].event, CONTROL_ROOM_SOLVED_EVENT);
  assert.equal(port.getState().controlRoomSolved, true);
  assert.equal(port.getState().documentStorageUnlocked, false);
});

test("2단계 실패 후 재호출: resumed 경로로 이어서 복구한다", async () => {
  const failingPort = createFakeProgressPort({
    initial: createControlRoomReadyState(),
    failOn: { flag: "documentStorageUnlocked", mode: "throw" },
  });
  const flow = new ControlRoomCompletionFlow(failingPort);

  const first = await flow.commit(COMMIT_INPUT);
  assert.equal(first.outcome, "failed");

  // 장애가 복구된 상황을 새 포트로 재현한다. 상태는 1단계까지 반영되어 있다.
  const recoveredPort = createFakeProgressPort({
    initial: createControlRoomReadyState({ controlRoomSolved: true }),
  });
  const recoveredFlow = new ControlRoomCompletionFlow(recoveredPort);
  const second = await recoveredFlow.commit(COMMIT_INPUT);

  assert.equal(second.outcome, "resumed");
  assert.equal(recoveredPort.getState().documentStorageUnlocked, true);
});

test("플래그 미반영 응답도 실패로 분류한다", async () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState(),
    failOn: { flag: "controlRoomSolved", mode: "reject-silently" },
  });
  const flow = new ControlRoomCompletionFlow(port);

  const result = await flow.commit(COMMIT_INPUT);

  assert.equal(result.outcome, "failed");
  assert.ok(result.error);
});

test("동시 호출은 한 커밋으로 병합되어 중복 저장하지 않는다", async () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState(),
  });
  const flow = new ControlRoomCompletionFlow(port);

  const [first, second, third] = await Promise.all([
    flow.commit(COMMIT_INPUT),
    flow.commit(COMMIT_INPUT),
    flow.commit(COMMIT_INPUT),
  ]);

  assert.equal(first.outcome, "completed");
  assert.equal(second.outcome, "completed");
  assert.equal(third.outcome, "completed");
  // 병합되었으므로 저장은 정확히 2회(1단계 + 2단계)여야 한다.
  assert.equal(port.updates.length, 2);
  assert.equal(flow.isCommitting(), false);
});

test("완료 후 연속 호출은 멱등 결과를 반환한다", async () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState(),
  });
  const flow = new ControlRoomCompletionFlow(port);

  await flow.commit(COMMIT_INPUT);
  const again = await flow.commit(COMMIT_INPUT);

  assert.equal(again.outcome, "already-complete");
  assert.equal(port.updates.length, 2);
});
