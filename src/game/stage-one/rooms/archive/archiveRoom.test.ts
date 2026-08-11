import assert from "node:assert/strict";
import test from "node:test";

import type Phaser from "phaser";

import {
  createDefaultStageOneSaveState,
  type StageOneSaveState,
} from "../../../../types/stage-one.ts";
import type {
  StageOneInteractionContext,
  StageOneInteractionDefinition,
  StageOnePortalDefinition,
  StageOneProgressPatch,
  StageOneRoomMountContext,
} from "../../contracts/room.ts";
import { createArchiveRoom } from "./archiveRoom.ts";

interface FakeText {
  value: string;
  setText(value: string): FakeText;
  setOrigin(value: number): FakeText;
}

function createFakeText(initialValue: string): FakeText {
  const fakeText: FakeText = {
    value: initialValue,
    setText(value) {
      fakeText.value = value;
      return fakeText;
    },
    setOrigin() {
      return fakeText;
    },
  };

  return fakeText;
}

function mountArchive(initialState: StageOneSaveState) {
  let state = initialState;
  let keyHandler: ((event: KeyboardEvent) => void) | null = null;
  let inputLockCount = 0;
  let inputReleaseCount = 0;
  const interactions = new Map<string, StageOneInteractionDefinition>();
  const portals: StageOnePortalDefinition[] = [];
  const patches: StageOneProgressPatch[] = [];
  const messages: string[] = [];

  const scene = {
    add: {
      text(_x: number, _y: number, value: string) {
        return createFakeText(value);
      },
    },
    input: {
      keyboard: {
        on(
          eventName: string,
          handler: (event: KeyboardEvent) => void,
        ): void {
          assert.equal(eventName, "keydown");
          keyHandler = handler;
        },
        off(
          eventName: string,
          handler: (event: KeyboardEvent) => void,
        ): void {
          assert.equal(eventName, "keydown");
          if (keyHandler === handler) {
            keyHandler = null;
          }
        },
      },
    },
  } as unknown as Phaser.Scene;

  const mountContext: StageOneRoomMountContext = {
    scene,
    getState: () => state,
    addWall: () => undefined,
    addInteraction: (definition) => {
      interactions.set(definition.id, definition);
    },
    addPortal: (definition) => {
      portals.push(definition);
    },
    track: () => undefined,
  };

  const interactionContext: StageOneInteractionContext = {
    getState: () => state,
    async updateProgress(patch) {
      patches.push(patch);
      state = { ...state, ...patch };
      return state;
    },
    async transitionTo() {
      return undefined;
    },
    async completeEscape() {
      return undefined;
    },
    acquireModalInputLock() {
      inputLockCount += 1;
      let released = false;

      return () => {
        if (!released) {
          released = true;
          inputReleaseCount += 1;
        }
      };
    },
    showMessage(message) {
      messages.push(message);
    },
  };

  const room = createArchiveRoom();
  room.mount(mountContext);

  return {
    room,
    interactions,
    portals,
    patches,
    messages,
    interactionContext,
    getState: () => state,
    getInputLockCount: () => inputLockCount,
    getInputReleaseCount: () => inputReleaseCount,
    submitText(value: string) {
      const activeHandler = keyHandler;
      assert.ok(activeHandler, "키보드 입력 핸들러가 등록되어야 합니다.");

      for (const character of value) {
        activeHandler({ key: character } as KeyboardEvent);
      }
      activeHandler({ key: "Enter" } as KeyboardEvent);
    },
  };
}

test("id와 displayName이 자료실을 가리킨다", () => {
  const room = createArchiveRoom();
  assert.equal(room.id, "archive");
  assert.equal(room.displayName, "연구 자료실");
});

test("입구가 해제되지 않으면 접근할 수 없다", () => {
  const room = createArchiveRoom();
  const lockedState = createDefaultStageOneSaveState();

  assert.equal(room.getAccess?.(lockedState).allowed, false);
});

