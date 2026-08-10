import assert from "node:assert/strict";
import test from "node:test";

import {
  adjustResourceAllocation,
  createInitialResourceAllocation,
  evaluateResourceAllocation,
  type ResourceAllocation,
} from "./resourceAllocationPuzzle.ts";

const SOLUTION: ResourceAllocation = {
  A: 19,
  B: 16,
  C: 30,
  D: 27,
  E: 8,
};

test("자원 분배 초기값은 각 구역 20개로 시작한다", () => {
  assert.deepEqual(createInitialResourceAllocation(), {
    A: 20,
    B: 20,
    C: 20,
    D: 20,
    E: 20,
  });
});

test("자원 변경은 기존 상태를 보존하고 0에서 100 사이로 제한한다", () => {
  const initial = createInitialResourceAllocation();
  const decreased = adjustResourceAllocation(initial, "A", -25);
  const increased = adjustResourceAllocation(initial, "E", 100);

  assert.equal(initial.A, 20);
  assert.equal(initial.E, 20);
  assert.equal(decreased.A, 0);
  assert.equal(increased.E, 100);
});

test("구역 A는 15 이상 30 이하에서 17, 19, 23, 29만 허용한다", () => {
  const allowedValues = [17, 19, 23, 29];

  for (let value = 15; value <= 30; value += 1) {
    const allocation = {
      ...createInitialResourceAllocation(),
      A: value,
    };
    const isAllowed =
      evaluateResourceAllocation(allocation).ruleChecks["zone-a-prime"];

    assert.equal(isAllowed, allowedValues.includes(value), `A=${value}`);
  }
});

test("19, 16, 30, 27, 8 배치는 모든 자원 분배 조건을 만족한다", () => {
  const evaluation = evaluateResourceAllocation(SOLUTION);

  assert.equal(evaluation.total, 100);
  assert.equal(evaluation.isSolved, true);
  assert.deepEqual(evaluation.ruleChecks, {
    total: true,
    "zone-a-prime": true,
    "zone-b-double-e": true,
    "zone-c-multiple-of-five": true,
    "zone-d-sum": true,
    "zone-e-multiple-of-eight": true,
  });
});

test("정수 범위에서 자원 분배 해답은 하나뿐이다", () => {
  const solutions: ResourceAllocation[] = [];

  for (let A = 15; A <= 30; A += 1) {
    for (let E = 0; E <= 100; E += 8) {
      const B = E * 2;
      const D = A + E;

      if (B > 100 || D > 100) {
        continue;
      }

      for (let C = 0; C <= 100; C += 5) {
        const allocation = { A, B, C, D, E };

        if (evaluateResourceAllocation(allocation).isSolved) {
          solutions.push(allocation);
        }
      }
    }
  }

  assert.deepEqual(solutions, [SOLUTION]);
});
