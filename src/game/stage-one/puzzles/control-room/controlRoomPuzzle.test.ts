import assert from "node:assert/strict";
import test from "node:test";

import {
  ControlRoomCompletionFlow,
} from "./completionFlow.ts";
import {
  ControlRoomPuzzle,
  type ControlRoomPuzzleOptions,
} from "./controlRoomPuzzle.ts";
import { CONTROL_ROOM_MAX_OTP_ATTEMPTS } from "./otp.ts";
import {
  createControlRoomReadyState,
  createFakeProgressPort,
  type FakeProgressPort,
} from "./testSupport.ts";
import type { ControlRoomPuzzleEvent } from "./types.ts";

interface Harness {
  puzzle: ControlRoomPuzzle;
  port: FakeProgressPort;
  events: ControlRoomPuzzleEvent[];
}

function createHarness(
  portOverrides: Parameters<typeof createFakeProgressPort>[0] = {},
  puzzleOverrides: Partial<ControlRoomPuzzleOptions> = {},
): Harness {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState(),
    ...portOverrides,
  });
  const flow = new ControlRoomCompletionFlow(port);
  const events: ControlRoomPuzzleEvent[] = [];
  const puzzle = new ControlRoomPuzzle({
    commit: (input) => flow.commit(input),
    onEvent: (event) => {
      events.push(event);
    },
    ...puzzleOverrides,
  });

  return { puzzle, port, events };
}

async function runConsole(puzzle: ControlRoomPuzzle, command: string) {
  puzzle.selectTab("console");

  for (const character of command) {
    puzzle.typeCharacter(character);
  }

  await puzzle.submit();
}

test("새 보안 단말 퍼즐은 직전 세션과 다른 OTP를 사용한다", () => {
  const firstPuzzle = createHarness().puzzle;
  const secondPuzzle = createHarness().puzzle;

  assert.notEqual(
    firstPuzzle.getExpectedOtpForTesting(),
    secondPuzzle.getExpectedOtpForTesting(),
  );
});

test("정답 경로: 단서 열람 → 콘솔 인증 → 두 플래그 저장 → 단말 종료", async () => {
  const { puzzle, port, events } = createHarness();

  puzzle.open(port.getState());
  assert.equal(puzzle.isOpen(), true);

  await runConsole(puzzle, 'cookie.get("sec.session")');
  await runConsole(puzzle, "otp.rule()");

  const otp = puzzle.getExpectedOtpForTesting();
  await runConsole(puzzle, `otp.verify("${otp}")`);

  // 두 플래그가 저장되고 단말은 solved 로 닫힌다.
  assert.equal(port.getState().controlRoomSolved, true);
  assert.equal(port.getState().documentStorageUnlocked, true);
  assert.equal(puzzle.isOpen(), false);

  const accepted = events.find((event) => event.type === "otpAccepted");
  const closed = events.find((event) => event.type === "closed");

  assert.ok(accepted);
  assert.equal(closed?.type === "closed" && closed.reason, "solved");
});

test("인증 탭 경로: 숫자 입력과 Enter로도 완료된다", async () => {
  const { puzzle, port } = createHarness();

  puzzle.open(port.getState());
  puzzle.selectTab("auth");

  for (const digit of puzzle.getExpectedOtpForTesting()) {
    puzzle.typeCharacter(digit);
  }

  await puzzle.submit();

  assert.equal(port.getState().documentStorageUnlocked, true);
  assert.equal(puzzle.isOpen(), false);
});

test("인증 탭은 숫자 외 문자와 초과 입력을 무시한다", () => {
  const { puzzle, port } = createHarness();

  puzzle.open(port.getState());
  puzzle.selectTab("auth");
  puzzle.typeCharacter("a");
  puzzle.typeCharacter("!");

  for (let index = 0; index < 10; index += 1) {
    puzzle.typeCharacter("9");
  }

  assert.equal(puzzle.getSnapshot().otpInput, "999999");
});

