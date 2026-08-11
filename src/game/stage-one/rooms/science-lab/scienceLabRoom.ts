import type Phaser from "phaser";

import type { StageOneSaveState } from "@/types/stage-one";
import type {
  StageOneInteractionContext,
  StageOneRoomAccess,
  StageOneRoomModule,
  StageOneRoomMountContext,
} from "../../contracts/room.ts";
import {
  requestScienceLabStep,
  SCIENCE_LAB_SECURITY_CODE,
  SCIENCE_LAB_STEP_DEFINITIONS,
  SCIENCE_LAB_STEPS,
  ScienceLabPuzzle,
  type ScienceLabStep,
  type ScienceLabStepRequester,
} from "../../puzzles/science-lab/index.ts";

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 540;
const SCIENCE_LAB_EXIT_POSITION = { x: 110, y: 270 };
const SCIENCE_LAB_SPAWN_FROM_HALLWAY = { x: 220, y: 270 };
const SCIENCE_LAB_DEFAULT_SPAWN = { x: 480, y: 270 };
const SCIENCE_LAB_SEQUENCE_TEXT =
  "화학 기호 → 용액 밀도 → 산소 공급 → 점화 → 가열";

interface ScienceLabDevicePosition {
  readonly x: number;
  readonly y: number;
}

const SCIENCE_LAB_DEVICE_POSITIONS: Readonly<
  Record<ScienceLabStep, ScienceLabDevicePosition>
> = {
  symbol: { x: 260, y: 205 },
  density: { x: 480, y: 205 },
  oxygen: { x: 700, y: 205 },
  ignition: { x: 370, y: 365 },
  heating: { x: 590, y: 365 },
};

interface ScienceLabRoomOptions {
  readonly requestStep?: ScienceLabStepRequester;
  readonly playHeatingSequence?: (scene: Phaser.Scene) => Promise<boolean>;
}

function getScienceLabAccess(state: StageOneSaveState): StageOneRoomAccess {
  if (!state.entranceUnlocked) {
    return {
      allowed: false,
      reason: "입구 잠금장치를 먼저 해제하세요.",
    };
  }

  if (!state.archiveClueFound) {
    return {
      allowed: false,
      reason: "연구 자료실에서 실험 장치 순서 단서를 먼저 확보하세요.",
    };
  }

  return { allowed: true };
}

function playDefaultHeatingSequence(scene: Phaser.Scene): Promise<boolean> {
  scene.cameras.main.flash(420, 183, 216, 193, false);
  scene.cameras.main.shake(1_200, 0.008);

  return new Promise((resolve) => {
    scene.time.delayedCall(1_500, () => resolve(true));
  });
}

function addScienceLabBase(context: StageOneRoomMountContext): void {
  const { scene } = context;
  const floor = scene.add.graphics();

  floor.fillStyle(0x050b10, 1);
  floor.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  floor.lineStyle(1, 0x223341, 0.65);

  for (let x = 0; x <= WORLD_WIDTH; x += 48) {
    floor.lineBetween(x, 0, x, WORLD_HEIGHT);
  }

  for (let y = 0; y <= WORLD_HEIGHT; y += 48) {
    floor.lineBetween(0, y, WORLD_WIDTH, y);
  }

  floor.setDepth(-20);
  context.track(floor);

  context.addWall(
    { x: WORLD_WIDTH / 2, y: 16, width: WORLD_WIDTH, height: 32 },
    0x0b1823,
  );
  context.addWall(
    {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT - 16,
      width: WORLD_WIDTH,
      height: 32,
    },
    0x0b1823,
  );
  context.addWall(
    { x: 16, y: WORLD_HEIGHT / 2, width: 32, height: WORLD_HEIGHT },
    0x0b1823,
  );
  context.addWall(
    {
      x: WORLD_WIDTH - 16,
      y: WORLD_HEIGHT / 2,
      width: 32,
      height: WORLD_HEIGHT,
    },
    0x0b1823,
  );
}

export class ScienceLabRoomModule implements StageOneRoomModule {
  readonly id = "science-lab" as const;
  readonly displayName = "과학 실험실";

  private readonly puzzle = new ScienceLabPuzzle();
  private readonly requestStep: ScienceLabStepRequester;
  private readonly playHeatingSequence: (
    scene: Phaser.Scene,
  ) => Promise<boolean>;

  constructor(options: ScienceLabRoomOptions = {}) {
    this.requestStep = options.requestStep ?? requestScienceLabStep;
    this.playHeatingSequence =
      options.playHeatingSequence ?? playDefaultHeatingSequence;
  }

  getAccess(state: StageOneSaveState): StageOneRoomAccess {
    return getScienceLabAccess(state);
  }

  getSpawnPoint(fromRoomId: StageOneRoomModule["id"] | null) {
    return fromRoomId === "hallway"
      ? { ...SCIENCE_LAB_SPAWN_FROM_HALLWAY }
      : { ...SCIENCE_LAB_DEFAULT_SPAWN };
  }

