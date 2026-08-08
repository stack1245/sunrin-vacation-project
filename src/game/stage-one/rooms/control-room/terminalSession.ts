/**
 * E 파트 · 보안 단말 세션
 *
 * 퍼즐 상태 머신(`ControlRoomPuzzle`), 화면 어댑터(`FakeDevtoolsOverlay`),
 * 완료 커밋(`ControlRoomCompletionFlow`) 세 조각을 연결하고 수명을 관리한다.
 *
 * ## 이동 정지 방식
 *
 * A의 `StageOneScene.runInteraction()` 은 `onInteract` 가 반환한 Promise를 기다리는 동안
 * `interactionRunning` 을 유지하며 플레이어 속도를 0으로 고정한다. 따라서 이 세션의
 * `start()` 가 반환하는 Promise를 단말이 닫힐 때까지 미결로 두면, 공통 계약을 바꾸지 않고도
 * 모달 퍼즐 동안 이동·재상호작용이 차단된다. 별도의 입력 잠금 코드를 만들지 않는다.
 *
 * ## 정리
 *
 * 어떤 경로로 끝나든 `finish()` 하나로 모인다. Room의 mount 정리 함수는 `dispose()` 만
 * 호출하면 되고, 오브젝트·키 리스너·미결 Promise가 남지 않는다.
 */

import type Phaser from "phaser";

import type { StageOneInteractionContext } from "../../contracts/room.ts";
import {
  ControlRoomCompletionFlow,
  ControlRoomPuzzle,
  type ControlRoomCompletionEvent,
} from "../../puzzles/control-room/index.ts";
import { FakeDevtoolsOverlay } from "./fakeDevtoolsOverlay.ts";

export class ControlRoomTerminalSession {
  private overlay: FakeDevtoolsOverlay | null = null;
  private puzzle: ControlRoomPuzzle | null = null;
  private resolveActive: (() => void) | null = null;
  private readonly scene: Phaser.Scene;
  /** 완료 이벤트 관찰자. Room이 로그·후속 처리에 사용한다. */
  private readonly onCompletionEvent?: (
    event: ControlRoomCompletionEvent,
  ) => void;

  constructor(
    scene: Phaser.Scene,
    onCompletionEvent?: (event: ControlRoomCompletionEvent) => void,
  ) {
    this.scene = scene;
    this.onCompletionEvent = onCompletionEvent;
  }

  /** 단말이 열려 있는지 확인한다. */
  isActive(): boolean {
    return this.puzzle !== null;
  }

  /**
   * 단말을 열고 닫힐 때까지 기다린다.
   *
   * 이미 열려 있으면 새 세션을 만들지 않고 즉시 반환해 중복 실행을 막는다.
   */
  start(context: StageOneInteractionContext): Promise<void> {
    if (this.puzzle) {
      return Promise.resolve();
    }

    const flow = new ControlRoomCompletionFlow(context, (event) => {
      this.onCompletionEvent?.(event);
    });
    const puzzle = new ControlRoomPuzzle({
      commit: (input) => flow.commit(input),
      onChange: (snapshot) => {
        this.overlay?.render(snapshot);
      },
      onEvent: (event) => {
        if (event.type === "closed") {
          this.finish();
        }
      },
    });
    const overlay = new FakeDevtoolsOverlay(this.scene, {
      onType: (character) => puzzle.typeCharacter(character),
      onBackspace: () => puzzle.backspace(),
      onSubmit: () => {
        void puzzle.submit();
      },
      onCycleTab: (direction) => puzzle.cycleTab(direction),
      onRequestClose: () => puzzle.close("user"),
    });

    this.puzzle = puzzle;
    this.overlay = overlay;

    puzzle.open(context.getState());
    overlay.open(puzzle.getSnapshot());

    return new Promise<void>((resolve) => {
      this.resolveActive = resolve;
    });
  }

  /** Room 정리 시 호출한다. 열려 있던 단말을 강제로 닫고 대기 중 Promise를 해제한다. */
  dispose(): void {
    const puzzle = this.puzzle;

    if (puzzle) {
      // dispose()는 열려 있으면 closed 이벤트를 발행하고, 그 리스너가 finish()를 부른다.
      puzzle.dispose();
    }

    this.finish();
  }

  /** 오브젝트·리스너를 해제하고 대기 중이던 상호작용을 완료 처리한다. */
  private finish(): void {
    this.overlay?.destroy();
    this.overlay = null;
    this.puzzle = null;

    const resolve = this.resolveActive;
    this.resolveActive = null;
    resolve?.();
  }
}
