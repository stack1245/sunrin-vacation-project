import assert from "node:assert/strict";
import test from "node:test";

import {
  SCIENCE_LAB_SECURITY_CODE,
  SCIENCE_LAB_STEPS,
  ScienceLabPuzzle,
} from "./scienceLabPuzzle.ts";

const CORRECT_ANSWERS = {
  symbol: "H2O",
  density: "1.0",
  oxygen: "21",
  ignition: "ON",
  heating: "HEAT",
} as const;

test("과학 실험실 퍼즐은 화학 기호 단계부터 시작한다", () => {
  const puzzle = new ScienceLabPuzzle();

  assert.deepEqual(puzzle.getSnapshot(), {
    currentStep: "symbol",
    completedSteps: [],
    solved: false,
  });
});

test("현재 단계가 아닌 장치와 오답은 진행시키지 않는다", () => {
  const puzzle = new ScienceLabPuzzle();

  const wrongOrder = puzzle.submit("oxygen", "21");
  const wrongAnswer = puzzle.submit("symbol", "CO2");

  assert.equal(wrongOrder.outcome, "wrong-step");
  assert.equal(wrongAnswer.outcome, "rejected");
  assert.equal(puzzle.getSnapshot().currentStep, "symbol");
  assert.deepEqual(puzzle.getSnapshot().completedSteps, []);
});

test("확정된 다섯 단계를 순서대로 완료하면 해결 상태가 된다", () => {
  const puzzle = new ScienceLabPuzzle();

  for (const step of SCIENCE_LAB_STEPS) {
    const result = puzzle.submit(step, CORRECT_ANSWERS[step]);
    assert.equal(result.outcome, "accepted");
  }

  assert.deepEqual(puzzle.getSnapshot(), {
    currentStep: null,
    completedSteps: [...SCIENCE_LAB_STEPS],
    solved: true,
  });
});

test("문자 입력은 대소문자와 앞뒤·내부 공백을 정규화한다", () => {
  const puzzle = new ScienceLabPuzzle();

  assert.equal(puzzle.submit("symbol", " h 2 o ").outcome, "accepted");
  assert.equal(puzzle.submit("density", " 1.0 ").outcome, "accepted");
  assert.equal(puzzle.submit("oxygen", " 21 ").outcome, "accepted");
  assert.equal(puzzle.submit("ignition", " on ").outcome, "accepted");
  assert.equal(puzzle.submit("heating", " heat ").outcome, "accepted");
});

test("완료 상태 복구와 미완료 재입장 초기화를 구분한다", () => {
  const puzzle = new ScienceLabPuzzle(true);

  assert.equal(puzzle.getSnapshot().solved, true);
  assert.equal(puzzle.submit("symbol", "H2O").outcome, "already-solved");

  puzzle.reset(false);

  assert.equal(puzzle.getSnapshot().solved, false);
  assert.equal(puzzle.getSnapshot().currentStep, "symbol");
});

test("보안 통제실 승인 코드는 E 파트 OTP와 분리된 형식을 유지한다", () => {
  assert.equal(SCIENCE_LAB_SECURITY_CODE, "SEC-8042-CTRL");
  assert.notEqual(SCIENCE_LAB_SECURITY_CODE, "420042");
});
