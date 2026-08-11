/**
 * E 파트 · 가짜 F12(가상 DevTools) 퍼즐 상태 머신
 *
 * 게임 내부에서만 동작하는 가짜 개발자 도구의 모든 규칙을 담는다.
 * Phaser, DOM, 브라우저 저장소, 실제 개발자 도구 API를 일절 사용하지 않으므로
 * Node 단위 테스트에서 전체 시나리오를 그대로 재현할 수 있다.
 *
 * ## 흐름
 *
 * ```text
 * open(state)
 *   → 탭 탐색 (콘솔 / 쿠키 / 네트워크 / 인증)
 *   → 단서 수집 (cookie.get, otp.rule, 네트워크 로그)
 *   → OTP 제출 (인증 탭 Enter 또는 otp.verify("......"))
 *       ├─ 형식 오류      → 시도 횟수 소모 없음
 *       ├─ 값 불일치      → 오답 누적, 한도 초과 시 잠금
 *       └─ 통과          → commit() 호출 → 완료 이벤트 2단계 커밋
 *   → close
 * ```
 *
 * 실패 횟수와 열람 상태는 세션 한정 값이며 진행도에 저장하지 않는다.
 * (저장 계약 v2에는 실패 상태 필드가 없고, 실패 패널티 영구 저장은 미결정 항목이다.)
 */

import type { StageOneSaveState } from "../../../../types/stage-one.ts";
import {
  CONTROL_ROOM_MAX_OTP_ATTEMPTS,
  CONTROL_ROOM_OTP_LENGTH,
  deriveControlRoomOtp,
  verifyControlRoomOtp,
} from "./otp.ts";
import {
  CONTROL_ROOM_CONSOLE_BANNER,
  CONTROL_ROOM_COOKIES,
  CONTROL_ROOM_NETWORK_ENTRIES,
  CONTROL_ROOM_OTP_CONFIG,
} from "./puzzleData.ts";
import type {
  ControlRoomCommitInput,
  ControlRoomCommitResult,
} from "./completionFlow.ts";
import type {
  ControlRoomCloseReason,
  ControlRoomOtpConfig,
  ControlRoomPhase,
  ControlRoomPuzzleEvent,
  ControlRoomTabId,
  VirtualConsoleLine,
  VirtualNetworkEntry,
} from "./types.ts";
import {
  executeVirtualCommand,
  VirtualConsoleBuffer,
  VIRTUAL_CONSOLE_PROMPT,
} from "./virtualConsole.ts";
import { VirtualCookieJar, type VirtualCookieView } from "./virtualCookieJar.ts";

/** 탭 순서. 숫자 키와 Tab 키 순환에 함께 쓰인다. */
export const CONTROL_ROOM_TAB_ORDER: readonly ControlRoomTabId[] = [
  "console",
  "cookies",
  "network",
  "auth",
];

/** 탭 한국어 표시명. Room ID처럼 내부 식별자는 영문, 표시는 한국어를 쓴다. */
export const CONTROL_ROOM_TAB_LABELS: Record<ControlRoomTabId, string> = {
  console: "콘솔",
  cookies: "쿠키",
  network: "네트워크",
  auth: "인증",
};

/** 콘솔 입력 최대 길이. 지나치게 긴 입력을 막는다. */
export const CONTROL_ROOM_MAX_INPUT_LENGTH = 64;

/** 상태 표시줄의 강조 등급. */
export type ControlRoomStatusTone = "info" | "success" | "warning" | "error";

/** 렌더링에 필요한 전체 스냅숏. 어댑터는 이 값만 보고 화면을 그린다. */
export interface ControlRoomPuzzleSnapshot {
  readonly open: boolean;
  readonly phase: ControlRoomPhase;
  readonly activeTab: ControlRoomTabId;
  readonly consoleLines: readonly VirtualConsoleLine[];
  readonly consoleInput: string;
  readonly otpInput: string;
  readonly cookies: readonly VirtualCookieView[];
  readonly network: readonly VirtualNetworkEntry[];
  readonly failedAttempts: number;
  readonly remainingAttempts: number;
  /** OTP 검증을 통과했거나 이미 통제실을 클리어한 상태. */
  readonly verified: boolean;
  /** 문서 보관실 봉쇄가 해제된 상태. */
  readonly released: boolean;
  readonly busy: boolean;
  readonly statusText: string;
  readonly statusTone: ControlRoomStatusTone;
}

