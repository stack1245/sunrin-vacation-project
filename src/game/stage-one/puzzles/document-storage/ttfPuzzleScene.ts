import * as Phaser from "phaser";

import { DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT } from "./documentStoragePuzzleEvents";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export class TtfPuzzleScene extends Phaser.Scene {
  private isCleared = false;

  // 🔥 사용자가 선택한 선지의 인덱스 (0, 1, 2)
  private selectedOptionIndex: number | null = null;

  // 🔥 실제 정답 인덱스를 여기에 설정하세요 (0: 첫 번째, 1: 두 번째, 2: 세 번째)
  private readonly CORRECT_ANSWER_INDEX = 0;

  private optionBgs: Phaser.GameObjects.Rectangle[] = [];
  private optionTexts: Phaser.GameObjects.Text[] = [];

  private submitButtonBg!: Phaser.GameObjects.Rectangle;
  private submitButtonText!: Phaser.GameObjects.Text;
  private successWindow!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "TTFPuzzleScene" });
  }

  create(): void {
    this.isCleared = false;
    this.selectedOptionIndex = null;
    this.optionBgs = [];
    this.optionTexts = [];
    this.cameras.main.setBackgroundColor("#1e1e2e");

    this.drawHeader();
    this.drawOptions();
    this.drawBottomButtons();
    this.createSuccessWindow();

    this.updateGameState();
  }

  private drawHeader(): void {
    this.add
      .text(GAME_WIDTH / 2, 60, "TTF", {
        fontSize: "28px",
        color: "#ffffff",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 110, "당신은 로봇이 아닙니까?", {
        fontSize: "18px",
        color: "#a6e3a1",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);
  }

  private drawOptions(): void {
    const startY = 200;
    const spacingY = 90;

    const placeholders = [
      "예",
      "아니요",
      "[Web발신]너는나를존중해야한다...."
    ];

    for (let i = 0; i < 3; i++) {
      const y = startY + i * spacingY;

      // 선지 배경 (가로로 넓은 직사각형)
      const bg = this.add
        .rectangle(GAME_WIDTH / 2, y, 600, 65, 0x44475a)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      // 선지 텍스트
      const text = this.add
        .text(GAME_WIDTH / 2, y, placeholders[i], {
          fontSize: "20px",
          color: "#ffffff",
          fontFamily: "Arial",
        })
        .setOrigin(0.5);

      bg.on("pointerdown", () => {
        if (!this.isCleared) {
          this.selectedOptionIndex = i;
          this.updateGameState();
        }
      });

      bg.on("pointerover", () => {
        if (!this.isCleared && this.selectedOptionIndex !== i) {
          bg.setFillStyle(0x6272a4);
        }
      });

      bg.on("pointerout", () => {
        if (!this.isCleared && this.selectedOptionIndex !== i) {
          bg.setFillStyle(0x44475a);
        }
      });

      this.optionBgs.push(bg);
      this.optionTexts.push(text);
    }
  }

  private drawBottomButtons(): void {
    const uiY = 510;
    const submitX = GAME_WIDTH / 2 - 70;
    const resetX = GAME_WIDTH / 2 + 70;

    // 1. 정답 확인 버튼
    this.submitButtonBg = this.add.rectangle(submitX, uiY, 120, 45, 0x555555).setOrigin(0.5);
    this.submitButtonText = this.add.text(submitX, uiY, "정답", {
      fontSize: "18px",
      color: "#aaaaaa",
      fontFamily: "Arial",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.submitButtonBg.on("pointerdown", () => {
      if (this.submitButtonBg.input?.enabled && !this.isCleared) {
        if (this.selectedOptionIndex === this.CORRECT_ANSWER_INDEX) {
          // 정답일 경우
          this.handleClearState();
        } else {
          // 오답일 경우 화면 흔들림 효과
          this.cameras.main.shake(200, 0.005);
        }
      }
    });

    // 2. 초기화 버튼
    const resetButtonBg = this.add.rectangle(resetX, uiY, 120, 45, 0x883333).setOrigin(0.5);
    resetButtonBg.setInteractive({ useHandCursor: true });

    this.add.text(resetX, uiY, "초기화", {
      fontSize: "18px",
      color: "#ffffff",
      fontFamily: "Arial",
      fontStyle: "bold",
    }).setOrigin(0.5);

    resetButtonBg.on("pointerdown", () => this.resetPuzzle());
    resetButtonBg.on("pointerover", () => resetButtonBg.setFillStyle(0xaa4444));
    resetButtonBg.on("pointerout", () => resetButtonBg.setFillStyle(0x883333));
  }

  private updateGameState(): void {
    // 1. 선지 하이라이트 처리
    for (let i = 0; i < 3; i++) {
      const bg = this.optionBgs[i];
      if (this.selectedOptionIndex === i) {
        // 선택된 선지는 테두리와 밝은 색상 적용
        bg.setFillStyle(0x32364d);
        bg.setStrokeStyle(3, 0xffcc00);
      } else {
        // 선택되지 않은 선지 리셋
        bg.setFillStyle(0x44475a);
        bg.setStrokeStyle(0);
      }
    }

    // 2. 제출 버튼 활성화/비활성화 처리
    if (this.selectedOptionIndex !== null && !this.isCleared) {
      this.submitButtonBg.setFillStyle(0x33aa33);
      this.submitButtonText.setColor("#ffffff");
      this.submitButtonBg.setInteractive({ useHandCursor: true });
    } else {
      this.submitButtonBg.setFillStyle(0x555555);
      this.submitButtonText.setColor("#aaaaaa");
      this.submitButtonBg.disableInteractive();
    }
  }

  private handleClearState(): void {
    if (this.isCleared) {
      return;
    }

    this.isCleared = true;
    this.successWindow.setVisible(true);
    this.game.events.emit(DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT);

    // 정답을 맞추면 선택 상태 초기화
    this.selectedOptionIndex = null;
    this.updateGameState();
  }

  private resetPuzzle(): void {
    this.isCleared = false;
    this.selectedOptionIndex = null;
    this.successWindow.setVisible(false);
    this.updateGameState();
  }

  private createSuccessWindow(): void {
    this.successWindow = this.add.container(0, 0);

    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75)
      .setInteractive();

    // N-Queens 및 Resource 퍼즐과 동일한 팝업 디자인
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 350, 150, 0x222222)
      .setStrokeStyle(4, 0xffcc00);

    const successText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "! : ld", {
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
