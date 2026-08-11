import * as Phaser from 'phaser';

import { DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT } from './documentStoragePuzzleEvents';

interface Position {
    row: number;
    col: number;
}

interface Queen extends Position {
    sprite: Phaser.GameObjects.Text;
}

export class NQueensPuzzleScene extends Phaser.Scene {
    private readonly N: number = 8;
    private readonly targetQueens: number = 12;

    private readonly tileSize: number = 60;
    // 🔥 800x600 캔버스 중앙 정렬을 위해 Offset 값 조정
    private readonly boardOffsetX: number = 160;
    private readonly boardOffsetY: number = 60;

    private isCleared: boolean = false;

    private queens: Queen[] = [];
    private walls: Position[] = [];

    private instructionText!: Phaser.GameObjects.Text;

    private submitButtonBg!: Phaser.GameObjects.Rectangle;
    private submitButtonText!: Phaser.GameObjects.Text;

    private tiles: Phaser.GameObjects.Rectangle[][] = [];
    private successWindow!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'NQueensPuzzleScene' });
    }

    create(): void {
        this.initWalls(['a3', 'a5', 'b5', 'b7', 'c7', 'd1', 'd3', 'e6', 'e8', 'f2', 'g2', 'g4', 'h4', 'h6']);

        for (let i = 0; i < this.N; i++) {
            this.tiles[i] = [];
        }

        // 상단 타이틀 추가 (선택 사항, 통일감을 위해 추가)
        this.add.text(
            400,
            25,
            'N-Queens 퍼즐',
            { fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold' }
        ).setOrigin(0.5);

        this.drawBoard();

        // 🔥 하단 UI 위치도 캔버스 크기에 맞춰 재조정
        const uiY = this.boardOffsetY + (this.N * this.tileSize) + 35;

        this.instructionText = this.add.text(
            this.boardOffsetX,
            uiY,
            '클릭하여 퀸을 배치하세요',
            { fontSize: '18px', color: '#aaaaaa', fontFamily: 'Arial' }
        ).setOrigin(0, 0.5);

        const submitX = 400 + 100;
        this.submitButtonBg = this.add.rectangle(submitX, uiY, 100, 36, 0x555555).setOrigin(0.5);
        this.submitButtonText = this.add.text(submitX, uiY, '정답', {
            fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.createSuccessWindow();

        this.submitButtonBg.on('pointerdown', () => {
            if (this.submitButtonBg.input?.enabled && !this.isCleared) {
                this.isCleared = true;
                this.successWindow.setVisible(true);
                this.game.events.emit(DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT);

                this.queens.forEach(q => q.sprite.destroy());
                this.queens = [];
                this.updateGameState();
            }
        });

        const resetX = submitX + 110;
        const resetButtonBg = this.add.rectangle(resetX, uiY, 90, 36, 0x883333).setOrigin(0.5);
        this.add.text(resetX, uiY, '초기화', {
            fontSize: '16px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        resetButtonBg.setInteractive({ useHandCursor: true });
        resetButtonBg.on('pointerdown', () => {
            if (!this.isCleared) this.resetBoard();
        });

        resetButtonBg.on('pointerover', () => {
            if (!this.isCleared) resetButtonBg.setFillStyle(0xaa4444);
        });
        resetButtonBg.on('pointerout', () => {
            if (!this.isCleared) resetButtonBg.setFillStyle(0x883333);
        });

        this.updateGameState();

        if (this.isCleared) {
            this.successWindow.setVisible(true);
        }
    }

    private createSuccessWindow(): void {
        this.successWindow = this.add.container(0, 0);

        // 🔥 800x600 캔버스 정중앙(400, 300)으로 팝업 위치 수정
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        overlay.setInteractive();

        const panel = this.add.rectangle(400, 300, 350, 150, 0x222222).setStrokeStyle(4, 0xffcc00);

        const successText = this.add.text(400, 300, '$ : o', {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'Arial',
            align: 'center',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.successWindow.add([overlay, panel, successText]);
        this.successWindow.setDepth(100);
        this.successWindow.setVisible(false);
    }

    private initWalls(wallPositions: string[]): void {
        this.walls = [];
        for (const pos of wallPositions) {
            const col = pos.charCodeAt(0) - 'a'.charCodeAt(0);
            const row = parseInt(pos[1]) - 1;
            this.walls.push({ row, col });
        }
    }

    private isWall(row: number, col: number): boolean {
        return this.walls.some(w => w.row === row && w.col === col);
    }

    private drawBoard(): void {
        for (let r: number = 0; r < this.N; r++) {
            for (let c: number = 0; c < this.N; c++) {
                const isLight: boolean = (r + c) % 2 === 0;
                const color: number = isLight ? 0xffffff : 0x222222;

                const x: number = this.boardOffsetX + (c * this.tileSize) + (this.tileSize / 2);
                const y: number = this.boardOffsetY + (r * this.tileSize) + (this.tileSize / 2);

                const tile: Phaser.GameObjects.Rectangle = this.add.rectangle(x, y, this.tileSize, this.tileSize, color);
                this.tiles[r][c] = tile;

                if (this.isWall(r, c)) {
                    // 🔥 깨지는 텍스트 대신, 사각형 2개를 겹쳐서 단단한 벽(블록)처럼 표현
                    tile.setFillStyle(0x44475a);
                    this.add.rectangle(x, y, this.tileSize - 20, this.tileSize - 20, 0x282a36);
                } else {
                    tile.setInteractive({ useHandCursor: true });
                    tile.on('pointerdown', () => this.handleTileClick(r, c, x, y));
                }
            }
        }
    }

    private handleTileClick(row: number, col: number, x: number, y: number): void {
        if (this.isCleared) return;

        const existingIndex: number = this.queens.findIndex(q => q.row === row && q.col === col);

        if (existingIndex !== -1) {
            this.queens[existingIndex].sprite.destroy();
            this.queens.splice(existingIndex, 1);
        } else {
            if (this.queens.length >= this.targetQueens) {
                return;
            }

            const qText: Phaser.GameObjects.Text = this.add.text(x, y, '♛', {
                fontSize: '45px',
                color: '#ffcc00',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);

            this.queens.push({ row, col, sprite: qText });
        }

        this.updateGameState();
    }

    private isBlockedByWall(r1: number, c1: number, r2: number, c2: number): boolean {
        const dr = Math.sign(r2 - r1);
        const dc = Math.sign(c2 - c1);

        let r = r1 + dr;
        let c = c1 + dc;

        while (r !== r2 || c !== c2) {
            if (this.isWall(r, c)) {
                return true;
            }
            r += dr;
            c += dc;
        }
        return false;
    }

    private updateGameState(): void {
        let isSafe = true;

        for (let r = 0; r < this.N; r++) {
            for (let c = 0; c < this.N; c++) {
                if (this.isWall(r, c)) continue;

                const isLight: boolean = (r + c) % 2 === 0;
                this.tiles[r][c].setFillStyle(isLight ? 0xffffff : 0x222222);

                let isAttacked = false;
                for (const q of this.queens) {
                    if (q.row === r && q.col === c) continue;

                    if (
                        q.row === r ||
                        q.col === c ||
                        Math.abs(q.row - r) === Math.abs(q.col - c)
                    ) {
                        if (!this.isBlockedByWall(q.row, q.col, r, c)) {
                            isAttacked = true;
                            if (this.queens.some(otherQ => otherQ.row === r && otherQ.col === c)) {
                                isSafe = false;
                            }
                            break;
                        }
                    }
                }

                if (isAttacked && !this.isCleared) {
                    const threatColor = isLight ? 0xff9999 : 0xcc3333;
                    this.tiles[r][c].setFillStyle(threatColor);
                }
            }
        }

        if (this.queens.length === this.targetQueens && isSafe && !this.isCleared) {
            this.submitButtonBg.setFillStyle(0x33aa33);
            this.submitButtonText.setColor('#ffffff');
            this.submitButtonBg.setInteractive({ useHandCursor: true });
        } else {
            this.submitButtonBg.setFillStyle(0x555555);
            this.submitButtonText.setColor('#aaaaaa');
            this.submitButtonBg.disableInteractive();
        }
    }

    private resetBoard(): void {
        this.queens.forEach(q => q.sprite.destroy());
        this.queens = [];
        this.updateGameState();
    }
}