/** 퍼즐 생성 옵션. 테스트는 데이터와 커밋 함수를 자유롭게 교체한다. */
export interface ControlRoomPuzzleOptions {
  /** OTP 커밋 처리. Room은 `ControlRoomCompletionFlow.commit` 을 연결한다. */
  readonly commit: (
    input: ControlRoomCommitInput,
  ) => Promise<ControlRoomCommitResult>;
  readonly otpConfig?: ControlRoomOtpConfig;
  readonly cookies?: readonly (typeof CONTROL_ROOM_COOKIES)[number][];
  readonly network?: readonly VirtualNetworkEntry[];
  readonly maxAttempts?: number;
  /** 화면 갱신 신호. 스냅숏이 바뀔 때마다 호출된다. */
  readonly onChange?: (snapshot: ControlRoomPuzzleSnapshot) => void;
  /** 퍼즐 사건 관찰자. */
  readonly onEvent?: (event: ControlRoomPuzzleEvent) => void;
}

interface StatusLine {
  readonly text: string;
  readonly tone: ControlRoomStatusTone;
}

const IDLE_STATUS: StatusLine = {
  text: "보안 단말에 연결되었습니다. 단서를 찾아 인증 코드를 산출하세요.",
  tone: "info",
};

export class ControlRoomPuzzle {
  private readonly console = new VirtualConsoleBuffer();
  private readonly cookies: VirtualCookieJar;
  private readonly network: readonly VirtualNetworkEntry[];
  private readonly otpConfig: ControlRoomOtpConfig;
  private readonly maxAttempts: number;

  private opened = false;
  private phase: ControlRoomPhase = "browsing";
  private activeTab: ControlRoomTabId = "console";
  private consoleInput = "";
  private otpInput = "";
  private failedAttempts = 0;
  private verified = false;
  private released = false;
  private busy = false;
  private status: StatusLine = IDLE_STATUS;
  private disposed = false;
  private readonly options: ControlRoomPuzzleOptions;

  constructor(options: ControlRoomPuzzleOptions) {
    this.options = options;
    this.cookies = new VirtualCookieJar(
      options.cookies ?? CONTROL_ROOM_COOKIES,
    );
    this.network = options.network ?? CONTROL_ROOM_NETWORK_ENTRIES;
    this.otpConfig = options.otpConfig ?? CONTROL_ROOM_OTP_CONFIG;
    this.maxAttempts = options.maxAttempts ?? CONTROL_ROOM_MAX_OTP_ATTEMPTS;
  }

  /**
   * 단말을 연다. 현재 진행 상태를 받아 이미 완료된 구간을 그대로 반영한다.
   *
   * - 두 플래그가 모두 true면 열람 전용(`solved`)으로 열린다.
   * - `controlRoomSolved` 만 true면 인증은 통과한 것으로 보고 봉쇄 해제만 남긴다.
   */
  open(state: StageOneSaveState): void {
    this.assertActive();

    if (this.opened) {
      return;
    }

    this.opened = true;
    this.busy = false;
    this.failedAttempts = 0;
    this.consoleInput = "";
    this.otpInput = "";
    this.activeTab = "console";
    this.verified = state.controlRoomSolved;
    this.released = state.documentStorageUnlocked;
    this.cookies.resetReveals();
    this.console.clear();
    this.console.pushTexts("system", CONTROL_ROOM_CONSOLE_BANNER);

    if (this.released) {
      this.phase = "solved";
      this.status = {
        text: "봉쇄 해제 완료. 열람 전용 모드입니다.",
        tone: "success",
      };
      this.console.push({
        level: "success",
        text: "sec.lockdown = released — 문서 보관실 접근이 허용된 상태입니다.",
      });
    } else if (this.verified) {
      this.phase = "browsing";
      this.status = {
        text: "인증은 통과했습니다. 봉쇄 해제를 실행하세요.",
        tone: "warning",
      };
      this.console.push({
        level: "warning",
        text: "인증 완료 · 봉쇄 해제 미완료. lockdown.release() 를 실행하세요.",
      });
    } else {
      this.phase = "browsing";
      this.status = IDLE_STATUS;
    }

    this.options.onEvent?.({ type: "opened", alreadySolved: this.released });
    this.publish();
  }

  /** 단말이 열려 있는지 확인한다. */
  isOpen(): boolean {
    return this.opened;
  }