test("입구가 해제되면 접근할 수 있다", () => {
  const room = createArchiveRoom();
  const unlockedState = {
    ...createDefaultStageOneSaveState(),
    hasKeycard: true,
    entranceUnlocked: true,
  };

  assert.equal(room.getAccess?.(unlockedState).allowed, true);
});

test("자료실 단서를 아직 못 찾았으면 카이사르 해독 목표를 안내한다", () => {
  const room = createArchiveRoom();
  const state = {
    ...createDefaultStageOneSaveState(),
    entranceUnlocked: true,
  };

  assert.match(room.getObjective(state), /카이사르/);
});

test("자료실 단서를 찾았으면 중앙 복도로 복귀를 안내한다", () => {
  const room = createArchiveRoom();
  const state = {
    ...createDefaultStageOneSaveState(),
    entranceUnlocked: true,
    archiveClueFound: true,
  };

  assert.match(room.getObjective(state), /중앙 복도/);
});

test("중앙 복도에서 진입하면 출구와 떨어진 스폰 지점을 사용한다", () => {
  const room = createArchiveRoom();
  const spawn = room.getSpawnPoint?.("hallway");

  assert.deepEqual(spawn, { x: 220, y: 270 });
});

test("복도 외 경로로 진입하면 기본 스폰 지점을 사용한다", () => {
  const room = createArchiveRoom();
  const spawn = room.getSpawnPoint?.(null);

  assert.deepEqual(spawn, { x: 480, y: 270 });
});

test("복도 출구는 참조 Room 계약 좌표를 유지한다", () => {
  const mounted = mountArchive({
    ...createDefaultStageOneSaveState(),
    hasKeycard: true,
    entranceUnlocked: true,
    currentRoom: "archive",
  });

  assert.deepEqual(mounted.portals, [
    {
      id: "archive-to-hallway",
      targetRoomId: "hallway",
      position: { x: 110, y: 270 },
    },
  ]);
});

test("카이사르와 비즈네르를 순서대로 풀면 단서를 표시하고 완료 상태를 저장한다", async () => {
  const mounted = mountArchive({
    ...createDefaultStageOneSaveState(),
    hasKeycard: true,
    entranceUnlocked: true,
    currentRoom: "archive",
  });
  const caesar = mounted.interactions.get("archive-caesar-terminal");
  const vigenere = mounted.interactions.get("archive-vigenere-terminal");

  assert.ok(caesar);
  assert.ok(vigenere);

  const caesarPending = Promise.resolve(
    caesar.onInteract(mounted.interactionContext),
  );
  mounted.submitText("access granted");
  await caesarPending;

  const vigenerePending = Promise.resolve(
    vigenere.onInteract(mounted.interactionContext),
  );
  mounted.submitText("symbol order five");
  await vigenerePending;

  assert.deepEqual(mounted.patches, [{ archiveClueFound: true }]);
  assert.equal(mounted.getState().archiveClueFound, true);
  assert.equal(mounted.getInputLockCount(), 2);
  assert.equal(mounted.getInputReleaseCount(), 2);
  assert.ok(
    mounted.messages.some((message) =>
      message.includes("화학 기호 → 용액 밀도 → 산소 공급 → 점화 → 가열"),
    ),
  );
  assert.ok(
    mounted.messages.some((message) => message.includes("% → $ → # → @ → !")),
  );
});

test("완료 상태로 재입장하면 저장 없이 두 후속 단서를 다시 보여준다", async () => {
  const mounted = mountArchive({
    ...createDefaultStageOneSaveState(),
    hasKeycard: true,
    entranceUnlocked: true,
    currentRoom: "archive",
    archiveClueFound: true,
  });
  const vigenere = mounted.interactions.get("archive-vigenere-terminal");

  assert.ok(vigenere);
  await vigenere.onInteract(mounted.interactionContext);

  assert.equal(mounted.patches.length, 0);
  assert.equal(mounted.getInputLockCount(), 0);
  assert.ok(
    mounted.messages.some((message) =>
      message.includes("화학 기호 → 용액 밀도 → 산소 공급 → 점화 → 가열"),
    ),
  );
  assert.ok(
    mounted.messages.some((message) => message.includes("% → $ → # → @ → !")),
  );
});
