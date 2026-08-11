import assert from "node:assert/strict";
import test from "node:test";

import { checkCaesarAnswer, normalizeAnswer } from "./caesarPuzzle.ts";

test("공백과 대소문자를 무시하고 정답을 인정한다", () => {
  assert.equal(checkCaesarAnswer("access granted"), true);
  assert.equal(checkCaesarAnswer("  AcCess   Granted  "), true);
});

test("오답은 거부한다", () => {
  assert.equal(checkCaesarAnswer("access denied"), false);
});

test("정규화는 공백을 제거하고 대문자로 통일한다", () => {
  assert.equal(normalizeAnswer("  hello world  "), "HELLOWORLD");
});