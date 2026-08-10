import assert from "node:assert/strict";
import test from "node:test";

import {
  checkVigenereAnswer,
  describeArchiveClues,
  DOCUMENT_STORAGE_SYMBOL_ORDER_CLUE,
  SCIENCE_LAB_SEQUENCE_CLUE,
  VIGENERE_PUZZLE,
} from "./vigenerePuzzle.ts";

test("비즈네르 정답의 공백과 대소문자를 무시한다", () => {
  assert.equal(checkVigenereAnswer("symbol order five"), true);
  assert.equal(checkVigenereAnswer("  SyMbOl   OrDeR  FiVe  "), true);
});

test("비즈네르 오답과 카이사르 정답을 거부한다", () => {
  assert.equal(checkVigenereAnswer("symbol order four"), false);
  assert.equal(checkVigenereAnswer("access granted"), false);
});

test("비즈네르 퍼즐 데이터와 후속 단서 계약을 유지한다", () => {
  assert.equal(VIGENERE_PUZZLE.keyword, "LOCK");
  assert.deepEqual(SCIENCE_LAB_SEQUENCE_CLUE, [
    "화학 기호",
    "용액 밀도",
    "산소 공급",
    "점화",
    "가열",
  ]);
  assert.equal(DOCUMENT_STORAGE_SYMBOL_ORDER_CLUE, "%$#@!");

  const clueSummary = describeArchiveClues();
  assert.match(clueSummary, /화학 기호 → 용액 밀도 → 산소 공급 → 점화 → 가열/);
  assert.match(clueSummary, /% → \$ → # → @ → !/);
});