  /** 현재 스냅숏을 반환한다. */
  getSnapshot(): ControlRoomPuzzleSnapshot {
    return {
      open: this.opened,
      phase: this.phase,
      activeTab: this.activeTab,
      consoleLines: this.console.snapshot(),
      consoleInput: this.consoleInput,
      otpInput: this.otpInput,
      cookies: this.cookies.list(),
      network: this.network,
      failedAttempts: this.failedAttempts,
      remainingAttempts: Math.max(0, this.maxAttempts - this.failedAttempts),
      verified: this.verified,
      released: this.released,
      busy: this.busy,
      statusText: this.status.text,
      statusTone: this.status.tone,
    };
  }

  /** 탭을 직접 선택한다. */
  selectTab(tab: ControlRoomTabId): void {
    if (!this.opened || this.busy || this.activeTab === tab) {
      return;
    }

    this.activeTab = tab;
    this.publish();
  }

  /** 다음 탭으로 순환한다. Tab 키에 대응한다. */
  cycleTab(direction: 1 | -1 = 1): void {
    if (!this.opened || this.busy) {
      return;
    }

    const index = CONTROL_ROOM_TAB_ORDER.indexOf(this.activeTab);
    const length = CONTROL_ROOM_TAB_ORDER.length;
    const next = (index + direction + length) % length;

    this.activeTab = CONTROL_ROOM_TAB_ORDER[next];
    this.publish();
  }

  /**
   * 문자 한 개를 현재 탭의 입력란에 추가한다.
   *
   * 인증 탭은 숫자만 받고 OTP 길이를 넘기지 않는다.
   */
  typeCharacter(character: string): void {
    if (!this.opened || this.busy || this.phase === "solved") {
      return;
    }

    if (character.length !== 1) {
      return;
    }

    if (this.activeTab === "auth") {
      if (!/^\d$/.test(character) || this.otpInput.length >= CONTROL_ROOM_OTP_LENGTH) {
        return;
      }

      this.otpInput += character;
      this.publish();
      return;
    }

    if (this.activeTab !== "console") {
      return;
    }

    if (this.consoleInput.length >= CONTROL_ROOM_MAX_INPUT_LENGTH) {
      return;
    }

    this.consoleInput += character;
    this.publish();
  }

  /** 입력란의 마지막 문자를 지운다. */
  backspace(): void {
    if (!this.opened || this.busy) {
      return;
    }

    if (this.activeTab === "auth" && this.otpInput.length > 0) {
      this.otpInput = this.otpInput.slice(0, -1);
      this.publish();
      return;
    }

    if (this.activeTab === "console" && this.consoleInput.length > 0) {
      this.consoleInput = this.consoleInput.slice(0, -1);
      this.publish();
    }
  }

  /** 현재 탭의 기본 동작(Enter)을 실행한다. */
  async submit(): Promise<void> {
    if (!this.opened || this.busy) {
      return;
    }

    if (this.activeTab === "console") {
      await this.submitConsole();
      return;
    }

    if (this.activeTab === "auth") {
      await this.submitAuthTab();
    }
  }

  /** 단말을 닫는다. 이미 닫혀 있으면 아무 일도 하지 않는다. */
  close(reason: ControlRoomCloseReason = "user"): void {
    if (!this.opened) {
      return;
    }

    this.opened = false;
    this.busy = false;
    this.options.onEvent?.({ type: "closed", reason });
    this.publish();
  }

  /** Room 정리 시 호출한다. 이후 모든 조작을 거부한다. */
  dispose(): void {
    if (this.disposed) {
      return;
    }

    if (this.opened) {
      this.opened = false;
      this.options.onEvent?.({ type: "closed", reason: "disposed" });
    }

    this.disposed = true;
  }

  private async submitConsole(): Promise<void> {
    const input = this.consoleInput.trim();

    this.consoleInput = "";

    if (input.length === 0) {
      this.publish();
      return;
    }

    this.console.push({
      level: "input",
      text: `${VIRTUAL_CONSOLE_PROMPT} ${input}`,
    });

    const execution = executeVirtualCommand(input, {
      cookies: this.cookies,
      network: this.network,
      lockdown: () => ({ verified: this.verified, released: this.released }),
    });

    this.console.push(...execution.lines);

    switch (execution.intent.kind) {
      case "clear":
        this.console.clear();
        break;
      case "close":
        this.publish();
        this.close("user");
        return;
      case "verify-otp":
        await this.processOtp(execution.intent.code, "console");
        return;
      case "release-lockdown":
        await this.runCommit("console-lockdown-release");
        return;
      default:
        break;
    }

    this.publish();
  }

