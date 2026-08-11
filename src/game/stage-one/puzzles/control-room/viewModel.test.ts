import assert from "node:assert/strict";
import test from "node:test";

import { ControlRoomCompletionFlow } from "./completionFlow.ts";
import { ControlRoomPuzzle } from "./controlRoomPuzzle.ts";
import {
  createControlRoomReadyState,
  createFakeProgressPort,
} from "./testSupport.ts";
import {
  buildControlRoomViewModel,
  CONTROL_ROOM_VISIBLE_LINES,
} from "./viewModel.ts";

function createOpenPuzzle(
  initial: Parameters<typeof createControlRoomReadyState>[0] = {},
) {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState(initial),
  });
  const flow = new ControlRoomCompletionFlow(port);
  const puzzle = new ControlRoomPuzzle({ commit: (input) => flow.commit(input) });

  puzzle.open(port.getState());
  return { puzzle, port };
}

test("탭 4개가 표시되고 활성 탭이 강조된다", () => {
  const { puzzle } = createOpenPuzzle();
  const view = buildControlRoomViewModel(puzzle.getSnapshot());

  assert.equal(view.tabs.length, 4);
  assert.equal(view.tabs.filter((tab) => tab.active).length, 1);
  assert.equal(view.tabs[0].active, true);
});

test("본문 줄 수는 표시 한도를 넘지 않는다", async () => {
  const { puzzle } = createOpenPuzzle();

  // 콘솔 버퍼를 한도 이상 채운다.
  puzzle.selectTab("console");
  for (let index = 0; index < 30; index += 1) {
    for (const character of "help") {
      puzzle.typeCharacter(character);
    }
    await puzzle.submit();
  }

  const view = buildControlRoomViewModel(puzzle.getSnapshot());

  assert.ok(view.bodyLines.length <= CONTROL_ROOM_VISIBLE_LINES);
});

test("쿠키 탭은 마스킹 값을 노출하지 않는다", () => {
  const { puzzle } = createOpenPuzzle();

  puzzle.selectTab("cookies");
  const view = buildControlRoomViewModel(puzzle.getSnapshot());
  const merged = view.bodyLines.map((line) => line.text).join("\n");

  assert.ok(!merged.includes("0x1A4"), "마스킹된 시드가 쿠키 탭에 노출되었습니다.");
});

test("인증 탭은 입력 자리와 남은 시도를 표시한다", () => {
  const { puzzle } = createOpenPuzzle();

  puzzle.selectTab("auth");
  puzzle.typeCharacter("4");
  puzzle.typeCharacter("2");

  const view = buildControlRoomViewModel(puzzle.getSnapshot());
  const merged = view.bodyLines.map((line) => line.text).join("\n");

  assert.ok(merged.includes("4 2 _ _ _ _"));
  assert.ok(merged.includes("남은 시도"));
});

test("어느 화면에도 정답 OTP가 노출되지 않는다", () => {
  const { puzzle } = createOpenPuzzle();
  const otp = puzzle.getExpectedOtpForTesting();

  for (const tab of ["console", "cookies", "network", "auth"] as const) {
    puzzle.selectTab(tab);

    const view = buildControlRoomViewModel(puzzle.getSnapshot());
    const merged = [
      view.title,
      ...view.bodyLines.map((line) => line.text),
      view.inputLine,
      view.statusText,
      view.footer,
    ].join("\n");

    assert.ok(
      !merged.includes(otp),
      `${tab} 탭 화면에 정답 OTP가 그대로 노출됩니다.`,
    );
  }
});

test("콘솔 탭 안내는 Q 닫기 대신 exit를 안내한다", () => {
  const { puzzle } = createOpenPuzzle();

  puzzle.selectTab("console");
  const consoleView = buildControlRoomViewModel(puzzle.getSnapshot());
  assert.ok(consoleView.footer.includes("exit"));
  assert.ok(!consoleView.footer.includes("Q 닫기"));

  puzzle.selectTab("cookies");
  const cookieView = buildControlRoomViewModel(puzzle.getSnapshot());
  assert.ok(cookieView.footer.includes("Q 닫기"));
});

test("부분 완료 상태의 인증 탭은 봉쇄 해제 안내를 표시한다", () => {
  const { puzzle } = createOpenPuzzle({ controlRoomSolved: true });

  puzzle.selectTab("auth");
  const view = buildControlRoomViewModel(puzzle.getSnapshot());
  const merged = view.bodyLines.map((line) => line.text).join("\n");

  assert.ok(merged.includes("봉쇄 해제"));
  assert.equal(view.caretVisible, false);
});
