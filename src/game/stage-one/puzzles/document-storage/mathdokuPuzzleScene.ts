import * as Phaser from 'phaser';

import { DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT } from './documentStoragePuzzleEvents';

interface CellPosition {
    r: number;
    c: number;
}

type CageOperator = "" | "+" | "x";

interface Cage {
    target: number;
    operator: CageOperator;
    cells: CellPosition[];
}

interface PuzzleData {
    id: number;
    name: string;
    size: number;
    solution: number[][];
    cages: Cage[];
}

const PUZZLES: PuzzleData[] = [
    {
        id: 1,
        name: '연산 퍼즐 (6x6)',
        size: 6,
        solution: [
            [5, 6, 3, 4, 1, 2],
            [6, 1, 4, 5, 2, 3],
            [4, 5, 2, 1, 3, 6],
            [2, 3, 1, 6, 4, 5],
            [3, 4, 6, 2, 5, 1],
            [1, 2, 5, 3, 6, 4]
        ],
        cages: [
            { target: 11, operator: '+', cells: [{r:0,c:0}, {r:1,c:0}] },
            { target: 18, operator: 'x', cells: [{r:0,c:1}, {r:0,c:2}] },
            { target: 7,  operator: '+', cells: [{r:0,c:3}, {r:0,c:4}, {r:0,c:5}] },
            { target: 6,  operator: '+', cells: [{r:1,c:1}, {r:2,c:1}] },
            { target: 9,  operator: '+', cells: [{r:1,c:2}, {r:1,c:3}] },
            { target: 6,  operator: 'x', cells: [{r:1,c:4}, {r:1,c:5}] },
            { target: 8,  operator: 'x', cells: [{r:2,c:0}, {r:3,c:0}] },
            { target: 12, operator: 'x', cells: [{r:2,c:2}, {r:3,c:2}, {r:4,c:2}] },
            { target: 18, operator: 'x', cells: [{r:2,c:3}, {r:2,c:4}, {r:2,c:5}] },
            { target: 12, operator: 'x', cells: [{r:3,c:1}, {r:4,c:1}] },
            { target: 8,  operator: '+', cells: [{r:3,c:3}, {r:4,c:3}] },
            { target: 20, operator: 'x', cells: [{r:3,c:4}, {r:3,c:5}] },
            { target: 3,  operator: 'x', cells: [{r:4,c:0}, {r:5,c:0}] },
            { target: 11, operator: '+', cells: [{r:4,c:4}, {r:5,c:4}] },
            { target: 4,  operator: 'x', cells: [{r:4,c:5}, {r:5,c:5}] },
            { target: 10, operator: 'x', cells: [{r:5,c:1}, {r:5,c:2}] },
            { target: 3,  operator: '',  cells: [{r:5,c:3}] }
        ]
    }
];

export class MathdokuPuzzleScene extends Phaser.Scene {
    private readonly N: number = 6;
    private readonly tileSize: number = 60; 
    private readonly boardOffsetX: number = 120; 
    private readonly boardOffsetY: number = 60; 

    private currentPuzzleIndex: number = 0;
    private currentBoard: number[][] = [];
    private solutionBoard: number[][] = [];

    private selectedCell: CellPosition | null = null;
    
    // 테스트 시 이 값을 true로 바꾸면 시작하자마자 클리어 창이 뜹니다.
    private isCleared: boolean = false;

    private titleText!: Phaser.GameObjects.Text;
    private instructionText!: Phaser.GameObjects.Text;

    private submitButtonBg!: Phaser.GameObjects.Rectangle;
    private submitButtonText!: Phaser.GameObjects.Text;
    private resetButtonBg!: Phaser.GameObjects.Rectangle;
    private resetButtonText!: Phaser.GameObjects.Text;

    private tiles: Phaser.GameObjects.Rectangle[][] = [];
    private cellTexts: Phaser.GameObjects.Text[][] = [];
    private gridGraphics!: Phaser.GameObjects.Graphics;
    private cageLabels: Phaser.GameObjects.Text[] = [];
    private successWindow!: Phaser.GameObjects.Container;

    private keypadButtons: {
        bg: Phaser.GameObjects.Rectangle;
        text: Phaser.GameObjects.Text;
        val: number;
    }[] = [];