  private async submitAuthTab(): Promise<void> {
    if (this.released) {
      this.status = {
        text: "이미 봉쇄가 해제되어 추가 인증이 필요하지 않습니다.",
        tone: "info",
      };
      this.publish();
      return;
    }

    if (this.verified) {
      await this.runCommit("console-lockdown-release");
      return;
    }

    const code = this.otpInput;
    this.otpInput = "";
    await this.processOtp(code, "auth");
  }

  private async processOtp(
    code: string,
    origin: "console" | "auth",
  ): Promise<void> {
    const verification = verifyControlRoomOtp(code, this.otpConfig);

    if (!verification.ok) {
      if (verification.reason === "shape") {
        this.status = { text: verification.message, tone: "warning" };
        this.console.push({ level: "warning", text: verification.message });
        this.publish();
        return;
      }

      this.failedAttempts += 1;
      const remaining = Math.max(0, this.maxAttempts - this.failedAttempts);

      this.console.push({
        level: "error",
        text: `401 REJECTED — 인증 실패 (남은 시도 ${remaining}회)`,
      });
      this.options.onEvent?.({
        type: "otpRejected",
        attempt: this.failedAttempts,
        remaining,
      });

      if (remaining === 0) {
        this.phase = "locked-out";
        this.status = {
          text: "보안 경보가 작동해 단말이 잠겼습니다. 다시 접속하세요.",
          tone: "error",
        };
        this.console.push({
          level: "error",
          text: "SECURITY ALERT — 단말 세션이 강제 종료됩니다.",
        });
        this.options.onEvent?.({
          type: "lockedOut",
          attempts: this.failedAttempts,
        });
        this.publish();
        this.close("locked-out");
        return;
      }

      this.status = {
        text: `${verification.message} 남은 시도 ${remaining}회.`,
        tone: "error",
      };
      this.publish();
      return;
    }

    this.verified = true;
    this.console.push({
      level: "success",
      text: `200 ACCEPTED — 인증을 통과했습니다. (${origin === "auth" ? "인증 탭" : "콘솔"})`,
    });
    this.options.onEvent?.({
      type: "otpAccepted",
      attempts: this.failedAttempts,
    });

    await this.runCommit("auto-after-solve");
  }

  private async runCommit(
    unlockSource: ControlRoomCommitInput["unlockSource"],
  ): Promise<void> {
    this.busy = true;
    this.phase = "committing";
    this.status = { text: "보안 승인 결과를 반영하는 중입니다…", tone: "info" };
    this.publish();

    let result: ControlRoomCommitResult;

    try {
      result = await this.options.commit({
        failedAttempts: this.failedAttempts,
        unlockSource,
      });
    } catch (error) {
      this.busy = false;
      this.phase = "browsing";
      this.status = {
        text:
          error instanceof Error
            ? error.message
            : "보안 승인 결과를 반영하지 못했습니다.",
        tone: "error",
      };
      this.console.push({ level: "error", text: this.status.text });
      this.publish();
      return;
    }

    this.busy = false;
    this.verified = result.state.controlRoomSolved || this.verified;
    this.released = result.state.documentStorageUnlocked;

    switch (result.outcome) {
      case "completed":
      case "resumed":
      case "already-complete":
        this.phase = "solved";
        this.status = { text: result.message, tone: "success" };
        this.console.push({ level: "success", text: result.message });
        this.publish();
        this.close("solved");
        return;
      case "blocked":
        this.phase = "browsing";
        this.status = { text: result.message, tone: "warning" };
        this.console.push({ level: "warning", text: result.message });
        break;
      default:
        this.phase = "browsing";
        this.status = { text: result.message, tone: "error" };
        this.console.push({ level: "error", text: result.message });
        break;
    }

    this.publish();
  }

  /** 현재 설정 기준 정답 OTP. 테스트 전용이며 화면에는 절대 노출하지 않는다. */
  getExpectedOtpForTesting(): string {
    return deriveControlRoomOtp(this.otpConfig);
  }

  private publish(): void {
    if (!this.disposed) {
      this.options.onChange?.(this.getSnapshot());
    }
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error("정리된 보안 단말은 다시 사용할 수 없습니다.");
    }
  }
}
