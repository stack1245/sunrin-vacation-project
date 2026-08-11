import * as Phaser from "phaser";

import { DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT } from "./documentStoragePuzzleEvents";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export class AgoPuzzleScene extends Phaser.Scene {
  private readonly ROWS = 4;
  private readonly COLS = 4;
  private readonly TILE_SIZE = 80;
  private readonly TILE_SPACING = 10;

  // 퍼즐 그리드 상태 (true: 켜짐, false: 꺼짐)
  private gridState: boolean[][] = [];
  private tiles: Phaser.GameObjects.Rectangle[][] = [];

  private isCleared = false;

  private submitButtonBg!: Phaser.GameObjects.Rectangle;
  private submitButtonText!: Phaser.GameObjects.Text;
  private successWindow!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "SecurityGridPuzzleScene" });
  }

  create(): void {
    this.isCleared = false;
    this.cameras.main.setBackgroundColor("#050b10");

    this.drawHeader();
    this.initGridState();
    this.drawGrid();
    this.drawBottomButtons();
    this.createSuccessWindow();

    this.updateGameState();
  }

  private drawHeader(): void {
    this.add
      .text(GAME_WIDTH / 2, 60, "보안 노드 해제 퍼즐", {
        fontSize: "28px",
        color: "#eef3f5",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 100, "타일을 눌러 모든 노드를 활성화(초록색) 하십시오.", {
        fontSize: "18px",
        color: "#b7d8c1",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);
  }

  // 🔥 초기 퍼즐 상태 세팅 (적당히 섞인 상태)
  private initGridState(): void {
    this.gridState = [
      [false, true,  true,  false],
      [true,  false, false, true],
      [true,  false, false, true],
      [false, true,  true,  false],
    ];
  }

  private drawGrid(): void {
    // 그리드를 화면 정중앙에 배치하기 위한 시작 좌표 계산
    const gridWidth = this.COLS * this.TILE_SIZE + (this.COLS - 1) * this.TILE_SPACING;
    const startX = (GAME_WIDTH - gridWidth) / 2 + this.TILE_SIZE / 2;
    const startY = 160 + this.TILE_SIZE / 2;

    this.tiles = [];

    for (let r = 0; r < this.ROWS; r++) {
      this.tiles[r] = [];
      for (let c = 0; c < this.COLS; c++) {
        const x = startX + c * (this.TILE_SIZE + this.TILE_SPACING);
        const y = startY + r * (this.TILE_SIZE + this.TILE_SPACING);

        const tile = this.add
          .rectangle(x, y, this.TILE_SIZE, this.TILE_SIZE, 0x0b1823)
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });

        tile.on("pointerdown", () => {
          if (!this.isCleared) {
            this.handleTileClick(r, c);
          }
        });

        this.tiles[r][c] = tile;
      }
    }
  }

  // 🔥 타일 클릭 시 본인 및 상하좌우 반전 로직
  private handleTileClick(row: number, col: number): void {
    const toggle = (r: number, c: number) => {
      if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS) {
        this.gridState[r][c] = !this.gridState[r][c];
      }
    };

    toggle(row, col);       // 자기 자신
    toggle(row - 1, col);   // 상
    toggle(row + 1, col);   // 하
    toggle(row, col - 1);   // 좌
    toggle(row, col + 1);   // 우

    this.updateGameState();
  }

  private drawBottomButtons(): void {
    const uiY = 530;
    const submitX = GAME_WIDTH / 2 - 70;
    const resetX = GAME_WIDTH / 2 + 70;

    // 1. 정답 확인 버튼
    this.submitButtonBg = this.add.rectangle(submitX, uiY, 120, 45, 0x223341).setOrigin(0.5);
    this.submitButtonText = this.add.text(submitX, uiY, "정답", {
      fontSize: "18px",
      color: "#6f838f",
      fontFamily: "Arial",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.submitButtonBg.on("pointerdown", () => {
      if (this.submitButtonBg.input?.enabled && !this.isCleared) {
        if (this.checkIfSolved()) {
          this.handleClearState();
        } else {
          // 정답이 아닐 경우 화면 흔들림
          this.cameras.main.shake(200, 0.005);
        }
      }
    });

    // 2. 초기화 버튼
    const resetButtonBg = this.add.rectangle(resetX, uiY, 120, 45, 0x251517).setOrigin(0.5);
    resetButtonBg.setInteractive({ useHandCursor: true });

    this.add.text(resetX, uiY, "초기화", {
      fontSize: "18px",
      color: "#e0a08f",
      fontFamily: "Arial",
      fontStyle: "bold",
    }).setOrigin(0.5);

    resetButtonBg.on("pointerdown", () => this.resetPuzzle());
    resetButtonBg.on("pointerover", () => resetButtonBg.setFillStyle(0x321b1d));
    resetButtonBg.on("pointerout", () => resetButtonBg.setFillStyle(0x251517));
  }

  private updateGameState(): void {
    // 1. 그리드 색상 업데이트
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const isActive = this.gridState[r][c];
        const tile = this.tiles[r][c];

        if (isActive) {
          tile.setFillStyle(0x5dbd8b); // 활성화된 보안 노드
        } else {
          tile.setFillStyle(0x0b1823); // 비활성화된 보안 노드
        }
      }
    }

    // 2. 정답 확인 버튼 상태 업데이트
    if (this.checkIfSolved() && !this.isCleared) {
      this.submitButtonBg.setFillStyle(0x315447);
      this.submitButtonText.setColor("#eef3f5");
      this.submitButtonBg.setInteractive({ useHandCursor: true });
    } else if (!this.isCleared) {
      this.submitButtonBg.setFillStyle(0x223341);
      this.submitButtonText.setColor("#6f838f");
      this.submitButtonBg.disableInteractive();
    }
  }

  // 모든 타일이 true(초록색)인지 검사
  private checkIfSolved(): boolean {
    return this.gridState.every(row => row.every(val => val === true));
  }

  private handleClearState(): void {
    if (this.isCleared) {
      return;
    }

    this.isCleared = true;
    this.successWindow.setVisible(true);
    this.game.events.emit(DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT);

    // 버튼 비활성화 시각 효과
    this.submitButtonBg.setFillStyle(0x223341);
    this.submitButtonText.setColor("#6f838f");
    this.submitButtonBg.disableInteractive();
  }

  private resetPuzzle(): void {
    this.isCleared = false;
    this.successWindow.setVisible(false);
    this.initGridState();
    this.updateGameState();
  }

  private createSuccessWindow(): void {
    this.successWindow = this.add.container(0, 0);

    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75)
      .setInteractive();

    // 타 퍼즐들과 동일한 팝업 (어두운 배경 + 노란 테두리)
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 350, 150, 0x071018)
      .setStrokeStyle(3, 0xf0cf72);

    const successText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "@ : or", {
        fontSize: "28px",
        color: "#eef3f5",
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
