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
import { DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT } from "./documentStoragePuzzleEvents";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export class ResourceAllocationPuzzleScene extends Phaser.Scene {
  private allocation: ResourceAllocation = createInitialResourceAllocation();
  private isCleared = false;

  private totalText!: Phaser.GameObjects.Text;
  private successWindow!: Phaser.GameObjects.Container;

  private submitButtonBg!: Phaser.GameObjects.Rectangle;
  private submitButtonText!: Phaser.GameObjects.Text;

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
    this.zoneValueTexts.clear();
    this.ruleStatusTexts.clear();
    this.cameras.main.setBackgroundColor("#1e1e2e");

    this.drawHeader();
    this.drawZoneControlsAndRules();
    this.drawBottomButtons();
    this.createSuccessWindow();

    this.refreshPuzzleState();

    if (this.isCleared) {
      this.handleClearState();
    }
  }

  private drawHeader(): void {
    this.add
      .text(GAME_WIDTH / 2, 40, "자원 분배 퍼즐", {
        fontSize: "28px",
        color: "#ffffff",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.totalText = this.add
      .text(GAME_WIDTH / 2, 80, "총 자원 합계: 100 / 100", {
        fontSize: "22px",
        color: "#a6e3a1",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  private drawZoneControlsAndRules(): void {
    const startY = 150;
    const spacingY = 65;

    const zoneRules = RESOURCE_ALLOCATION_RULES.filter(
      (rule) => !rule.label.includes("총") && !rule.label.includes("합계")
    );

    RESOURCE_ZONE_IDS.forEach((zoneId, index) => {
      const y = startY + index * spacingY;

      this.add
        .text(40, y, RESOURCE_ZONE_LABELS[zoneId], {
          fontSize: "18px",
          color: "#8be9fd",
          fontFamily: "Arial",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5);

      this.createAdjustmentButton(180, y, "-5", () => this.changeZoneValue(zoneId, -5));
      this.createAdjustmentButton(230, y, "-1", () => this.changeZoneValue(zoneId, -1));

      const valueText = this.add
        .text(280, y, String(this.allocation[zoneId]), {
          fontSize: "24px",
          color: "#ffffff",
          fontFamily: "Arial",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.zoneValueTexts.set(zoneId, valueText);

      this.createAdjustmentButton(330, y, "+1", () => this.changeZoneValue(zoneId, 1));
      this.createAdjustmentButton(380, y, "+5", () => this.changeZoneValue(zoneId, 5));

      const rule = zoneRules[index];
      if (rule) {
        const statusText = this.add
          .text(430, y, `❌ ${rule.label}`, {
            fontSize: "16px",
            color: "#ff5555",
            fontFamily: "Arial",
          })
          .setOrigin(0, 0.5);
        this.ruleStatusTexts.set(rule.id, statusText);
      }
    });
  }

  private createAdjustmentButton(x: number, y: number, label: string, onSelect: () => void): void {
    const background = this.add
      .rectangle(x, y, 40, 36, 0x44475a)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontSize: "16px",
      color: "#ffffff",
      fontFamily: "Arial",
      fontStyle: "bold",
    }).setOrigin(0.5);

    background.on("pointerdown", () => {
      if (!this.isCleared) onSelect();
    });
    background.on("pointerover", () => background.setFillStyle(0x6272a4));
    background.on("pointerout", () => background.setFillStyle(0x44475a));
  }

  private changeZoneValue(zoneId: ResourceZoneId, delta: number): void {
    if (this.isCleared) return;
    this.allocation = adjustResourceAllocation(this.allocation, zoneId, delta);
    this.zoneValueTexts.get(zoneId)?.setText(String(this.allocation[zoneId]));
    this.refreshPuzzleState();
  }

  private drawBottomButtons(): void {
    const uiY = 530;
    const submitX = GAME_WIDTH / 2 - 60;
    const resetX = GAME_WIDTH / 2 + 60;

    this.submitButtonBg = this.add.rectangle(submitX, uiY, 100, 40, 0x555555).setOrigin(0.5);
    this.submitButtonText = this.add.text(submitX, uiY, "정답", {
      fontSize: "16px",
      color: "#aaaaaa",
      fontFamily: "Arial",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.submitButtonBg.on('pointerdown', () => {
        if (this.submitButtonBg.input?.enabled && !this.isCleared) {
            this.handleClearState();
        }
    });

    const resetButtonBg = this.add.rectangle(resetX, uiY, 100, 40, 0x883333).setOrigin(0.5);
    resetButtonBg.setInteractive({ useHandCursor: true });
    this.add.text(resetX, uiY, "초기화", {
      fontSize: "16px",
      color: "#ffffff",
      fontFamily: "Arial",
      fontStyle: "bold",
    }).setOrigin(0.5);

    resetButtonBg.on("pointerdown", () => this.resetAllocation());
    resetButtonBg.on("pointerover", () => resetButtonBg.setFillStyle(0xaa4444));
    resetButtonBg.on("pointerout", () => resetButtonBg.setFillStyle(0x883333));
  }

  // 🔥 정답 확인 시 호출되는 통합 클리어 로직
  private handleClearState(): void {
    if (this.isCleared) {
      return;
    }

    this.isCleared = true;
    this.successWindow.setVisible(true);
    this.game.events.emit(DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT);

    // 🔥 정답을 맞추면 퍼즐판을 초기 상태로 리셋 (데이터 및 텍스트 UI)
    this.allocation = createInitialResourceAllocation();
    for (const zoneId of RESOURCE_ZONE_IDS) {
      this.zoneValueTexts.get(zoneId)?.setText(String(this.allocation[zoneId]));
    }
    this.refreshPuzzleState(); // 버튼 및 체크리스트 상태 동기화
  }

  private resetAllocation(): void {
    this.isCleared = false;
    this.successWindow.setVisible(false);
    this.allocation = createInitialResourceAllocation();

    for (const zoneId of RESOURCE_ZONE_IDS) {
      this.zoneValueTexts.get(zoneId)?.setText(String(this.allocation[zoneId]));
    }
    this.refreshPuzzleState();
  }

  private refreshPuzzleState(): void {
    const evaluation = evaluateResourceAllocation(this.allocation);

    this.totalText.setText(`총 자원 합계: ${evaluation.total} / 100`);
    this.totalText.setColor(
      evaluation.total === 100 ? "#a6e3a1" : evaluation.total > 100 ? "#ff5555" : "#f1fa8c",
    );

    for (const rule of RESOURCE_ALLOCATION_RULES) {
      const isSatisfied = evaluation.ruleChecks[rule.id];
      const statusText = this.ruleStatusTexts.get(rule.id);
      if (statusText) {
        statusText
          .setText(`${isSatisfied ? "✅" : "❌"} ${rule.label}`)
          .setColor(isSatisfied ? "#50fa7b" : "#ff5555");
      }
    }

    if (evaluation.isSolved && !this.isCleared) {
        this.submitButtonBg.setFillStyle(0x33aa33);
        this.submitButtonText.setColor('#ffffff');
        this.submitButtonBg.setInteractive({ useHandCursor: true });
    } else {
        this.submitButtonBg.setFillStyle(0x555555);
        this.submitButtonText.setColor('#aaaaaa');
        this.submitButtonBg.disableInteractive();
    }
  }

  private createSuccessWindow(): void {
    this.successWindow = this.add.container(0, 0);

    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75)
      .setInteractive();

    // 🔥 N-Queens 스타일: 어두운 배경(0x222222) + 노란색 테두리(0xffcc00)
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 350, 150, 0x222222)
      .setStrokeStyle(4, 0xffcc00);

    // 🔥 요청대로 다른 설명 없이 텍스트 하나만 출력
    const successText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "# : w", {
        fontSize: "28px",
        color: "#ffffff",
        fontFamily: "Arial",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);

    this.successWindow.add([overlay, panel, successText]);
    this.successWindow.setDepth(100);
    this.successWindow.setVisible(false);
  }
}
