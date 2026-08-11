import assert from "node:assert/strict";
import test from "node:test";

import {
  GAME_DATA_RESET_CONFIRMATION,
  getNicknameValidationMessage,
  getPasswordValidationMessage,
  isGameDataResetConfirmed,
  normalizeNickname,
} from "./accountValidation.ts";

test("닉네임 앞뒤 공백을 제거한다", () => {
  assert.equal(normalizeNickname("  플레이어  "), "플레이어");
});

test("닉네임은 2자 이상 24자 이하만 허용한다", () => {
  assert.match(getNicknameValidationMessage("a") ?? "", /2자 이상/);
  assert.match(getNicknameValidationMessage("가".repeat(25)) ?? "", /24자 이하/);
  assert.equal(getNicknameValidationMessage("플레이어"), null);
});

test("비밀번호 변경에 현재 비밀번호와 8자 이상의 새 비밀번호가 필요하다", () => {
  assert.match(getPasswordValidationMessage("", "new-password", "new-password") ?? "", /현재 비밀번호/);
  assert.match(getPasswordValidationMessage("old-password", "short", "short") ?? "", /8자 이상/);
});

test("현재 비밀번호 재사용과 확인 불일치를 거부한다", () => {
  assert.match(getPasswordValidationMessage("same-password", "same-password", "same-password") ?? "", /다른 새 비밀번호/);
  assert.match(getPasswordValidationMessage("old-password", "new-password", "different-password") ?? "", /일치하지 않습니다/);
  assert.equal(getPasswordValidationMessage("old-password", "new-password", "new-password"), null);
});

test("데이터 초기화 확인 문구는 정확히 일치해야 한다", () => {
  assert.equal(isGameDataResetConfirmed(GAME_DATA_RESET_CONFIRMATION), true);
  assert.equal(isGameDataResetConfirmed(` ${GAME_DATA_RESET_CONFIRMATION}`), false);
  assert.equal(isGameDataResetConfirmed("초기화합니다"), false);
});
