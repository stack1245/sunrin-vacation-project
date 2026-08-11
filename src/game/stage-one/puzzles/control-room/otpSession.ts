/**
 * 보안 통제실 단말 세션용 OTP 발급기.
 *
 * 새 퍼즐 인스턴스마다 16진수 시드를 다시 만들고, 플레이어가 보는 가상 쿠키와
 * 검증 설정을 한 객체로 묶는다. 발급된 값은 해당 퍼즐 인스턴스가 닫힐 때까지
 * 고정되므로 단서를 읽고 계산하는 도중 정답이 바뀌지 않는다.
 */

import { deriveControlRoomOtp } from "./otp.ts";
import {
  CONTROL_ROOM_OTP_CONFIG,
  createControlRoomCookies,
} from "./puzzleData.ts";
import type { ControlRoomOtpConfig, VirtualCookie } from "./types.ts";

const MINIMUM_SESSION_SEED = 100;
const MAXIMUM_SESSION_SEED = 999;
const SESSION_SEED_COUNT =
  MAXIMUM_SESSION_SEED - MINIMUM_SESSION_SEED + 1;

type RandomSource = () => number;

export interface ControlRoomOtpSession {
  readonly otpConfig: ControlRoomOtpConfig;
  readonly cookies: readonly VirtualCookie[];
}

/** 같은 발급기에서 연속 발급한 OTP가 중복되지 않도록 직전 값을 기억한다. */
export class ControlRoomOtpIssuer {
  private lastIssuedOtp: string | null = null;
  private readonly randomSource: RandomSource;

  constructor(randomSource: RandomSource = Math.random) {
    this.randomSource = randomSource;
  }

  issue(): ControlRoomOtpSession {
    const randomValue = this.randomSource();

    if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
      throw new RangeError("OTP 난수 값은 0 이상 1 미만이어야 합니다.");
    }

    let seed =
      MINIMUM_SESSION_SEED + Math.floor(randomValue * SESSION_SEED_COUNT);
    let otpConfig = this.createConfig(seed);
    let issuedOtp = deriveControlRoomOtp(otpConfig);

    if (issuedOtp === this.lastIssuedOtp) {
      seed =
        seed === MAXIMUM_SESSION_SEED ? MINIMUM_SESSION_SEED : seed + 1;
      otpConfig = this.createConfig(seed);
      issuedOtp = deriveControlRoomOtp(otpConfig);
    }

    this.lastIssuedOtp = issuedOtp;

    return {
      otpConfig,
      cookies: createControlRoomCookies(otpConfig),
    };
  }

  private createConfig(seed: number): ControlRoomOtpConfig {
    return {
      seedHex: seed.toString(16).toUpperCase().padStart(3, "0"),
      shift: CONTROL_ROOM_OTP_CONFIG.shift,
    };
  }
}

const defaultControlRoomOtpIssuer = new ControlRoomOtpIssuer();

/** 실제 게임 단말이 새로 열릴 때 사용하는 기본 세션 발급 함수. */
export function issueControlRoomOtpSession(): ControlRoomOtpSession {
  return defaultControlRoomOtpIssuer.issue();
}
