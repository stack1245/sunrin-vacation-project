import assert from "node:assert/strict";
import test from "node:test";

import {
  createStagePath,
  parseStageIdPathSegment,
} from "./stageRoute.ts";

test("양의 정수 경로만 스테이지 ID로 해석한다", () => {
  assert.equal(parseStageIdPathSegment("1"), 1);
  assert.equal(parseStageIdPathSegment("2147483647"), 2_147_483_647);
});

test("slug·선행 0·소수·범위 초과 ID를 거부한다", () => {
  for (const segment of [
    "abandoned-lab",
    "0",
    "01",
    "-1",
    "1.5",
    "1?next=2",
    "2147483648",
    "",
  ]) {
    assert.equal(parseStageIdPathSegment(segment), null);
  }
});

test("스테이지 링크를 숫자 ID 경로로 만든다", () => {
  assert.equal(createStagePath(1), "/stages/1");
  assert.equal(createStagePath(27), "/stages/27");
});

test("유효하지 않은 스테이지 ID로 링크를 만들지 않는다", () => {
  for (const stageId of [0, -1, 1.5, Number.NaN, 2_147_483_648]) {
    assert.throws(() => createStagePath(stageId));
  }
});
