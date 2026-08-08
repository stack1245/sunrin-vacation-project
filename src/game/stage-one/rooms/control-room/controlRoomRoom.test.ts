/**
 * E 파트 · 보안 통제실 Room 모듈 테스트
 *
 * Room 계층은 Phaser를 타입으로만 참조하므로, 체이너블 스텁 씬을 주입하면
 * `mount()` 를 포함한 전체 모듈을 Node 환경에서 검증할 수 있다.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type {
  StageOneInteractionDefinition,
  StageOnePortalDefinition,
  StageOneRectangle,
  StageOneRoomMountContext,
} from "../../contracts/room.ts";
import {
  createControlRoomReadyState,
  createFakeProgressPort,
  type FakeProgressPort,
} from "../../puzzles/control-room/testSupport.ts";
import { CONTROL_ROOM_ID, controlRoomRoom } from "./controlRoomRoom.ts";

/** 어떤 메서드를 불러도 자기 자신을 반환하는 체이너블 스텁 게임 오브젝트. */
function createStubGameObject(): Record<string, unknown> {
  const stub: Record<string, unknown> = {};
  const chain = new Proxy(stub, {
    get(target, property) {
      if (property in target) {
        return target[property as string];
      }

      return () => chain;
    },
  });

  return chain as Record<string, unknown>;
}

interface MountRecord {
  interactions: StageOneInteractionDefinition[];
  portals: StageOnePortalDefinition[];
  walls: StageOneRectangle[];
  tracked: number;
  cleanup: (() => void) | null;
}

function mountRoom(port: FakeProgressPort): MountRecord {
  const record: MountRecord = {
    interactions: [],
    portals: [],
    walls: [],
    tracked: 0,
    cleanup: null,
  };
  const stubScene = {
    add: {
      graphics: () => createStubGameObject(),
      rectangle: () => createStubGameObject(),
      text: () => createStubGameObject(),
    },
    input: { keyboard: null },
  };
  const context = {
    scene: stubScene,
    getState: () => port.getState(),
    addWall: (bounds: StageOneRectangle) => {
      record.walls.push(bounds);
    },
    addInteraction: (definition: StageOneInteractionDefinition) => {
      record.interactions.push(definition);
    },
    addPortal: (definition: StageOnePortalDefinition) => {
      record.portals.push(definition);
    },
    track: () => {
      record.tracked += 1;
    },
  } as unknown as StageOneRoomMountContext;

  record.cleanup = controlRoomRoom.mount(context) ?? null;
  return record;
}

test("Room ID와 표시명이 공통 계약과 일치한다", () => {
  assert.equal(controlRoomRoom.id, "control-room");
  assert.equal(CONTROL_ROOM_ID, "control-room");
  assert.equal(controlRoomRoom.displayName, "보안 통제실");
});

test("입구 해금 전에는 진입할 수 없다", () => {
  const locked = createFakeProgressPort().getState();
  const unlocked = createControlRoomReadyState();

  assert.equal(controlRoomRoom.getAccess?.(locked).allowed, false);
  assert.equal(controlRoomRoom.getAccess?.(unlocked).allowed, true);
});

test("목표 문구가 진행 단계마다 달라진다", () => {
  const beforeLab = createControlRoomReadyState({
    scienceLabPuzzleSolved: false,
  });
  const ready = createControlRoomReadyState();
  const partial = createControlRoomReadyState({ controlRoomSolved: true });
  const done = createControlRoomReadyState({
    controlRoomSolved: true,
    documentStorageUnlocked: true,
  });

  const objectives = new Set([
    controlRoomRoom.getObjective(beforeLab),
    controlRoomRoom.getObjective(ready),
    controlRoomRoom.getObjective(partial),
    controlRoomRoom.getObjective(done),
  ]);

  assert.equal(objectives.size, 4, "네 단계의 목표 문구는 서로 달라야 합니다.");
});

test("복도에서 진입하면 전용 스폰 지점을 사용한다", () => {
  const fromHallway = controlRoomRoom.getSpawnPoint?.("hallway");
  const fallback = controlRoomRoom.getSpawnPoint?.(null);

  assert.ok(fromHallway);
  assert.ok(fallback);
  assert.notDeepEqual(fromHallway, fallback);
});

test("mount는 상호작용 3개·복도 출입구 1개·외벽 이상을 등록한다", () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState(),
  });
  const record = mountRoom(port);

  assert.deepEqual(
    record.interactions.map((interaction) => interaction.id).sort(),
    [
      "control-room-lockdown-panel",
      "control-room-notice",
      "control-room-terminal",
    ],
  );
  assert.equal(record.portals.length, 1);
  assert.equal(record.portals[0].targetRoomId, "hallway");
  assert.ok(record.walls.length >= 4, "외벽 4면 이상이 등록되어야 합니다.");
  assert.ok(record.tracked > 0, "장식 오브젝트가 track에 등록되어야 합니다.");
  assert.equal(typeof record.cleanup, "function");

  record.cleanup?.();
});

