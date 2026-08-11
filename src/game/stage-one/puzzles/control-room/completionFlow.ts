/**
 * E 파트 · 보안 통제실 완료 이벤트 커밋 플로우
 *
 * 통제실이 발행하는 두 완료 이벤트를 정의하고, 진행도 저장과의 연결을 한곳에서 책임진다.
 *
 * | 이벤트 | 발행 조건 | 저장 시점 | 저장 플래그 |
 * | --- | --- | --- | --- |
 * | `controlRoomSolved` | OTP 검증 통과 | 검증 성공 직후 (1단계) | `controlRoomSolved: true` |
 * | `documentStorageUnlocked` | `controlRoomSolved` 확정 후 봉쇄 해제 | 1단계 성공 직후 (2단계) | `documentStorageUnlocked: true` |
 *
 * ## 설계 원칙
 *
 * 1. **2단계 분리 커밋** — 한 patch로 두 플래그를 함께 저장하지 않는다.
 *    각 이벤트가 고유한 저장 시점을 갖고, 1단계만 반영된 중간 상태에서도 복구할 수 있다.
 * 2. **멱등성** — 이미 완료된 상태에서 다시 호출하면 저장을 호출하지 않고 `already-complete`
 *    를 반환한다. 1단계만 끝난 상태에서 호출하면 2단계만 수행하고 `resumed` 를 반환한다.
 * 3. **동시 호출 병합** — 진행 중인 커밋이 있으면 같은 Promise를 재사용해 중복 저장을 막는다.
 * 4. **선행 조건 준수** — `scienceLabPuzzleSolved` 가 false면 아무 저장도 시도하지 않고
 *    `blocked` 를 반환한다. 저장 계층(`validateStageOneSaveState`)이 거부할 요청을 미리 막는다.
 * 5. **저장 실패와 게임 실패 분리** — A의 세션은 상태를 먼저 반영하고 저장을 재시도 큐에 넘긴다.
 *    따라서 성공 판정 기준은 "반환된 상태에 플래그가 반영되었는가"이며, 네트워크 실패만으로
 *    통과한 퍼즐을 되돌리지 않는다.
 *
 * Supabase 클라이언트·테이블명·RPC명을 직접 참조하지 않는다. 저장은 주입된 포트를 통해
 * A의 `StageOneInteractionContext` → 세션 → 저장 큐 → `progressBridge` 경로로만 흐른다.
 */

import type { StageOneSaveState } from "../../../../types/stage-one.ts";
import type { StageOneProgressPatch } from "../../contracts/room.ts";

/** `controlRoomSolved` 이벤트 키. */
export const CONTROL_ROOM_SOLVED_EVENT = "controlRoomSolved" as const;

/** `documentStorageUnlocked` 이벤트 키. */
export const DOCUMENT_STORAGE_UNLOCKED_EVENT = "documentStorageUnlocked" as const;

/** 1단계 이벤트 페이로드. */
export interface ControlRoomSolvedPayload {
  readonly event: typeof CONTROL_ROOM_SOLVED_EVENT;
  readonly roomId: "control-room";
  /** 완료를 유발한 행위. 현재는 OTP 검증 하나뿐이다. */
  readonly source: "otp-verification";
  /** 성공까지 소모한 OTP 오답 횟수. 저장되지 않는 통계값이다. */
  readonly failedAttempts: number;
  /** 이 이벤트가 저장한 플래그. */
  readonly savedFlags: readonly ["controlRoomSolved"];
}

/** 2단계 이벤트 페이로드. F 파트(문서 보관실) 해금의 근거가 된다. */
export interface DocumentStorageUnlockedPayload {
  readonly event: typeof DOCUMENT_STORAGE_UNLOCKED_EVENT;
  readonly roomId: "control-room";
  /** 해금 대상 방. F 파트가 소비한다. */
  readonly unlockedRoomId: "document-storage";
  /** 해금을 실행한 경로. 자동 연계와 콘솔 수동 재시도를 구분한다. */
  readonly source: "auto-after-solve" | "console-lockdown-release";
  readonly savedFlags: readonly ["documentStorageUnlocked"];
}

/** 통제실이 발행하는 완료 이벤트 합집합. */
export type ControlRoomCompletionEvent =
  | ControlRoomSolvedPayload
  | DocumentStorageUnlockedPayload;

/** 커밋 결과 분류. */
export type ControlRoomCommitOutcome =
  /** 이번 호출에서 1·2단계를 모두 수행했다. */
  | "completed"
  /** 1단계는 이전에 끝나 있었고 2단계만 이어서 수행했다. */
  | "resumed"
  /** 두 단계가 이미 끝나 있어 저장을 호출하지 않았다. */
  | "already-complete"
  /** 선행 조건 미충족으로 아무 저장도 시도하지 않았다. */
  | "blocked"
  /** 저장 계층이 예외를 던져 상태 반영에 실패했다. */
  | "failed";

/** 커밋 결과. */
export interface ControlRoomCommitResult {
  readonly outcome: ControlRoomCommitOutcome;
  /** 이번 호출에서 실제로 발행한 이벤트. 멱등 호출이면 빈 배열이다. */
  readonly events: readonly ControlRoomCompletionEvent[];
  /** 커밋 종료 시점의 진행 상태. */
  readonly state: StageOneSaveState;
  /** HUD에 표시할 한국어 안내. */
  readonly message: string;
  /** `failed` 일 때만 채워지는 실패 사유. */
  readonly error?: Error;
}

