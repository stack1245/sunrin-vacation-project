/**
 * E 파트 · 진행도 포트 테스트 대역
 *
 * A의 실제 `validateStageOneSaveState` 를 그대로 사용해 저장 계약(선행 조건, 회귀 금지)을
 * 테스트에서도 진짜로 강제한다. 덕분에 통제실 코드가 잘못된 patch를 보내면 테스트가 깨진다.
 *
 * A의 `StageOneScene.updateProgress()` 동작을 모사한다.
 *
 * - 검증 통과: 상태를 갱신하고 저장을 시도한다.
 * - 저장 실패(`saveMode: "swallow"`): 상태는 반영된 채 갱신된 상태를 반환한다.
 *   (네트워크 실패만으로 성공한 퍼즐을 되돌리지 않는 공통 규칙)
 * - 검증 실패: 상태를 바꾸지 않고 갱신 전 상태를 반환하거나 예외를 던진다.
 *
 * 테스트 전용 파일이며 게임 코드에서 import하지 않는다.
 */

import {
  createDefaultStageOneSaveState,
  validateStageOneSaveState,
  type StageOneSaveState,
} from "../../../../types/stage-one.ts";
import type { StageOneProgressPatch } from "../../contracts/room.ts";
import type { ControlRoomProgressPort } from "./completionFlow.ts";

/** 기록된 저장 호출 한 건. */
export interface RecordedUpdate {
  readonly patch: StageOneProgressPatch;
  readonly successMessage?: string;
}

export interface FakeProgressPortOptions {
  /** 초기 상태에 덮어쓸 플래그. */
  readonly initial?: Partial<StageOneSaveState>;
  /**
   * 저장 실패를 유발할 플래그. 해당 patch에서 지정한 방식으로 실패한다.
   *
   * - `"throw"`: 포트가 예외를 던진다 (세션 계층 실패).
   * - `"reject-silently"`: 예외 없이 상태 미반영 상태를 반환한다 (씬이 삼킨 검증 실패).
   * - `"swallow"`: 상태는 반영하고 저장만 실패한다 (재시도 큐로 넘어간 상황).
   */
  readonly failOn?: {
    readonly flag: keyof StageOneProgressPatch;
    readonly mode: "throw" | "reject-silently" | "swallow";
  };
}

export interface FakeProgressPort extends ControlRoomProgressPort {
  /** 지금까지 기록된 저장 호출. */
  readonly updates: readonly RecordedUpdate[];
  /** 현재 상태를 직접 교체한다. 시나리오 준비용이다. */
  setState(patch: Partial<StageOneSaveState>): void;
}

/** 통제실 퍼즐이 정상 진행할 수 있는 최소 선행 상태. */
export function createControlRoomReadyState(
  overrides: Partial<StageOneSaveState> = {},
): StageOneSaveState {
  return validateStageOneSaveState({
    ...createDefaultStageOneSaveState(),
    currentRoom: "control-room",
    hasKeycard: true,
    entranceUnlocked: true,
    archiveClueFound: true,
    scienceLabPuzzleSolved: true,
    ...overrides,
  });
}

/** 저장 포트 테스트 대역을 만든다. */
export function createFakeProgressPort(
  options: FakeProgressPortOptions = {},
): FakeProgressPort {
  const updates: RecordedUpdate[] = [];
  let state = validateStageOneSaveState({
    ...createDefaultStageOneSaveState(),
    ...options.initial,
  });

  return {
    updates,

    getState() {
      return { ...state };
    },

    setState(patch) {
      state = validateStageOneSaveState({ ...state, ...patch });
    },

    async updateProgress(patch, successMessage) {
      updates.push({ patch, successMessage });

      const failure = options.failOn;
      const targeted =
        failure !== undefined &&
        Object.prototype.hasOwnProperty.call(patch, failure.flag);

      if (targeted && failure.mode === "throw") {
        throw new Error(`저장에 실패했습니다: ${String(failure.flag)}`);
      }

      if (targeted && failure.mode === "reject-silently") {
        // 씬이 검증 예외를 삼킨 상황. 상태가 반영되지 않은 채 반환된다.
        return { ...state };
      }

      state = validateStageOneSaveState({ ...state, ...patch });
      return { ...state };
    },
  };
}