test("오답: 시도 횟수를 소모하고 플래그를 저장하지 않는다", async () => {
  const { puzzle, port, events } = createHarness();

  puzzle.open(port.getState());
  await runConsole(puzzle, 'otp.verify("000000")');

  const snapshot = puzzle.getSnapshot();

  assert.equal(snapshot.failedAttempts, 1);
  assert.equal(snapshot.remainingAttempts, CONTROL_ROOM_MAX_OTP_ATTEMPTS - 1);
  assert.equal(port.updates.length, 0);
  assert.equal(port.getState().controlRoomSolved, false);
  assert.ok(events.some((event) => event.type === "otpRejected"));
  assert.equal(puzzle.isOpen(), true);
});

test("형식 오류는 시도 횟수를 소모하지 않는다", async () => {
  const { puzzle, port } = createHarness();

  puzzle.open(port.getState());
  await runConsole(puzzle, 'otp.verify("12")');
  await runConsole(puzzle, 'otp.verify("abcdef")');

  assert.equal(puzzle.getSnapshot().failedAttempts, 0);
  assert.equal(port.updates.length, 0);
});

test("오답 한도 초과: 잠금 이벤트와 함께 단말이 닫힌다", async () => {
  const { puzzle, port, events } = createHarness();

  puzzle.open(port.getState());

  for (let index = 0; index < CONTROL_ROOM_MAX_OTP_ATTEMPTS; index += 1) {
    await runConsole(puzzle, 'otp.verify("000000")');
  }

  assert.equal(puzzle.isOpen(), false);
  assert.ok(events.some((event) => event.type === "lockedOut"));

  const closed = events.filter((event) => event.type === "closed").pop();
  assert.equal(closed?.type === "closed" && closed.reason, "locked-out");
  assert.equal(port.getState().controlRoomSolved, false);

  // 재접속하면 시도 횟수가 초기화되어 다시 도전할 수 있다.
  puzzle.open(port.getState());
  assert.equal(puzzle.getSnapshot().failedAttempts, 0);
});

test("정답 후 저장 실패: 상태는 유지되고 단말은 열린 채 오류를 안내한다", async () => {
  const { puzzle, port } = createHarness({
    initial: createControlRoomReadyState(),
    failOn: { flag: "controlRoomSolved", mode: "throw" },
  });

  puzzle.open(port.getState());
  await runConsole(puzzle, `otp.verify("${puzzle.getExpectedOtpForTesting()}")`);

  const snapshot = puzzle.getSnapshot();

  assert.equal(puzzle.isOpen(), true, "실패 시 단말이 닫히면 재시도할 수 없습니다.");
  assert.equal(snapshot.statusTone, "error");
  assert.equal(snapshot.busy, false);
});

test("네트워크 저장만 실패(swallow): 게임 상태는 완료로 유지된다", async () => {
  const { puzzle, port } = createHarness({
    initial: createControlRoomReadyState(),
    failOn: { flag: "documentStorageUnlocked", mode: "swallow" },
  });

  puzzle.open(port.getState());
  await runConsole(puzzle, `otp.verify("${puzzle.getExpectedOtpForTesting()}")`);

  // swallow 모드는 A의 저장 큐 재시도 상황: 상태는 반영된 채 반환된다.
  assert.equal(port.getState().documentStorageUnlocked, true);
  assert.equal(puzzle.isOpen(), false);
});

test("부분 완료 재입장: 인증을 다시 요구하지 않고 봉쇄 해제만 남긴다", async () => {
  const { puzzle, port } = createHarness({
    initial: createControlRoomReadyState({ controlRoomSolved: true }),
  });

  puzzle.open(port.getState());

  const snapshot = puzzle.getSnapshot();
  assert.equal(snapshot.verified, true);
  assert.equal(snapshot.released, false);

  // 인증 탭에서 Enter 한 번으로 2단계만 수행한다.
  puzzle.selectTab("auth");
  await puzzle.submit();

  assert.deepEqual(
    port.updates.map((update) => update.patch),
    [{ documentStorageUnlocked: true }],
  );
  assert.equal(puzzle.isOpen(), false);
});