  getObjective(state: StageOneSaveState): string {
    if (state.scienceLabPuzzleSolved) {
      return "실험동 승인 코드를 확인하고 보안 통제실로 이동하세요.";
    }

    const currentStep = this.puzzle.getSnapshot().currentStep;

    if (!currentStep) {
      return "가열 반응이 끝날 때까지 장치에서 떨어져 기다리세요.";
    }

    const definition = SCIENCE_LAB_STEP_DEFINITIONS[currentStep];
    return `${definition.order}단계: ${definition.title} 장치를 조작하세요.`;
  }

  mount(context: StageOneRoomMountContext): () => void {
    const { scene } = context;
    const completedOnEntry = context.getState().scienceLabPuzzleSolved;
    let mounted = true;
    let heatingInProgress = false;

    this.puzzle.reset(completedOnEntry);
    addScienceLabBase(context);

    context.addPortal({
      id: "science-lab-to-hallway",
      targetRoomId: "hallway",
      position: { ...SCIENCE_LAB_EXIT_POSITION },
    });

    const title = scene.add
      .text(48, 38, "과학 실험실 · 순차 안전 제어", {
        color: "#eef3f5",
        fontFamily: "Pretendard, Noto Sans KR, sans-serif",
        fontSize: "26px",
        fontStyle: "bold",
      })
      .setDepth(-5);
    const sequenceBoard = scene.add
      .text(480, 82, SCIENCE_LAB_SEQUENCE_TEXT, {
        align: "center",
        color: "#b7d8c1",
        fontFamily: "Pretendard, Noto Sans KR, sans-serif",
        fontSize: "15px",
      })
      .setOrigin(0.5)
      .setDepth(-5);
    const statusText = scene.add
      .text(
        480,
        470,
        completedOnEntry
          ? "실험 완료 · 장치가 안전 정지 상태입니다."
          : "연구 자료실의 순서대로 장치를 작동시키세요.",
        {
          align: "center",
          color: "#d4dde1",
          fontFamily: "Pretendard, Noto Sans KR, sans-serif",
          fontSize: "15px",
        },
      )
      .setOrigin(0.5)
      .setDepth(12);
    const securityCodeText = scene.add
      .text(
        480,
        503,
        completedOnEntry
          ? `실험동 승인 코드 · ${SCIENCE_LAB_SECURITY_CODE}`
          : "",
        {
          align: "center",
          color: "#f0cf72",
          fontFamily: "Consolas, monospace",
          fontSize: "17px",
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5)
      .setDepth(12);
    context.track(title);
    context.track(sequenceBoard);
    context.track(statusText);
    context.track(securityCodeText);

    const devicePanels = new Map<
      ScienceLabStep,
      Phaser.GameObjects.Rectangle
    >();
    const deviceStates = new Map<ScienceLabStep, Phaser.GameObjects.Text>();

    for (const step of SCIENCE_LAB_STEPS) {
      const definition = SCIENCE_LAB_STEP_DEFINITIONS[step];
      const position = SCIENCE_LAB_DEVICE_POSITIONS[step];
      const panel = scene.add
        .rectangle(position.x, position.y, 158, 92, 0x0b1823, 1)
        .setStrokeStyle(2, 0x4a5f6d, 0.9)
        .setDepth(7);
      const label = scene.add
        .text(position.x, position.y - 8, definition.title, {
          align: "center",
          color: "#d4dde1",
          fontFamily: "Pretendard, Noto Sans KR, sans-serif",
          fontSize: "14px",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(8);
      const stateLabel = scene.add
        .text(position.x, position.y + 22, "순서 대기", {
          align: "center",
          color: "#6f838f",
          fontFamily: "Pretendard, Noto Sans KR, sans-serif",
          fontSize: "12px",
        })
        .setOrigin(0.5)
        .setDepth(8);

      devicePanels.set(step, panel);
      deviceStates.set(step, stateLabel);
      context.track(panel);
      context.track(label);
      context.track(stateLabel);
    }

    const updateDeviceStates = () => {
      const snapshot = this.puzzle.getSnapshot();

      for (const step of SCIENCE_LAB_STEPS) {
        const panel = devicePanels.get(step);
        const stateLabel = deviceStates.get(step);

        if (!panel || !stateLabel) {
          continue;
        }

        if (snapshot.completedSteps.includes(step)) {
          panel.setFillStyle(0x14261f, 1).setStrokeStyle(2, 0x5dbd8b, 1);
          stateLabel.setText("완료");
        } else if (snapshot.currentStep === step) {
          panel.setFillStyle(0x132635, 1).setStrokeStyle(2, 0xb7d8c1, 1);
          stateLabel.setText("조작 가능");
        } else {
          panel.setFillStyle(0x071018, 1).setStrokeStyle(2, 0x223341, 0.9);
          stateLabel.setText("순서 대기");
        }
      }
    };

    updateDeviceStates();

    for (const step of SCIENCE_LAB_STEPS) {
      const definition = SCIENCE_LAB_STEP_DEFINITIONS[step];
      const position = SCIENCE_LAB_DEVICE_POSITIONS[step];

      context.addInteraction({
        id: `science-lab-step-${step}`,
        position: { ...position },
        radius: 88,
        enabled: (state) =>
          !state.scienceLabPuzzleSolved && !heatingInProgress,
        prompt: () => {
          const snapshot = this.puzzle.getSnapshot();

          if (snapshot.completedSteps.includes(step)) {
            return `${definition.order}. ${definition.shortLabel} · 완료`;
          }

          return snapshot.currentStep === step
            ? `E · [${definition.order}/5] ${definition.title}`
            : `${definition.order}. ${definition.shortLabel} · 순서 대기`;
        },
        onInteract: (interaction) =>
          this.runDeviceInteraction({
            context: interaction,
            scene,
            step,
            statusText,
            securityCodeText,
            updateDeviceStates,
            isMounted: () => mounted,
            setHeatingInProgress: (value) => {
              heatingInProgress = value;
            },
          }),
      });
    }

    context.addInteraction({
      id: "science-lab-protocol-board",
      position: { x: 480, y: 82 },
      radius: 95,
      prompt: "E · 확보한 실험 순서 다시 확인",
      onInteract(interaction) {
        interaction.showMessage(
          `연구 자료실 단서 · ${SCIENCE_LAB_SEQUENCE_TEXT}`,
          "info",
        );
      },
    });

    context.addInteraction({
      id: "science-lab-security-terminal",
      position: { x: 800, y: 455 },
      radius: 85,
      enabled: (state) => state.scienceLabPuzzleSolved,
      prompt: "E · 실험동 승인 코드 다시 확인",
      onInteract(interaction) {
        interaction.showMessage(
          `실험동 승인 코드: ${SCIENCE_LAB_SECURITY_CODE}`,
          "success",
        );
      },
    });

    return () => {
      mounted = false;
    };
  }

  private async runDeviceInteraction({
    context,
    scene,
    step,
    statusText,
    securityCodeText,
    updateDeviceStates,
    isMounted,
    setHeatingInProgress,
  }: {
    context: StageOneInteractionContext;
    scene: Phaser.Scene;
    step: ScienceLabStep;
    statusText: Phaser.GameObjects.Text;
    securityCodeText: Phaser.GameObjects.Text;
    updateDeviceStates(): void;
    isMounted(): boolean;
    setHeatingInProgress(value: boolean): void;
  }): Promise<void> {
    const snapshot = this.puzzle.getSnapshot();

    if (snapshot.currentStep !== step) {
      const expectedStep = snapshot.currentStep;
      const expectedMessage = expectedStep
        ? `${SCIENCE_LAB_STEP_DEFINITIONS[expectedStep].title} 장치를 먼저 조작하세요.`
        : "이미 모든 실험 절차를 완료했습니다.";

      context.showMessage(expectedMessage, "warning");
      return;
    }

    const releaseInputLock = context.acquireModalInputLock();
    let dialogResult;

    try {
      dialogResult = await this.requestStep({
        step,
        definition: SCIENCE_LAB_STEP_DEFINITIONS[step],
        submit: (value) => this.puzzle.submit(step, value),
      });
    } finally {
      releaseInputLock();
    }

    if (dialogResult.status === "cancelled" || !isMounted()) {
      context.showMessage("장치 설정을 취소했습니다.", "info");
      return;
    }

    updateDeviceStates();
    statusText.setText(dialogResult.result.message);

    if (!dialogResult.result.solved) {
      context.showMessage(dialogResult.result.message, "success");
      return;
    }

    setHeatingInProgress(true);
    context.showMessage(
      "가열 반응을 시작합니다. 안전 연출이 끝날 때까지 기다리세요.",
      "info",
    );

    let reactionCompleted = false;

    try {
      reactionCompleted = await this.playHeatingSequence(scene);
    } finally {
      setHeatingInProgress(false);
    }

    if (!reactionCompleted || !isMounted()) {
      return;
    }

    const nextState = await context.updateProgress(
      { scienceLabPuzzleSolved: true },
      `과학 실험실을 완료했습니다. 실험동 승인 코드 [${SCIENCE_LAB_SECURITY_CODE}]를 확보했습니다.`,
    );

    if (nextState.scienceLabPuzzleSolved) {
      statusText.setText("실험 완료 · 장치가 안전 정지 상태입니다.");
      securityCodeText.setText(
        `실험동 승인 코드 · ${SCIENCE_LAB_SECURITY_CODE}`,
      );
    }
  }
}

export function createScienceLabRoom(
  options: ScienceLabRoomOptions = {},
): ScienceLabRoomModule {
  return new ScienceLabRoomModule(options);
}
