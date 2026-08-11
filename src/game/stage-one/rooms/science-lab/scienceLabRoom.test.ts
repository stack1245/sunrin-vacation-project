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
import {
  SCIENCE_LAB_STEP_DEFINITIONS,
  type ScienceLabStep,
  type ScienceLabStepRequester,
} from "../../puzzles/science-lab/index.ts";
import { createScienceLabRoom } from "./scienceLabRoom.ts";

const CORRECT_ANSWERS: Readonly<Record<ScienceLabStep, string>> = {
  symbol: "H2O",
  density: "1.0",
  oxygen: "21",
  ignition: "ON",
  heating: "HEAT",
};

interface FakeText {
  value: string;
  setText(value: string): FakeText;
  setOrigin(value: number): FakeText;
  setDepth(value: number): FakeText;
}

interface FakeRectangle {
  setFillStyle(color: number, alpha?: number): FakeRectangle;
  setStrokeStyle(
    lineWidth: number,
    color: number,
    alpha?: number,
  ): FakeRectangle;
  setDepth(value: number): FakeRectangle;
}

interface FakeGraphics {
  fillStyle(color: number, alpha?: number): FakeGraphics;
  fillRect(x: number, y: number, width: number, height: number): FakeGraphics;
  lineStyle(lineWidth: number, color: number, alpha?: number): FakeGraphics;
  lineBetween(x1: number, y1: number, x2: number, y2: number): FakeGraphics;
  setDepth(value: number): FakeGraphics;
}

function createFakeText(initialValue: string): FakeText {
  const text: FakeText = {
    value: initialValue,
    setText(value) {
      text.value = value;
      return text;
    },
    setOrigin() {
      return text;
    },
    setDepth() {
      return text;
    },
  };

  return text;
}

function createFakeRectangle(): FakeRectangle {
  const rectangle: FakeRectangle = {
    setFillStyle() {
      return rectangle;
    },
    setStrokeStyle() {
      return rectangle;
    },
    setDepth() {
      return rectangle;
    },
  };

  return rectangle;
}

function createFakeGraphics(): FakeGraphics {
  const graphics: FakeGraphics = {
    fillStyle() {
      return graphics;
    },
    fillRect() {
      return graphics;
    },
    lineStyle() {
      return graphics;
    },
    lineBetween() {
      return graphics;
    },
    setDepth() {
      return graphics;
    },
  };

  return graphics;
}

function createReadyScienceLabState(
  overrides: Partial<StageOneSaveState> = {},
): StageOneSaveState {
  return {
    ...createDefaultStageOneSaveState(),
    currentRoom: "science-lab",
    hasKeycard: true,
    entranceUnlocked: true,
    archiveClueFound: true,
    ...overrides,
  };
}