/**
 * 완료 플로우가 사용하는 최소 저장 포트.
 *
 * A의 `StageOneInteractionContext` 가 구조적으로 이 인터페이스를 만족하므로
 * Room에서는 컨텍스트를 그대로 넘기고, 테스트에서는 가짜 포트를 넘긴다.
 */
export interface ControlRoomProgressPort {
  getState(): StageOneSaveState;
  updateProgress(
    patch: StageOneProgressPatch,
    successMessage?: string,
  ): Promise<StageOneSaveState>;
}

/** 커밋 호출 시 함께 전달하는 정보. */
export interface ControlRoomCommitInput {
  /** 성공까지 소모한 OTP 오답 횟수. */
  readonly failedAttempts: number;
  /** 2단계 실행 경로. 자동 연계인지 콘솔 수동 재시도인지 구분한다. */
  readonly unlockSource: DocumentStorageUnlockedPayload["source"];
}

const SOLVED_MESSAGE = "보안 인증을 통과해 통제 권한을 확보했습니다.";
const UNLOCKED_MESSAGE = "문서 보관실 봉쇄가 해제되었습니다.";
const ALREADY_MESSAGE = "이미 문서 보관실 봉쇄가 해제되어 있습니다.";
const BLOCKED_MESSAGE =
  "과학 실험실 실험을 먼저 완료해야 보안 인증을 승인할 수 있습니다.";

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

/**
 * 통제실 완료 이벤트를 순서대로 커밋한다.
 *
 * 인스턴스는 Room 모듈 수명 동안 재사용되며 동시 호출을 스스로 병합한다.
 */
export class ControlRoomCompletionFlow {
  private inFlight: Promise<ControlRoomCommitResult> | null = null;
  private readonly port: ControlRoomProgressPort;
  /** 발행한 이벤트를 관찰할 선택적 리스너. 저장 성공 여부와 무관하게 호출된다. */
  private readonly onEvent?: (event: ControlRoomCompletionEvent) => void;

  constructor(
    port: ControlRoomProgressPort,
    onEvent?: (event: ControlRoomCompletionEvent) => void,
  ) {
    this.port = port;
    this.onEvent = onEvent;
  }

  /**
   * 완료 이벤트를 커밋한다. 중복 호출과 부분 완료 상태를 모두 안전하게 처리한다.
   *
   * 진행 중인 커밋이 있으면 새 저장을 시작하지 않고 그 결과를 함께 기다린다.
   */
  commit(input: ControlRoomCommitInput): Promise<ControlRoomCommitResult> {
    if (this.inFlight) {
      return this.inFlight;
    }

    const pending = this.run(input).finally(() => {
      this.inFlight = null;
    });

    this.inFlight = pending;
    return pending;
  }

  /** 진행 중인 커밋이 있는지 확인한다. */
  isCommitting(): boolean {
    return this.inFlight !== null;
  }

  private async run(
    input: ControlRoomCommitInput,
  ): Promise<ControlRoomCommitResult> {
    const initialState = this.port.getState();

    if (initialState.documentStorageUnlocked) {
      return {
        outcome: "already-complete",
        events: [],
        state: initialState,
        message: ALREADY_MESSAGE,
      };
    }

    if (!initialState.scienceLabPuzzleSolved) {
      return {
        outcome: "blocked",
        events: [],
        state: initialState,
        message: BLOCKED_MESSAGE,
      };
    }

    const events: ControlRoomCompletionEvent[] = [];
    const resuming = initialState.controlRoomSolved;
    let state = initialState;

    if (!resuming) {
      try {
        state = await this.port.updateProgress(
          { controlRoomSolved: true },
          SOLVED_MESSAGE,
        );
      } catch (error) {
        return {
          outcome: "failed",
          events,
          state: this.port.getState(),
          message: "보안 인증 결과를 반영하지 못했습니다.",
          error: toError(error),
        };
      }

      if (!state.controlRoomSolved) {
        return {
          outcome: "failed",
          events,
          state,
          message: "보안 인증 결과가 진행 상태에 반영되지 않았습니다.",
          error: new Error("controlRoomSolved 플래그가 반영되지 않았습니다."),
        };
      }

      const solved: ControlRoomSolvedPayload = {
        event: CONTROL_ROOM_SOLVED_EVENT,
        roomId: "control-room",
        source: "otp-verification",
        failedAttempts: input.failedAttempts,
        savedFlags: ["controlRoomSolved"],
      };
      events.push(solved);
      this.onEvent?.(solved);
    }

    try {
      state = await this.port.updateProgress(
        { documentStorageUnlocked: true },
        UNLOCKED_MESSAGE,
      );
    } catch (error) {
      return {
        outcome: "failed",
        events,
        state: this.port.getState(),
        message:
          "보안 인증은 유지되지만 봉쇄 해제를 반영하지 못했습니다. 단말에서 다시 시도하세요.",
        error: toError(error),
      };
    }

    if (!state.documentStorageUnlocked) {
      return {
        outcome: "failed",
        events,
        state,
        message:
          "보안 인증은 유지되지만 봉쇄 해제가 반영되지 않았습니다. 단말에서 다시 시도하세요.",
        error: new Error("documentStorageUnlocked 플래그가 반영되지 않았습니다."),
      };
    }

    const unlocked: DocumentStorageUnlockedPayload = {
      event: DOCUMENT_STORAGE_UNLOCKED_EVENT,
      roomId: "control-room",
      unlockedRoomId: "document-storage",
      source: input.unlockSource,
      savedFlags: ["documentStorageUnlocked"],
    };
    events.push(unlocked);
    this.onEvent?.(unlocked);

    return {
      outcome: resuming ? "resumed" : "completed",
      events,
      state,
      message: UNLOCKED_MESSAGE,
    };
  }
}