    constructor() {
        super({ key: 'MathdokuPuzzleScene' });
    }

    create(): void {
        this.gridGraphics = this.add.graphics();
        this.initBoardArrays();

        this.drawBoard();
        this.drawHeaderUI();
        this.drawKeypad();
        this.drawBottomUI();
        this.createSuccessWindow();

        this.loadPuzzle(0);
        this.setupKeyboardInput();

        // 🔥 처음 시작 시 isCleared 상태를 감지하여 클리어 처리
        if (this.isCleared) {
            this.successWindow.setVisible(true);
            
            // 보드판을 빈칸으로 초기화
            this.currentBoard = Array.from({ length: this.N }, () => Array(this.N).fill(0));
            this.selectedCell = null;
            this.refreshTextDisplay();
            this.updateGameState();
        }
    }

    private initBoardArrays(): void {
        for (let r = 0; r < this.N; r++) {
            this.tiles[r] = [];
            this.cellTexts[r] = [];
        }
    }

    private loadPuzzle(index: number): void {
        this.currentPuzzleIndex = index;
        const puzzle = PUZZLES[index];

        this.currentBoard = Array.from({ length: this.N }, () => Array(this.N).fill(0));
        this.solutionBoard = puzzle.solution.map(row => [...row]);

        this.selectedCell = null;
        
        // 외부에서 isCleared를 true로 세팅했을 수 있으므로 강제 false 처리를 조건부로 변경
        if (!this.isCleared) {
            if (this.successWindow) this.successWindow.setVisible(false);
        }

        this.drawGridLinesAndCages(); 
        this.refreshTextDisplay();
        this.updateGameState();
    }

