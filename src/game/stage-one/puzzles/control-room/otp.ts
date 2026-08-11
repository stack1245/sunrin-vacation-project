/**
 * E 파트 · 보안 통제실 OTP 파생·검증 로직
 *
 * 실제 게임은 단말 세션마다 가상 쿠키 시드를 새로 발급한다. 한 세션 안에서는
 * 그 시드로 OTP가 결정론적으로 파생되므로 플레이어가 단서만으로 정답을 추론할
 * 수 있고, 계산 도중 정답이 바뀌지 않는다.
 *
 * ## 파생 규칙
 *
 * ```text
 * seed  = parseInt(seedHex, 16)                     // "1A4" -> 420
 * base  = pad3(seed % 1000)                         // "420"
 * check = pad3((digitSum(base) * shift) % 1000)     // (4+2+0)*7 = 42 -> "042"
 * otp   = base + check                              // "420042"
 * ```
 *
 * 브라우저 API를 사용하지 않는다. `types.ts`의 격리 규칙을 그대로 따른다.
 */

import type { ControlRoomOtpConfig } from "./types.ts";

/** OTP 자릿수. UI 입력 길이 제한과 검증에 함께 쓰인다. */
export const CONTROL_ROOM_OTP_LENGTH = 6;

/** 잠금까지 허용하는 최대 오답 횟수. */
export const CONTROL_ROOM_MAX_OTP_ATTEMPTS = 5;

const OTP_PATTERN = new RegExp(`^\\d{${CONTROL_ROOM_OTP_LENGTH}}$`);
const HEX_PATTERN = /^[0-9a-fA-F]+$/;

/** OTP 설정이 규칙을 만족하지 못할 때 발생한다. 퍼즐 데이터 오타를 즉시 드러낸다. */
export class ControlRoomOtpConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ControlRoomOtpConfigError";
  }
}

function pad3(value: number): string {
  return String(value).padStart(3, "0").slice(-3);
}

function digitSum(digits: string): number {
  let total = 0;

  for (const character of digits) {
    total += Number(character);
  }

  return total;
}

/**
 * 16진수 시드를 10진수로 해석한다. 가상 쿠키 `sec.session` 값 해독 단계에 해당한다.
 */
export function decodeSeedHex(seedHex: string): number {
  const normalized = seedHex.trim().replace(/^0[xX]/, "");

  if (normalized.length === 0 || !HEX_PATTERN.test(normalized)) {
    throw new ControlRoomOtpConfigError(
      `시드는 16진수 문자열이어야 합니다: ${seedHex}`,
    );
  }

  return Number.parseInt(normalized, 16);
}

/**
 * 가상 쿠키에서 얻은 시드와 시프트로 정답 OTP를 파생한다.
 *
 * @throws {ControlRoomOtpConfigError} 시드가 16진수가 아니거나 시프트가 안전한 정수가 아닐 때
 */
export function deriveControlRoomOtp(config: ControlRoomOtpConfig): string {
  if (!Number.isSafeInteger(config.shift) || config.shift < 0) {
    throw new ControlRoomOtpConfigError(
      `시프트 값은 0 이상의 안전한 정수여야 합니다: ${config.shift}`,
    );
  }

  const seed = decodeSeedHex(config.seedHex);
  const base = pad3(seed % 1000);
  const check = pad3((digitSum(base) * config.shift) % 1000);
  const otp = `${base}${check}`;

  if (!OTP_PATTERN.test(otp)) {
    throw new ControlRoomOtpConfigError(
      `파생된 OTP가 ${CONTROL_ROOM_OTP_LENGTH}자리 숫자가 아닙니다: ${otp}`,
    );
  }

  return otp;
}

/** 입력이 OTP 형식(6자리 숫자)인지 확인한다. 값 일치 여부는 보지 않는다. */
export function isControlRoomOtpShape(value: string): boolean {
  return OTP_PATTERN.test(value);
}

/** OTP 검증 결과. 실패 사유를 구분해 UI 문구와 저장 여부를 분기한다. */
export type ControlRoomOtpVerification =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "shape"; readonly message: string }
  | { readonly ok: false; readonly reason: "mismatch"; readonly message: string };

/**
 * 입력한 OTP를 검증한다.
 *
 * 형식 오류(`shape`)는 시도 횟수를 소모시키지 않고, 값 불일치(`mismatch`)만 오답으로 센다.
 * 이 함수는 상태를 갖지 않으며 저장이나 이벤트 발행을 하지 않는다.
 */
export function verifyControlRoomOtp(
  input: string,
  config: ControlRoomOtpConfig,
): ControlRoomOtpVerification {
  const candidate = input.trim();

  if (!isControlRoomOtpShape(candidate)) {
    return {
      ok: false,
      reason: "shape",
      message: `OTP는 숫자 ${CONTROL_ROOM_OTP_LENGTH}자리입니다.`,
    };
  }

  if (candidate !== deriveControlRoomOtp(config)) {
    return {
      ok: false,
      reason: "mismatch",
      message: "인증 코드가 일치하지 않습니다.",
    };
  }

  return { ok: true };
}

/** 가짜 DevTools가 표시할 파생 규칙 설명. 정답 자체는 절대 노출하지 않는다. */
export function describeControlRoomOtpRule(): readonly string[] {
  return [
    "otp = base ++ check",
    "  base  = dec(sec.session) 의 마지막 3자리",
    "  check = (base 각 자리 합 × sec.shift) mod 1000, 3자리 0채움",
  ];
}
