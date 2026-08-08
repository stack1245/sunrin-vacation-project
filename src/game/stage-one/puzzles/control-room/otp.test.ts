import assert from "node:assert/strict";
import test from "node:test";

import {
  CONTROL_ROOM_OTP_LENGTH,
  ControlRoomOtpConfigError,
  decodeSeedHex,
  deriveControlRoomOtp,
  describeControlRoomOtpRule,
  isControlRoomOtpShape,
  verifyControlRoomOtp,
} from "./otp.ts";
import { CONTROL_ROOM_OTP_CONFIG } from "./puzzleData.ts";

test("기본 퍼즐 데이터에서 규칙대로 OTP를 파생한다", () => {
  // seed 0x1A4 = 420, base "420", check (4+2+0)*7 = 42 -> "042"
  assert.equal(deriveControlRoomOtp(CONTROL_ROOM_OTP_CONFIG), "420042");
});

test("파생 결과는 항상 6자리 숫자다", () => {
  const cases = [
    { seedHex: "1A4", shift: 7 },
    { seedHex: "0x00F", shift: 0 },
    { seedHex: "FFFF", shift: 123 },
    { seedHex: "1", shift: 9 },
  ];

  for (const config of cases) {
    const otp = deriveControlRoomOtp(config);

    assert.equal(otp.length, CONTROL_ROOM_OTP_LENGTH);
    assert.ok(isControlRoomOtpShape(otp), `${otp} 형식 불일치`);
  }
});

test("0x 접두사와 대소문자를 모두 허용한다", () => {
  assert.equal(decodeSeedHex("1a4"), 420);
  assert.equal(decodeSeedHex("0X1A4"), 420);
  assert.equal(decodeSeedHex(" 1A4 "), 420);
});

test("16진수가 아닌 시드와 음수 시프트를 거부한다", () => {
  assert.throws(
    () => deriveControlRoomOtp({ seedHex: "XYZ", shift: 7 }),
    ControlRoomOtpConfigError,
  );
  assert.throws(
    () => deriveControlRoomOtp({ seedHex: "", shift: 7 }),
    ControlRoomOtpConfigError,
  );
  assert.throws(
    () => deriveControlRoomOtp({ seedHex: "1A4", shift: -1 }),
    ControlRoomOtpConfigError,
  );
  assert.throws(
    () => deriveControlRoomOtp({ seedHex: "1A4", shift: 1.5 }),
    ControlRoomOtpConfigError,
  );
});

test("정답 OTP를 통과시킨다", () => {
  const otp = deriveControlRoomOtp(CONTROL_ROOM_OTP_CONFIG);

  assert.deepEqual(verifyControlRoomOtp(otp, CONTROL_ROOM_OTP_CONFIG), {
    ok: true,
  });
});

test("앞뒤 공백이 있어도 정답으로 인정한다", () => {
  const otp = deriveControlRoomOtp(CONTROL_ROOM_OTP_CONFIG);
  const result = verifyControlRoomOtp(`  ${otp}  `, CONTROL_ROOM_OTP_CONFIG);

  assert.equal(result.ok, true);
});

test("형식 오류와 값 불일치를 구분한다", () => {
  const short = verifyControlRoomOtp("420", CONTROL_ROOM_OTP_CONFIG);
  const letters = verifyControlRoomOtp("42004a", CONTROL_ROOM_OTP_CONFIG);
  const wrong = verifyControlRoomOtp("000000", CONTROL_ROOM_OTP_CONFIG);

  assert.equal(short.ok, false);
  assert.equal(short.ok === false && short.reason, "shape");
  assert.equal(letters.ok === false && letters.reason, "shape");
  assert.equal(wrong.ok, false);
  assert.equal(wrong.ok === false && wrong.reason, "mismatch");
});

test("규칙 설명에 정답 OTP가 노출되지 않는다", () => {
  const otp = deriveControlRoomOtp(CONTROL_ROOM_OTP_CONFIG);
  const description = describeControlRoomOtpRule().join("\n");

  assert.ok(
    !description.includes(otp),
    "화면에 표시되는 규칙 설명이 정답을 그대로 담고 있습니다.",
  );
});