    private drawHeaderUI(): void {
        this.titleText = this.add.text(
            this.boardOffsetX,
            20,
            '연산 스도쿠 (6x6)',
            { fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold' }
        ).setOrigin(0, 0.5);
    }

    private drawBoard(): void {
        for (let r = 0; r < this.N; r++) {
            for (let c = 0; c < this.N; c++) {
                const x = this.boardOffsetX + c * this.tileSize + this.tileSize / 2;
                const y = this.boardOffsetY + r * this.tileSize + this.tileSize / 2;

                const tile = this.add.rectangle(x, y, this.tileSize - 2, this.tileSize - 2, 0x25283a);
                tile.setInteractive({ useHandCursor: true });
                tile.on('pointerdown', () => this.handleCellClick(r, c));

                const text = this.add.text(x, y + 6, '', {
                    fontSize: '28px',
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    color: '#ffffff'
                }).setOrigin(0.5);

                this.tiles[r][c] = tile;
                this.cellTexts[r][c] = text;
            }
        }
    }

    private drawGridLinesAndCages(): void {
        this.gridGraphics.clear();
        this.cageLabels.forEach(label => label.destroy());
        this.cageLabels = [];

        const boardWidth = this.N * this.tileSize;
        const boardHeight = this.N * this.tileSize;

        // 1. 기본 얇은 격자 그리기
        this.gridGraphics.lineStyle(1, 0x44475a, 0.5);
        for (let i = 0; i <= this.N; i++) {
            const lineX = this.boardOffsetX + i * this.tileSize;
            const lineY = this.boardOffsetY + i * this.tileSize;

            this.gridGraphics.strokeLineShape(new Phaser.Geom.Line(lineX, this.boardOffsetY, lineX, this.boardOffsetY + boardHeight));
            this.gridGraphics.strokeLineShape(new Phaser.Geom.Line(this.boardOffsetX, lineY, this.boardOffsetX + boardWidth, lineY));
        }

        // 2. 케이지 굵은 테두리와 라벨 그리기
        this.gridGraphics.lineStyle(3, 0xffffff, 1);
        const puzzle = PUZZLES[this.currentPuzzleIndex];

        puzzle.cages.forEach(cage => {
            let topLeft = cage.cells[0];
            cage.cells.forEach(c => {
                if (c.r < topLeft.r || (c.r === topLeft.r && c.c < topLeft.c)) {
                    topLeft = c;
                }
            });

            const labelX = this.boardOffsetX + topLeft.c * this.tileSize + 4;
            const labelY = this.boardOffsetY + topLeft.r * this.tileSize + 4;
            
            const label = this.add.text(labelX, labelY, `${cage.target}${cage.operator}`, {
                fontSize: '14px', color: '#ffcc00', fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(0, 0);
            this.cageLabels.push(label);

            cage.cells.forEach(c => {
                const x = this.boardOffsetX + c.c * this.tileSize;
                const y = this.boardOffsetY + c.r * this.tileSize;

                if (!cage.cells.find(o => o.r === c.r - 1 && o.c === c.c)) {
                    this.gridGraphics.strokeLineShape(new Phaser.Geom.Line(x, y, x + this.tileSize, y));
                }
                if (!cage.cells.find(o => o.r === c.r + 1 && o.c === c.c)) {
                    this.gridGraphics.strokeLineShape(new Phaser.Geom.Line(x, y + this.tileSize, x + this.tileSize, y + this.tileSize));
                }
                if (!cage.cells.find(o => o.r === c.r && o.c === c.c - 1)) {
                    this.gridGraphics.strokeLineShape(new Phaser.Geom.Line(x, y, x, y + this.tileSize));
                }
                if (!cage.cells.find(o => o.r === c.r && o.c === c.c + 1)) {
                    this.gridGraphics.strokeLineShape(new Phaser.Geom.Line(x + this.tileSize, y, x + this.tileSize, y + this.tileSize));
                }
            });
        });
    }

    private drawKeypad(): void {
        const keypadY = this.boardOffsetY + this.N * this.tileSize + 35; 
        const startX = 110; 
        const buttonWidth = 46;
        const buttonGap = 10; 

        for (let i = 1; i <= this.N; i++) {
            const bx = startX + (i - 1) * (buttonWidth + buttonGap) + buttonWidth / 2;
            const bg = this.add.rectangle(bx, keypadY, buttonWidth, 46, 0x3b3e5b).setOrigin(0.5);
            bg.setInteractive({ useHandCursor: true });

            const text = this.add.text(bx, keypadY, `${i}`, {
                fontSize: '20px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(0.5);

            bg.on('pointerdown', () => this.inputNumber(i));
            bg.on('pointerover', () => bg.setFillStyle(0x50547b));
            bg.on('pointerout', () => bg.setFillStyle(0x3b3e5b));

            this.keypadButtons.push({ bg, text, val: i });
        }

        const eraseX = startX + this.N * (buttonWidth + buttonGap) + buttonWidth / 2 + 5; 
        const eraseBg = this.add.rectangle(eraseX, keypadY, 56, 46, 0x5a3b3b).setOrigin(0.5);
        eraseBg.setInteractive({ useHandCursor: true });

        const eraseText = this.add.text(eraseX, keypadY, '지우기', {
            fontSize: '14px', color: '#ff8888', fontFamily: 'Arial'
        }).setOrigin(0.5);

        eraseBg.on('pointerdown', () => this.inputNumber(0));
        eraseBg.on('pointerover', () => eraseBg.setFillStyle(0x7a4b4b));
        eraseBg.on('pointerout', () => eraseBg.setFillStyle(0x5a3b3b));

        this.keypadButtons.push({ bg: eraseBg, text: eraseText, val: 0 });
    }

    private drawBottomUI(): void {
        const uiY = this.boardOffsetY + this.N * this.tileSize + 95;

        this.instructionText = this.add.text(
            300, 
            uiY,
            '셀 선택 후 키패드나 키보드(1~6)로 입력하세요',
            { fontSize: '15px', color: '#aaaaaa', fontFamily: 'Arial' }
        ).setOrigin(0.5, 0.5);

        const btnY = uiY + 40; 
        const submitX = 240; 
        const resetX = 360; 

        this.submitButtonBg = this.add.rectangle(submitX, btnY, 100, 36, 0x555555).setOrigin(0.5);
        this.submitButtonText = this.add.text(submitX, btnY, '정답', {
            fontSize: '15px', color: '#aaaaaa', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.submitButtonBg.on('pointerdown', () => {
            if (this.submitButtonBg.input?.enabled && !this.isCleared) {
                this.checkSolution();
            }
        });

        this.resetButtonBg = this.add.rectangle(resetX, btnY, 90, 36, 0x883333).setOrigin(0.5);
        this.resetButtonText = this.add.text(resetX, btnY, '초기화', {
            fontSize: '15px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.resetButtonBg.setInteractive({ useHandCursor: true });
        this.resetButtonBg.on('pointerdown', () => {
            if (!this.isCleared) this.resetBoard();
        });
        this.resetButtonBg.on('pointerover', () => {
            if (!this.isCleared) this.resetButtonBg.setFillStyle(0xaa4444);
        });
        this.resetButtonBg.on('pointerout', () => {
            if (!this.isCleared) this.resetButtonBg.setFillStyle(0x883333);
        });
    }

    private setupKeyboardInput(): void {
        this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
            if (this.isCleared) return;

            const key = event.key;
            if (key >= '1' && key <= `${this.N}`) {
                this.inputNumber(parseInt(key, 10));
            } else if (key === 'Backspace' || key === 'Delete' || key === '0' || key.toLowerCase() === 'x') {
                this.inputNumber(0);
            } else if (key === 'ArrowUp' && this.selectedCell) {
                const r = Math.max(0, this.selectedCell.r - 1);
                this.handleCellClick(r, this.selectedCell.c);
            } else if (key === 'ArrowDown' && this.selectedCell) {
                const r = Math.min(this.N - 1, this.selectedCell.r + 1);
                this.handleCellClick(r, this.selectedCell.c);
            } else if (key === 'ArrowLeft' && this.selectedCell) {
                const c = Math.max(0, this.selectedCell.c - 1);
                this.handleCellClick(this.selectedCell.r, c);
            } else if (key === 'ArrowRight' && this.selectedCell) {
                const c = Math.min(this.N - 1, this.selectedCell.c + 1);
                this.handleCellClick(this.selectedCell.r, c);
            }
        });
    }

    private handleCellClick(r: number, c: number): void {
        if (this.isCleared) return;
        this.selectedCell = { r, c };
        this.updateGameState();
    }

    private inputNumber(val: number): void {
        if (this.isCleared || !this.selectedCell) return;
        const { r, c } = this.selectedCell;

        this.currentBoard[r][c] = val;
        this.refreshCellText(r, c);
        this.updateGameState();
    }

    private refreshTextDisplay(): void {
        for (let r = 0; r < this.N; r++) {
            for (let c = 0; c < this.N; c++) {
                this.refreshCellText(r, c);
            }
        }
    }

    private refreshCellText(r: number, c: number): void {
        if (!this.cellTexts[r]) return;
        const textObj = this.cellTexts[r][c];
        if (!textObj) return;

        const val = this.currentBoard[r][c];

        if (val === 0) {
            textObj.setText('');
        } else {
            textObj.setText(`${val}`);
            textObj.setColor('#ffffff'); 
        }
    }

    private checkConflicts(): boolean[][] {
        const conflicts: boolean[][] = Array.from({ length: this.N }, () => Array(this.N).fill(false));

        for (let i = 0; i < this.N; i++) {
            const rowSeen = new Map<number, number[]>();
            const colSeen = new Map<number, number[]>();
            
            for (let j = 0; j < this.N; j++) {
                const rVal = this.currentBoard[i][j];
                if (rVal !== 0) {
                    if (!rowSeen.has(rVal)) rowSeen.set(rVal, []);
                    rowSeen.get(rVal)!.push(j);
                }
                
                const cVal = this.currentBoard[j][i];
                if (cVal !== 0) {
                    if (!colSeen.has(cVal)) colSeen.set(cVal, []);
                    colSeen.get(cVal)!.push(j); 
                }
            }

            rowSeen.forEach(cols => {
                if (cols.length > 1) cols.forEach(c => conflicts[i][c] = true);
            });
            colSeen.forEach(rows => {
                if (rows.length > 1) rows.forEach(r => conflicts[r][i] = true);
            });
        }

        const puzzle = PUZZLES[this.currentPuzzleIndex];
        puzzle.cages.forEach(cage => {
            let isFull = true;
            const values: number[] = [];
            
            cage.cells.forEach(c => {
                const val = this.currentBoard[c.r][c.c];
                if (val === 0) isFull = false;
                else values.push(val);
            });

            if (isFull) {
                let result = 0;
                if (cage.operator === '+') {
                    result = values.reduce((a, b) => a + b, 0);
                } else if (cage.operator === 'x') {
                    result = values.reduce((a, b) => a * b, 1);
                } else if (cage.operator === '') {
                    result = values[0];
                }

                if (result !== cage.target) {
                    cage.cells.forEach(c => conflicts[c.r][c.c] = true);
                }
            }
        });

        return conflicts;
    }

    private updateGameState(): void {
        if (!this.tiles || this.tiles.length === 0) return;
        const conflicts = this.checkConflicts();
        const selectedVal = this.selectedCell
            ? this.currentBoard[this.selectedCell.r][this.selectedCell.c]
            : 0;

        for (let r = 0; r < this.N; r++) {
            for (let c = 0; c < this.N; c++) {
                const tile = this.tiles[r]?.[c];
                if (!tile) continue;

                const isLight = (r + c) % 2 === 0;
                const baseColor = isLight ? 0x272a3d : 0x222538;

                const isSelected = this.selectedCell?.r === r && this.selectedCell?.c === c;
                const isRelated = this.selectedCell && (this.selectedCell.r === r || this.selectedCell.c === c);
                const isSameValue = selectedVal !== 0 && this.currentBoard[r][c] === selectedVal;
                const isConflict = conflicts[r][c];

                if (isConflict) {
                    tile.setFillStyle(0x772233);
                } else if (isSelected) {
                    tile.setFillStyle(0x665500);
                } else if (isSameValue) {
                    tile.setFillStyle(0x1e4959);
                } else if (isRelated) {
                    tile.setFillStyle(0x32364d);
                } else {
                    tile.setFillStyle(baseColor);
                }

                if (isSelected) {
                    tile.setStrokeStyle(2, 0xffcc00);
                } else if (isConflict) {
                    tile.setStrokeStyle(2, 0xff5555);
                } else {
                    tile.setStrokeStyle(0);
                }
            }
        }

        const isFull = this.currentBoard.every(row => row.every(val => val !== 0));
        const hasNoConflict = !conflicts.some(row => row.some(c => c));

        if (this.submitButtonBg && this.submitButtonText) {
            if (isFull && hasNoConflict && !this.isCleared) {
                this.submitButtonBg.setFillStyle(0x28a745);
                this.submitButtonText.setColor('#ffffff');
                this.submitButtonBg.setInteractive({ useHandCursor: true });
            } else {
                this.submitButtonBg.setFillStyle(0x555555);
                this.submitButtonText.setColor('#aaaaaa');
                this.submitButtonBg.disableInteractive();
            }
        }
    }

    private checkSolution(): void {
        let isCorrect = true;
        for (let r = 0; r < this.N; r++) {
            for (let c = 0; c < this.N; c++) {
                if (this.currentBoard[r][c] !== this.solutionBoard[r][c]) {
                    isCorrect = false;
                    break;
                }
            }
        }

        if (isCorrect) {
            this.isCleared = true;
            this.successWindow.setVisible(true);
            this.game.events.emit(DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT);
            
            this.currentBoard = Array.from({ length: this.N }, () => Array(this.N).fill(0));
            this.selectedCell = null;
            this.refreshTextDisplay();

            this.updateGameState();
        } else {
            this.cameras.main.shake(200, 0.005);
        }
    }

    private resetBoard(): void {
        this.currentBoard = Array.from({ length: this.N }, () => Array(this.N).fill(0));
        this.selectedCell = null;
        this.isCleared = false;
        
        this.refreshTextDisplay();
        this.updateGameState();
    }

    private createSuccessWindow(): void {
        this.successWindow = this.add.container(0, 0);

        const overlay = this.add.rectangle(300, 300, 600, 600, 0x000000, 0.75);
        overlay.setInteractive(); 

        const panel = this.add.rectangle(300, 300, 360, 150, 0x1e1e2e).setStrokeStyle(4, 0xffcc00);

        // 🔥 보조 텍스트 없이 중앙(Y:300)에 딱 맞게 정렬
        const successText = this.add.text(300, 300, '% : hell', {
            fontSize: '24px',
            color: '#ffcc00',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        this.successWindow.add([overlay, panel, successText]);
        this.successWindow.setDepth(100);
        this.successWindow.setVisible(false);
    }
}