function mountScienceLab({
  initialState = createReadyScienceLabState(),
  requestStep,
  heatingResult = true,
}: {
  initialState?: StageOneSaveState;
  requestStep?: ScienceLabStepRequester;
  heatingResult?: boolean;
} = {}) {
  let state = initialState;
  let inputLockCount = 0;
  let inputReleaseCount = 0;
  let heatingCount = 0;
  const requestedSteps: ScienceLabStep[] = [];
  const interactions = new Map<string, StageOneInteractionDefinition>();
  const portals: StageOnePortalDefinition[] = [];
  const patches: StageOneProgressPatch[] = [];
  const messages: string[] = [];

  const defaultRequester: ScienceLabStepRequester = async (request) => {
    requestedSteps.push(request.step);
    const result = request.submit(CORRECT_ANSWERS[request.step]);
    assert.equal(result.outcome, "accepted");

    if (result.outcome !== "accepted") {
      return { status: "cancelled" };
    }

    return { status: "accepted", result };
  };

  const scene = {
    add: {
      graphics: () => createFakeGraphics(),
      rectangle: () => createFakeRectangle(),
      text: (_x: number, _y: number, value: string) => createFakeText(value),
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

  const room = createScienceLabRoom({
    requestStep: requestStep ?? defaultRequester,
    playHeatingSequence: async () => {
      heatingCount += 1;
      return heatingResult;
    },
  });
  const cleanup = room.mount(mountContext);

  return {
    room,
    interactions,
    portals,
    patches,
    messages,
    requestedSteps,
    interactionContext,
    cleanup,
    getState: () => state,
    getInputLockCount: () => inputLockCount,
    getInputReleaseCount: () => inputReleaseCount,
    getHeatingCount: () => heatingCount,
  };
}

test("자료실 단서가 있어야 과학 실험실에 진입할 수 있다", () => {
  const room = createScienceLabRoom();
  const locked = createDefaultStageOneSaveState();
  const entranceOnly = {
    ...locked,
    hasKeycard: true,
    entranceUnlocked: true,
  };
  const ready = { ...entranceOnly, archiveClueFound: true };

  assert.equal(room.getAccess(locked).allowed, false);
  assert.equal(room.getAccess(entranceOnly).allowed, false);
  assert.equal(room.getAccess(ready).allowed, true);
});

test("중앙 복도 진입 스폰과 복귀 포털을 안전하게 분리한다", () => {
  const mounted = mountScienceLab();

  assert.deepEqual(mounted.room.getSpawnPoint("hallway"), { x: 220, y: 270 });
  assert.deepEqual(mounted.portals, [
    {
      id: "science-lab-to-hallway",
      targetRoomId: "hallway",
      position: { x: 110, y: 270 },
    },
  ]);
});

test("현재 순서가 아닌 장치는 모달을 열지 않고 경고한다", async () => {
  const mounted = mountScienceLab();
  const oxygen = mounted.interactions.get("science-lab-step-oxygen");

  assert.ok(oxygen);
  await oxygen.onInteract(mounted.interactionContext);

  assert.deepEqual(mounted.requestedSteps, []);
  assert.equal(mounted.getInputLockCount(), 0);
  assert.ok(mounted.messages.some((message) => message.includes("먼저 조작")));
});

test("모달 취소 시 입력 잠금을 해제하고 현재 단계를 유지한다", async () => {
  const mounted = mountScienceLab({
    requestStep: async () => ({ status: "cancelled" }),
  });
  const symbol = mounted.interactions.get("science-lab-step-symbol");

  assert.ok(symbol);
  await symbol.onInteract(mounted.interactionContext);

  assert.equal(mounted.getInputLockCount(), 1);
  assert.equal(mounted.getInputReleaseCount(), 1);
  assert.match(mounted.room.getObjective(mounted.getState()), /화학 기호/);
  assert.deepEqual(mounted.patches, []);
});

test("다섯 장치를 순서대로 승인한 뒤에만 완료 상태를 저장한다", async () => {
  const mounted = mountScienceLab();

  for (const step of Object.keys(SCIENCE_LAB_STEP_DEFINITIONS) as ScienceLabStep[]) {
    const interaction = mounted.interactions.get(`science-lab-step-${step}`);
    assert.ok(interaction);
    await interaction.onInteract(mounted.interactionContext);
  }

  assert.deepEqual(mounted.requestedSteps, [
    "symbol",
    "density",
    "oxygen",
    "ignition",
    "heating",
  ]);
  assert.equal(mounted.getInputLockCount(), 5);
  assert.equal(mounted.getInputReleaseCount(), 5);
  assert.equal(mounted.getHeatingCount(), 1);
  assert.deepEqual(mounted.patches, [{ scienceLabPuzzleSolved: true }]);
  assert.equal(mounted.getState().scienceLabPuzzleSolved, true);
  assert.match(mounted.room.getObjective(mounted.getState()), /보안 통제실/);
});

test("가열 연출이 중단되면 완료 플래그를 저장하지 않는다", async () => {
  const mounted = mountScienceLab({ heatingResult: false });

  for (const step of Object.keys(SCIENCE_LAB_STEP_DEFINITIONS) as ScienceLabStep[]) {
    const interaction = mounted.interactions.get(`science-lab-step-${step}`);
    assert.ok(interaction);
    await interaction.onInteract(mounted.interactionContext);
  }

  assert.equal(mounted.getHeatingCount(), 1);
  assert.deepEqual(mounted.patches, []);
  assert.equal(mounted.getState().scienceLabPuzzleSolved, false);
});

test("완료 상태 재입장에서는 저장 없이 승인 코드를 다시 확인한다", async () => {
  const mounted = mountScienceLab({
    initialState: createReadyScienceLabState({
      scienceLabPuzzleSolved: true,
    }),
    requestStep: async () => {
      throw new Error("완료 재입장에서 퍼즐 모달을 열면 안 됩니다.");
    },
  });
  const terminal = mounted.interactions.get("science-lab-security-terminal");

  assert.ok(terminal);
  assert.equal(terminal.enabled?.(mounted.getState()), true);
  await terminal.onInteract(mounted.interactionContext);

  assert.deepEqual(mounted.patches, []);
  assert.ok(mounted.messages.some((message) => message.includes("SEC-8042-CTRL")));
  assert.match(mounted.room.getObjective(mounted.getState()), /보안 통제실/);
});