test("완료 후 재입장: 열람 전용으로 열리고 어떤 저장도 발생하지 않는다", async () => {
  const { puzzle, port, events } = createHarness({
    initial: createControlRoomReadyState({
      controlRoomSolved: true,
      documentStorageUnlocked: true,
    }),
  });

  puzzle.open(port.getState());

  const opened = events.find((event) => event.type === "opened");
  assert.equal(opened?.type === "opened" && opened.alreadySolved, true);
  assert.equal(puzzle.getSnapshot().phase, "solved");

  // 열람 상태에서 인증 탭 Enter를 눌러도 저장이 없다.
  puzzle.selectTab("auth");
  await puzzle.submit();
  assert.equal(port.updates.length, 0);
});

test("과학 실험실 미완료: blocked 안내만 하고 단말은 유지된다", async () => {
  const { puzzle, port } = createHarness({
    initial: createControlRoomReadyState({ scienceLabPuzzleSolved: false }),
  });

  puzzle.open(port.getState());
  await runConsole(puzzle, `otp.verify("${puzzle.getExpectedOtpForTesting()}")`);

  assert.equal(port.updates.length, 0);
  assert.equal(puzzle.isOpen(), true);
  assert.equal(puzzle.getSnapshot().statusTone, "warning");
});

test("탭 순환과 선택이 스냅숏에 반영된다", () => {
  const { puzzle, port } = createHarness();

  puzzle.open(port.getState());
  assert.equal(puzzle.getSnapshot().activeTab, "console");

  puzzle.cycleTab(1);
  assert.equal(puzzle.getSnapshot().activeTab, "cookies");

  puzzle.cycleTab(-1);
  assert.equal(puzzle.getSnapshot().activeTab, "console");

  puzzle.cycleTab(-1);
  assert.equal(puzzle.getSnapshot().activeTab, "auth");

  puzzle.selectTab("network");
  assert.equal(puzzle.getSnapshot().activeTab, "network");
});

test("clear 명령은 콘솔 버퍼를 비운다", async () => {
  const { puzzle, port } = createHarness();

  puzzle.open(port.getState());
  await runConsole(puzzle, "help");
  assert.ok(puzzle.getSnapshot().consoleLines.length > 0);

  await runConsole(puzzle, "clear");
  assert.equal(puzzle.getSnapshot().consoleLines.length, 0);
});

test("exit 명령은 사용자 종료로 단말을 닫는다", async () => {
  const { puzzle, port, events } = createHarness();

  puzzle.open(port.getState());
  await runConsole(puzzle, "exit");

  assert.equal(puzzle.isOpen(), false);

  const closed = events.filter((event) => event.type === "closed").pop();
  assert.equal(closed?.type === "closed" && closed.reason, "user");
});

test("중복 open은 무시되고 dispose 후 사용은 거부된다", () => {
  const { puzzle, port } = createHarness();

  puzzle.open(port.getState());
  puzzle.typeCharacter("h");
  puzzle.open(port.getState()); // 중복 open — 입력이 초기화되면 안 된다.
  assert.equal(puzzle.getSnapshot().consoleInput, "h");

  puzzle.dispose();
  assert.equal(puzzle.isOpen(), false);
  assert.throws(() => puzzle.open(port.getState()));
});

test("onChange 구독자는 마지막 스냅숏을 받는다", async () => {
  const snapshots: string[] = [];
  const { puzzle, port } = createHarness(
    {},
    {
      onChange: (snapshot) => {
        snapshots.push(snapshot.phase);
      },
    },
  );

  puzzle.open(port.getState());
  await runConsole(puzzle, `otp.verify("${puzzle.getExpectedOtpForTesting()}")`);

  assert.ok(snapshots.includes("committing"));
  assert.equal(snapshots[snapshots.length - 1], "solved");
});
