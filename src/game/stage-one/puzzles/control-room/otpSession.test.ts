import assert from "node:assert/strict";
import test from "node:test";

import { deriveControlRoomOtp } from "./otp.ts";
import { ControlRoomOtpIssuer } from "./otpSession.ts";

function readCookieValue(
  cookies: ReturnType<ControlRoomOtpIssuer["issue"]>["cookies"],
  name: string,
): string | undefined {
  return cookies.find((cookie) => cookie.name === name)?.value;
}

test("단말 세션마다 새로운 OTP와 그에 맞는 가상 쿠키를 발급한다", () => {
  const randomValues = [0, 0.5];
  const issuer = new ControlRoomOtpIssuer(() => randomValues.shift() ?? 0);

  const firstSession = issuer.issue();
  const secondSession = issuer.issue();
  const firstOtp = deriveControlRoomOtp(firstSession.otpConfig);
  const secondOtp = deriveControlRoomOtp(secondSession.otpConfig);

  assert.notEqual(firstOtp, secondOtp);
  assert.equal(
    readCookieValue(firstSession.cookies, "sec.session"),
    `0x${firstSession.otpConfig.seedHex}`,
  );
  assert.equal(
    readCookieValue(secondSession.cookies, "sec.session"),
    `0x${secondSession.otpConfig.seedHex}`,
  );
  assert.equal(
    readCookieValue(secondSession.cookies, "sec.shift"),
    String(secondSession.otpConfig.shift),
  );
});

test("난수 값이 반복돼도 바로 직전 OTP를 다시 발급하지 않는다", () => {
  const issuer = new ControlRoomOtpIssuer(() => 0.25);

  const firstOtp = deriveControlRoomOtp(issuer.issue().otpConfig);
  const secondOtp = deriveControlRoomOtp(issuer.issue().otpConfig);

  assert.notEqual(firstOtp, secondOtp);
});

test("발급 후 같은 단말 세션에서는 OTP가 고정된다", () => {
  const session = new ControlRoomOtpIssuer(() => 0.75).issue();

  assert.equal(
    deriveControlRoomOtp(session.otpConfig),
    deriveControlRoomOtp(session.otpConfig),
  );
});

test("허용 범위를 벗어난 난수 값은 거부한다", () => {
  assert.throws(() => new ControlRoomOtpIssuer(() => 1).issue(), RangeError);
  assert.throws(
    () => new ControlRoomOtpIssuer(() => Number.NaN).issue(),
    RangeError,
  );
});