test("과학 실험실 미완료 상태에서 단말 상호작용은 잠금 안내만 한다", async () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState({ scienceLabPuzzleSolved: false }),
  });
  const record = mountRoom(port);
  const terminal = record.interactions.find(
    (interaction) => interaction.id === "control-room-terminal",
  );
  const messages: string[] = [];

  assert.ok(terminal);
  await terminal.onInteract({
    getState: () => port.getState(),
    updateProgress: (patch, message) => port.updateProgress(patch, message),
    transitionTo: async () => {},
    completeEscape: async () => {},
    acquireModalInputLock: () => () => {},
    showMessage: (text) => {
      messages.push(text);
    },
  });

  assert.equal(port.updates.length, 0);
  assert.equal(messages.length, 1);
  assert.ok(messages[0].includes("과학 실험실"));

  record.cleanup?.();
});

test("단말 세션은 열려 있는 동안 공통 모달 입력 잠금을 유지한다", async () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState(),
  });
  const record = mountRoom(port);
  const terminal = record.interactions.find(
    (interaction) => interaction.id === "control-room-terminal",
  );
  let acquired = 0;
  let released = 0;

  assert.ok(terminal);

  const interaction = terminal.onInteract({
    getState: () => port.getState(),
    updateProgress: (patch, message) => port.updateProgress(patch, message),
    transitionTo: async () => {},
    completeEscape: async () => {},
    acquireModalInputLock: () => {
      acquired += 1;
      return () => {
        released += 1;
      };
    },
    showMessage: () => {},
  });

  assert.equal(acquired, 1);
  assert.equal(released, 0);

  record.cleanup?.();
  await interaction;

  assert.equal(released, 1);
});

test("봉쇄 패널: 부분 완료 상태에서 2단계 커밋을 이어서 수행한다", async () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState({ controlRoomSolved: true }),
  });
  const record = mountRoom(port);
  const panel = record.interactions.find(
    (interaction) => interaction.id === "control-room-lockdown-panel",
  );

  assert.ok(panel);
  await panel.onInteract({
    getState: () => port.getState(),
    updateProgress: (patch, message) => port.updateProgress(patch, message),
    transitionTo: async () => {},
    completeEscape: async () => {},
    acquireModalInputLock: () => () => {},
    showMessage: () => {},
  });

  assert.deepEqual(
    port.updates.map((update) => update.patch),
    [{ documentStorageUnlocked: true }],
  );

  record.cleanup?.();
});

test("봉쇄 패널: 인증 전에는 안내만 하고 완료 후에는 저장하지 않는다", async () => {
  for (const [initial, expectSaves] of [
    [createControlRoomReadyState(), 0],
    [
      createControlRoomReadyState({
        controlRoomSolved: true,
        documentStorageUnlocked: true,
      }),
      0,
    ],
  ] as const) {
    const port = createFakeProgressPort({ initial });
    const record = mountRoom(port);
    const panel = record.interactions.find(
      (interaction) => interaction.id === "control-room-lockdown-panel",
    );
    const messages: string[] = [];

    assert.ok(panel);
    await panel.onInteract({
      getState: () => port.getState(),
      updateProgress: (patch, message) => port.updateProgress(patch, message),
      transitionTo: async () => {},
      completeEscape: async () => {},
      acquireModalInputLock: () => () => {},
      showMessage: (text) => {
        messages.push(text);
      },
    });

    assert.equal(port.updates.length, expectSaves);
    assert.equal(messages.length, 1);

    record.cleanup?.();
  }
});

test("안내판은 저장 없이 수칙을 순환 표시한다", async () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState(),
  });
  const record = mountRoom(port);
  const notice = record.interactions.find(
    (interaction) => interaction.id === "control-room-notice",
  );
  const messages: string[] = [];
  const interactionContext = {
    getState: () => port.getState(),
    updateProgress: (
      patch: Parameters<FakeProgressPort["updateProgress"]>[0],
      message?: string,
    ) => port.updateProgress(patch, message),
    transitionTo: async () => {},
    completeEscape: async () => {},
    acquireModalInputLock: () => () => {},
    showMessage: (text: string) => {
      messages.push(text);
    },
  };

  assert.ok(notice);

  for (let index = 0; index < 4; index += 1) {
    await notice.onInteract(interactionContext);
  }

  assert.equal(port.updates.length, 0);
  assert.equal(messages.length, 4);
  // 3개 수칙이 순환하므로 1번째와 4번째 문구가 같다.
  assert.equal(messages[0], messages[3]);
  assert.notEqual(messages[0], messages[1]);

  record.cleanup?.();
});

test("단말 프롬프트가 진행 상태를 반영한다", () => {
  const port = createFakeProgressPort({
    initial: createControlRoomReadyState(),
  });
  const record = mountRoom(port);
  const terminal = record.interactions.find(
    (interaction) => interaction.id === "control-room-terminal",
  );

  assert.ok(terminal);
  assert.equal(typeof terminal.prompt, "function");

  const promptOf = (
    state: ReturnType<typeof createControlRoomReadyState>,
  ): string =>
    typeof terminal.prompt === "function"
      ? terminal.prompt(state)
      : terminal.prompt;

  assert.ok(
    promptOf(createControlRoomReadyState({ scienceLabPuzzleSolved: false })).includes("잠김"),
  );
  assert.ok(promptOf(createControlRoomReadyState()).includes("접속"));
  assert.ok(
    promptOf(
      createControlRoomReadyState({
        controlRoomSolved: true,
        documentStorageUnlocked: true,
      }),
    ).includes("열람"),
  );

  record.cleanup?.();
});
