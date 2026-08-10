import * as Phaser from "phaser";

import {
  adjustResourceAllocation,
  createInitialResourceAllocation,
  evaluateResourceAllocation,
  RESOURCE_ALLOCATION_RULES,
  RESOURCE_ZONE_IDS,
  RESOURCE_ZONE_LABELS,
  type ResourceAllocation,
  type ResourceAllocationRuleId,
  type ResourceZoneId,
} from "./resourceAllocationPuzzle";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export class ResourceAllocationPuzzleScene extends Phaser.Scene {
  private allocation: ResourceAllocation = createInitialResourceAllocation();
  private isCleared = false;
  private totalText!: Phaser.GameObjects.Text;
  private successWindow!: Phaser.GameObjects.Container;
  private readonly zoneValueTexts = new Map<
    ResourceZoneId,
    Phaser.GameObjects.Text
  >();
  private readonly ruleStatusTexts = new Map<
    ResourceAllocationRuleId,
    Phaser.GameObjects.Text
  >();

  constructor() {
    super({ key: "ResourceAllocationPuzzleScene" });
  }

  create(): void {
    this.allocation = createInitialResourceAllocation();
    this.isCleared = false;
    this.zoneValueTexts.clear();
    this.ruleStatusTexts.clear();
    this.cameras.main.setBackgroundColor("#1e1e2e");

    this.drawHeader();
    this.drawZoneControls();
    this.drawRuleChecklist();
    this.drawResetButton();
    this.createSuccessWindow();
    this.refreshPuzzleState();
  }

  private drawHeader(): void {
    this.add
      .text(GAME_WIDTH / 2, 40, "자원 분배 퍼즐 (총 100개)", {
        fontSize: "28px",
        color: "#ffffff",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.totalText = this.add
      .text(GAME_WIDTH / 2, 80, "현재 합계: 100 / 100", {
        fontSize: "22px",
        color: "#a6e3a1",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  private drawZoneControls(): void {
    const startY = 150;
    const spacingY = 60;

    RESOURCE_ZONE_IDS.forEach((zoneId, index) => {
      const y = startY + index * spacingY;

      this.add
        .text(100, y, RESOURCE_ZONE_LABELS[zoneId], {
          fontSize: "18px",
          color: "#8be9fd",
          fontFamily: "Arial",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5);

      this.createAdjustmentButton(280, y, "-5", () =>
        this.changeZoneValue(zoneId, -5),
      );
      this.createAdjustmentButton(330, y, "-1", () =>
        this.changeZoneValue(zoneId, -1),
      );

      const valueText = this.add
        .text(380, y, String(this.allocation[zoneId]), {
          fontSize: "24px",
          color: "#ffffff",
          fontFamily: "Arial",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.zoneValueTexts.set(zoneId, valueText);

      this.createAdjustmentButton(430, y, "+1", () =>
        this.changeZoneValue(zoneId, 1),
      );
      this.createAdjustmentButton(480, y, "+5", () =>
        this.changeZoneValue(zoneId, 5),
      );
    });
  }

  private createAdjustmentButton(
    x: number,
    y: number,
    label: string,
    onSelect: () => void,
  ): void {
    const background = this.add
      .rectangle(x, y, 40, 36, 0x44475a)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, label, {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    background.on("pointerdown", () => {
      if (!this.isCleared) {
        onSelect();
      }
    });
    background.on("pointerover", () => background.setFillStyle(0x6272a4));
    background.on("pointerout", () => background.setFillStyle(0x44475a));
  }

  private changeZoneValue(zoneId: ResourceZoneId, delta: number): void {
    this.allocation = adjustResourceAllocation(this.allocation, zoneId, delta);
    this.zoneValueTexts.get(zoneId)?.setText(String(this.allocation[zoneId]));
    this.refreshPuzzleState();
  }

  private drawRuleChecklist(): void {
    const startX = 550;
    const startY = 150;
    const spacingY = 45;

    RESOURCE_ALLOCATION_RULES.forEach((rule, index) => {
      const statusText = this.add
        .text(startX, startY + index * spacingY, `❌ ${rule.label}`, {
          fontSize: "16px",
          color: "#ff5555",
          fontFamily: "Arial",
        })
        .setOrigin(0, 0.5);
      this.ruleStatusTexts.set(rule.id, statusText);
    });
  }

  private drawResetButton(): void {
    const background = this.add
      .rectangle(GAME_WIDTH / 2, 500, 120, 40, 0x883333)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH / 2, 500, "초기화", {
        fontSize: "18px",
        color: "#ffffff",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    background.on("pointerdown", () => {
      if (!this.isCleared) {
        this.resetAllocation();
      }
    });
    background.on("pointerover", () => background.setFillStyle(0xaa4444));
    background.on("pointerout", () => background.setFillStyle(0x883333));
  }

  private resetAllocation(): void {
    this.allocation = createInitialResourceAllocation();

    for (const zoneId of RESOURCE_ZONE_IDS) {
      this.zoneValueTexts
        .get(zoneId)
        ?.setText(String(this.allocation[zoneId]));
    }

    this.refreshPuzzleState();
  }

  private refreshPuzzleState(): void {
    const evaluation = evaluateResourceAllocation(this.allocation);

    this.totalText.setText(`현재 합계: ${evaluation.total} / 100`);
    this.totalText.setColor(
      evaluation.total === 100
        ? "#a6e3a1"
        : evaluation.total > 100
          ? "#ff5555"
          : "#f1fa8c",
    );

    for (const rule of RESOURCE_ALLOCATION_RULES) {
      const isSatisfied = evaluation.ruleChecks[rule.id];
      this.ruleStatusTexts
        .get(rule.id)
        ?.setText(`${isSatisfied ? "✅" : "❌"} ${rule.label}`)
        .setColor(isSatisfied ? "#50fa7b" : "#ff5555");
    }

    if (evaluation.isSolved && !this.isCleared) {
      this.isCleared = true;
      this.successWindow.setVisible(true);
    }
  }

  private createSuccessWindow(): void {
    this.successWindow = this.add.container(0, 0);

    const overlay = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x000000,
        0.75,
      )
      .setInteractive();
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 400, 180, 0x1e1e2e)
      .setStrokeStyle(4, 0x50fa7b);
    const successText = this.add
      .text(GAME_WIDTH / 2, 270, "🎉 완벽한 자원 분배!", {
        fontSize: "28px",
        color: "#50fa7b",
        fontFamily: "Arial",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);
    const descriptionText = this.add
      .text(
        GAME_WIDTH / 2,
        320,
        "모든 논리 조건을 완벽하게 맞추셨습니다.",
        {
          fontSize: "16px",
          color: "#ffffff",
          fontFamily: "Arial",
          align: "center",
        },
      )
      .setOrigin(0.5);

    this.successWindow.add([
      overlay,
      panel,
      successText,
      descriptionText,
    ]);
    this.successWindow.setDepth(100);
    this.successWindow.setVisible(false);
  }
}
