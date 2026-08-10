// import * as Phaser from 'phaser';

// interface CellPosition {
//     row: number;
//     col: number;
// }

// interface PuzzleData {
//     id: number;
//     name: string;
//     initial: number[][];
//     solution: number[][];
// }

// const PUZZLES: PuzzleData[] = [
//     {
//         id: 1,
//         name: '퍼즐 1 (쉬움)',
//         initial: [
//             [5, 3, 0, 0, 7, 0, 0, 0, 0],
//             [6, 0, 0, 1, 9, 5, 0, 0, 0],
//             [0, 9, 8, 0, 0, 0, 0, 6, 0],

//             [8, 0, 0, 0, 6, 0, 0, 0, 3],
//             [4, 0, 0, 8, 0, 3, 0, 0, 1],
//             [7, 0, 0, 0, 2, 0, 0, 0, 6],

//             [0, 6, 0, 0, 0, 0, 2, 8, 0],
//             [0, 0, 0, 4, 1, 9, 0, 0, 5],
//             [0, 0, 0, 0, 8, 0, 0, 7, 9]
//         ],
//         solution: [
//             [5, 3, 4, 6, 7, 8, 9, 1, 2],
//             [6, 7, 2, 1, 9, 5, 3, 4, 8],
//             [1, 9, 8, 3, 4, 2, 5, 6, 7],

//             [8, 5, 9, 7, 6, 1, 4, 2, 3],
//             [4, 2, 6, 8, 5, 3, 7, 9, 1],
//             [7, 1, 3, 9, 2, 4, 8, 5, 6],

//             [9, 6, 1, 5, 3, 7, 2, 8, 4],
//             [2, 8, 7, 4, 1, 9, 6, 3, 5],
//             [3, 4, 5, 2, 8, 6, 1, 7, 9]
//         ]
//     }
// ];

// export class SudokuScene extends Phaser.Scene {
//     private readonly N: number = 9;
//     private readonly tileSize: number = 46;
//     private readonly boardOffsetX: number = 93;
//     private readonly boardOffsetY: number = 45; 

//     private currentPuzzleIndex: number = 0;
//     private initialBoard: number[][] = [];
//     private currentBoard: number[][] = [];
//     private solutionBoard: number[][] = [];

//     private selectedCell: CellPosition | null = null;
//     private isCleared: boolean = false;

//     private titleText!: Phaser.GameObjects.Text;
//     private instructionText!: Phaser.GameObjects.Text;
//     private clearMarkText!: Phaser.GameObjects.Text;

//     private submitButtonBg!: Phaser.GameObjects.Rectangle;
//     private submitButtonText!: Phaser.GameObjects.Text;
//     private resetButtonBg!: Phaser.GameObjects.Rectangle;
//     private resetButtonText!: Phaser.GameObjects.Text;
//     private hintButtonBg!: Phaser.GameObjects.Rectangle;
//     private hintButtonText!: Phaser.GameObjects.Text;

//     private tiles: Phaser.GameObjects.Rectangle[][] = [];
//     private cellTexts: Phaser.GameObjects.Text[][] = [];
//     private gridGraphics!: Phaser.GameObjects.Graphics;
//     private successWindow!: Phaser.GameObjects.Container;

//     private keypadButtons: {
//         bg: Phaser.GameObjects.Rectangle;
//         text: Phaser.GameObjects.Text;
//         val: number;
//     }[] = [];

//     constructor() {
//         super({ key: 'SudokuScene' });
//     }

//     create(): void {
//         this.gridGraphics = this.add.graphics();
//         this.initBoardArrays();

//         this.drawBoard();
//         this.drawHeaderUI();
//         this.drawKeypad();
//         this.drawBottomUI();
//         this.createSuccessWindow();

//         this.loadPuzzle(0);
//         this.setupKeyboardInput();

//         if (this.isCleared) {
//             this.clearMarkText.setVisible(true);
//             this.successWindow.setVisible(true);
//         }
//     }

//     private initBoardArrays(): void {
//         for (let r = 0; r < this.N; r++) {
//             this.tiles[r] = [];
//             this.cellTexts[r] = [];
//         }
//     }

//     private loadPuzzle(index: number): void {
//         this.currentPuzzleIndex = index;
//         const puzzle = PUZZLES[index];

//         this.initialBoard = puzzle.initial.map(row => [...row]);
//         this.currentBoard = puzzle.initial.map(row => [...row]);
//         this.solutionBoard = puzzle.solution.map(row => [...row]);

//         this.selectedCell = null;
//         this.isCleared = false;

//         if (this.clearMarkText) {
//             this.clearMarkText.setVisible(false);
//         }
//         if (this.successWindow) {
//             this.successWindow.setVisible(false);
//         }

//         this.refreshTextDisplay();
//         this.updateGameState();
//     }

//     private drawHeaderUI(): void {
//         this.titleText = this.add.text(
//             this.boardOffsetX,
//             20,
//             '스도쿠 (Sudoku)',
//             { fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold' }
//         ).setOrigin(0, 0.5);

//         this.clearMarkText = this.add.text(
//             500,
//             20,
//             'CLEAR!',
//             { fontSize: '24px', color: '#ffcc00', fontFamily: 'Arial', fontStyle: 'bold' }
//         ).setOrigin(0.5);
//         this.clearMarkText.setVisible(this.isCleared);
//     }

//     private drawBoard(): void {
//         for (let r = 0; r < this.N; r++) {
//             for (let c = 0; c < this.N; c++) {
//                 const x = this.boardOffsetX + c * this.tileSize + this.tileSize / 2;
//                 const y = this.boardOffsetY + r * this.tileSize + this.tileSize / 2;

//                 const tile = this.add.rectangle(x, y, this.tileSize - 2, this.tileSize - 2, 0x25283a);
//                 tile.setInteractive({ useHandCursor: true });
//                 tile.on('pointerdown', () => this.handleCellClick(r, c));

//                 const text = this.add.text(x, y, '', {
//                     fontSize: '22px',
//                     fontFamily: 'Arial',
//                     fontStyle: 'bold',
//                     color: '#ffffff'
//                 }).setOrigin(0.5);

//                 this.tiles[r][c] = tile;
//                 this.cellTexts[r][c] = text;
//             }
//         }

//         this.drawGridLines();
//     }

//     private drawGridLines(): void {
//         this.gridGraphics.clear();

//         const boardWidth = this.N * this.tileSize;
//         const boardHeight = this.N * this.tileSize;

//         for (let i = 0; i <= this.N; i++) {
//             const isThick = i % 3 === 0;
//             const lineX = this.boardOffsetX + i * this.tileSize;
//             const lineY = this.boardOffsetY + i * this.tileSize;

//             this.gridGraphics.lineStyle(
//                 isThick ? 3 : 1,
//                 isThick ? 0xffcc00 : 0x44475a,
//                 isThick ? 0.9 : 0.5
//             );

//             this.gridGraphics.strokeLineShape(new Phaser.Geom.Line(
//                 lineX, this.boardOffsetY,
//                 lineX, this.boardOffsetY + boardHeight
//             ));

//             this.gridGraphics.strokeLineShape(new Phaser.Geom.Line(
//                 this.boardOffsetX, lineY,
//                 this.boardOffsetX + boardWidth, lineY
//             ));
//         }
//     }

//     private drawKeypad(): void {
//         const keypadY = this.boardOffsetY + this.N * this.tileSize + 25; 
//         const startX = 80; 
//         const buttonWidth = 38;
//         const buttonGap = 8; 

//         for (let i = 1; i <= 9; i++) {
//             const bx = startX + (i - 1) * (buttonWidth + buttonGap) + buttonWidth / 2;
//             const bg = this.add.rectangle(bx, keypadY, buttonWidth, 38, 0x3b3e5b).setOrigin(0.5);
//             bg.setInteractive({ useHandCursor: true });

//             const text = this.add.text(bx, keypadY, `${i}`, {
//                 fontSize: '18px',
//                 color: '#ffffff',
//                 fontFamily: 'Arial',
//                 fontStyle: 'bold'
//             }).setOrigin(0.5);

//             bg.on('pointerdown', () => this.inputNumber(i));
//             bg.on('pointerover', () => bg.setFillStyle(0x50547b));
//             bg.on('pointerout', () => bg.setFillStyle(0x3b3e5b));

//             this.keypadButtons.push({ bg, text, val: i });
//         }

//         const eraseX = startX + 9 * (buttonWidth + buttonGap) + 24; 
//         const eraseBg = this.add.rectangle(eraseX, keypadY, 48, 38, 0x5a3b3b).setOrigin(0.5);
//         eraseBg.setInteractive({ useHandCursor: true });

//         const eraseText = this.add.text(eraseX, keypadY, '지우기', {
//             fontSize: '13px',
//             color: '#ff8888',
//             fontFamily: 'Arial'
//         }).setOrigin(0.5);

//         eraseBg.on('pointerdown', () => this.inputNumber(0));
//         eraseBg.on('pointerover', () => eraseBg.setFillStyle(0x7a4b4b));
//         eraseBg.on('pointerout', () => eraseBg.setFillStyle(0x5a3b3b));

//         this.keypadButtons.push({ bg: eraseBg, text: eraseText, val: 0 });
//     }

//     private drawBottomUI(): void {
//         const uiY = this.boardOffsetY + this.N * this.tileSize + 65;

//         this.instructionText = this.add.text(
//             300, 
//             uiY,
//             '셀 선택 후 키패드나 키보드(1-9)로 입력하세요',
//             { fontSize: '14px', color: '#aaaaaa', fontFamily: 'Arial' }
//         ).setOrigin(0.5, 0.5);

//         const btnY = uiY + 35; 

//         const resetX = 300; 
//         const submitX = resetX - 45 - 20 - 50; 
//         const hintX = resetX + 45 + 20 + 40;   

//         this.submitButtonBg = this.add.rectangle(submitX, btnY, 100, 36, 0x555555).setOrigin(0.5);
//         this.submitButtonText = this.add.text(submitX, btnY, '정답 확인', {
//             fontSize: '15px', color: '#aaaaaa', fontFamily: 'Arial', fontStyle: 'bold'
//         }).setOrigin(0.5);

//         this.submitButtonBg.on('pointerdown', () => {
//             if (this.submitButtonBg.input?.enabled && !this.isCleared) {
//                 this.checkSolution();
//             }
//         });

//         this.resetButtonBg = this.add.rectangle(resetX, btnY, 90, 36, 0x883333).setOrigin(0.5);
//         this.resetButtonText = this.add.text(resetX, btnY, '초기화', {
//             fontSize: '15px', color: '#ffffff', fontFamily: 'Arial'
//         }).setOrigin(0.5);

//         this.resetButtonBg.setInteractive({ useHandCursor: true });
//         this.resetButtonBg.on('pointerdown', () => {
//             if (!this.isCleared) this.resetBoard();
//         });
//         this.resetButtonBg.on('pointerover', () => {
//             if (!this.isCleared) this.resetButtonBg.setFillStyle(0xaa4444);
//         });
//         this.resetButtonBg.on('pointerout', () => {
//             if (!this.isCleared) this.resetButtonBg.setFillStyle(0x883333);
//         });

//         this.hintButtonBg = this.add.rectangle(hintX, btnY, 80, 36, 0xd97706).setOrigin(0.5);
//         this.hintButtonText = this.add.text(hintX, btnY, '힌트', {
//             fontSize: '15px', color: '#ffffff', fontFamily: 'Arial'
//         }).setOrigin(0.5);

//         this.hintButtonBg.setInteractive({ useHandCursor: true });
//         this.hintButtonBg.on('pointerdown', () => {
//             if (!this.isCleared) this.giveHint();
//         });
//         this.hintButtonBg.on('pointerover', () => {
//             if (!this.isCleared) this.hintButtonBg.setFillStyle(0xf59e0b);
//         });
//         this.hintButtonBg.on('pointerout', () => {
//             if (!this.isCleared) this.hintButtonBg.setFillStyle(0xd97706);
//         });
//     }

//     private setupKeyboardInput(): void {
//         this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
//             if (this.isCleared) return;

//             const key = event.key;
//             if (key >= '1' && key <= '9') {
//                 this.inputNumber(parseInt(key, 10));
//             } else if (key === 'Backspace' || key === 'Delete' || key === '0' || key.toLowerCase() === 'x') {
//                 this.inputNumber(0);
//             } else if (key === 'ArrowUp' && this.selectedCell) {
//                 const r = Math.max(0, this.selectedCell.row - 1);
//                 this.handleCellClick(r, this.selectedCell.col);
//             } else if (key === 'ArrowDown' && this.selectedCell) {
//                 const r = Math.min(this.N - 1, this.selectedCell.row + 1);
//                 this.handleCellClick(r, this.selectedCell.col);
//             } else if (key === 'ArrowLeft' && this.selectedCell) {
//                 const c = Math.max(0, this.selectedCell.col - 1);
//                 this.handleCellClick(this.selectedCell.row, c);
//             } else if (key === 'ArrowRight' && this.selectedCell) {
//                 const c = Math.min(this.N - 1, this.selectedCell.col + 1);
//                 this.handleCellClick(this.selectedCell.row, c);
//             }
//         });
//     }

//     private handleCellClick(row: number, col: number): void {
//         if (this.isCleared) return;
//         this.selectedCell = { row, col };
//         this.updateGameState();
//     }

//     private inputNumber(val: number): void {
//         if (this.isCleared || !this.selectedCell) return;
//         const { row, col } = this.selectedCell;

//         if (this.initialBoard[row][col] !== 0) return;

//         this.currentBoard[row][col] = val;
//         this.refreshCellText(row, col);
//         this.updateGameState();
//     }

//     private refreshTextDisplay(): void {
//         for (let r = 0; r < this.N; r++) {
//             for (let c = 0; c < this.N; c++) {
//                 this.refreshCellText(r, c);
//             }
//         }
//     }

//     private refreshCellText(r: number, c: number): void {
//         if (!this.cellTexts[r]) return;
//         const textObj = this.cellTexts[r][c];
//         if (!textObj) return;

//         const val = this.currentBoard[r][c];
//         const isGiven = this.initialBoard[r][c] !== 0;

//         if (val === 0) {
//             textObj.setText('');
//         } else {
//             textObj.setText(`${val}`);
//             textObj.setColor(isGiven ? '#ffffff' : '#ffcc00');
//         }
//     }

//     private checkConflicts(): boolean[][] {
//         const conflicts: boolean[][] = Array.from({ length: 9 }, () => Array(9).fill(false));

//         for (let r = 0; r < 9; r++) {
//             const seen = new Map<number, number[]>();
//             for (let c = 0; c < 9; c++) {
//                 const val = this.currentBoard[r][c];
//                 if (val !== 0) {
//                     if (!seen.has(val)) seen.set(val, []);
//                     seen.get(val)!.push(c);
//                 }
//             }
//             for (const [_, cols] of seen) {
//                 if (cols.length > 1) {
//                     cols.forEach(c => conflicts[r][c] = true);
//                 }
//             }
//         }

//         for (let c = 0; c < 9; c++) {
//             const seen = new Map<number, number[]>();
//             for (let r = 0; r < 9; r++) {
//                 const val = this.currentBoard[r][c];
//                 if (val !== 0) {
//                     if (!seen.has(val)) seen.set(val, []);
//                     seen.get(val)!.push(r);
//                 }
//             }
//             for (const [_, rows] of seen) {
//                 if (rows.length > 1) {
//                     rows.forEach(r => conflicts[r][c] = true);
//                 }
//             }
//         }

//         for (let boxR = 0; boxR < 3; boxR++) {
//             for (let boxC = 0; boxC < 3; boxC++) {
//                 const seen = new Map<number, { r: number; c: number }[]>();
//                 for (let r = boxR * 3; r < boxR * 3 + 3; r++) {
//                     for (let c = boxC * 3; c < boxC * 3 + 3; c++) {
//                         const val = this.currentBoard[r][c];
//                         if (val !== 0) {
//                             if (!seen.has(val)) seen.set(val, []);
//                             seen.get(val)!.push({ r, c });
//                         }
//                     }
//                 }
//                 for (const [_, cells] of seen) {
//                     if (cells.length > 1) {
//                         cells.forEach(cell => conflicts[cell.r][cell.c] = true);
//                     }
//                 }
//             }
//         }

//         return conflicts;
//     }

//     private updateGameState(): void {
//         if (!this.tiles || this.tiles.length === 0) return;
//         const conflicts = this.checkConflicts();
//         const selectedVal = this.selectedCell
//             ? this.currentBoard[this.selectedCell.row][this.selectedCell.col]
//             : 0;

//         for (let r = 0; r < this.N; r++) {
//             for (let c = 0; c < this.N; c++) {
//                 const tile = this.tiles[r]?.[c];
//                 if (!tile) continue;

//                 const boxR = Math.floor(r / 3);
//                 const boxC = Math.floor(c / 3);
//                 const isAltBox = (boxR + boxC) % 2 === 1;

//                 let baseColor = isAltBox ? 0x1e2030 : 0x272a3d;

//                 if (this.initialBoard[r][c] !== 0) {
//                     baseColor = isAltBox ? 0x222538 : 0x2c3047;
//                 }

//                 const isSelected = this.selectedCell?.row === r && this.selectedCell?.col === c;
//                 const isRelated = this.selectedCell && (
//                     this.selectedCell.row === r ||
//                     this.selectedCell.col === c ||
//                     (Math.floor(this.selectedCell.row / 3) === boxR && Math.floor(this.selectedCell.col / 3) === boxC)
//                 );
//                 const isSameValue = selectedVal !== 0 && this.currentBoard[r][c] === selectedVal;
//                 const isConflict = conflicts[r][c];

//                 if (isConflict) {
//                     tile.setFillStyle(0x772233);
//                 } else if (isSelected) {
//                     tile.setFillStyle(0x665500);
//                 } else if (isSameValue) {
//                     tile.setFillStyle(0x1e4959);
//                 } else if (isRelated) {
//                     tile.setFillStyle(0x32364d);
//                 } else {
//                     tile.setFillStyle(baseColor);
//                 }

//                 if (isSelected) {
//                     tile.setStrokeStyle(2, 0xffcc00);
//                 } else if (isConflict) {
//                     tile.setStrokeStyle(2, 0xff5555);
//                 } else {
//                     tile.setStrokeStyle(0);
//                 }
//             }
//         }

//         const isFull = this.currentBoard.every(row => row.every(val => val !== 0));
//         const hasNoConflict = !conflicts.some(row => row.some(c => c));

//         if (this.submitButtonBg && this.submitButtonText) {
//             if (isFull && hasNoConflict && !this.isCleared) {
//                 this.submitButtonBg.setFillStyle(0x28a745);
//                 this.submitButtonText.setColor('#ffffff');
//                 this.submitButtonBg.setInteractive({ useHandCursor: true });
//             } else {
//                 this.submitButtonBg.setFillStyle(0x555555);
//                 this.submitButtonText.setColor('#aaaaaa');
//                 this.submitButtonBg.disableInteractive();
//             }
//         }
//     }

//     private checkSolution(): void {
//         let isCorrect = true;
//         for (let r = 0; r < 9; r++) {
//             for (let c = 0; c < 9; c++) {
//                 if (this.currentBoard[r][c] !== this.solutionBoard[r][c]) {
//                     isCorrect = false;
//                     break;
//                 }
//             }
//         }

//         if (isCorrect) {
//             this.isCleared = true;
//             this.clearMarkText.setVisible(true);
//             this.successWindow.setVisible(true);
//             this.updateGameState();
//         } else {
//             this.cameras.main.shake(200, 0.005);
//         }
//     }

//     private resetBoard(): void {
//         this.currentBoard = this.initialBoard.map(row => [...row]);
//         this.selectedCell = null;
//         this.isCleared = false;
        
//         if (this.clearMarkText) {
//             this.clearMarkText.setVisible(false);
//         }
        
//         this.refreshTextDisplay();
//         this.updateGameState();
//     }

//     private giveHint(): void {
//         const emptyOrWrong: CellPosition[] = [];
//         for (let r = 0; r < 9; r++) {
//             for (let c = 0; c < 9; c++) {
//                 if (this.initialBoard[r][c] === 0 && this.currentBoard[r][c] !== this.solutionBoard[r][c]) {
//                     emptyOrWrong.push({ row: r, col: c });
//                 }
//             }
//         }

//         if (emptyOrWrong.length > 0) {
//             const randomIndex = Math.floor(Math.random() * emptyOrWrong.length);
//             const target = emptyOrWrong[randomIndex];
//             this.currentBoard[target.row][target.col] = this.solutionBoard[target.row][target.col];
//             this.selectedCell = target;
//             this.refreshCellText(target.row, target.col);
//             this.updateGameState();
//         }
//     }

//     private createSuccessWindow(): void {
//         this.successWindow = this.add.container(0, 0);

//         const overlay = this.add.rectangle(300, 300, 600, 600, 0x000000, 0.75);
//         overlay.setInteractive(); // 클릭 방지

//         // 버튼 없이 팝업 메시지만 출력
//         const panel = this.add.rectangle(300, 300, 360, 150, 0x1e1e2e).setStrokeStyle(4, 0xffcc00);

//         const successText = this.add.text(300, 275, '🎉 스도쿠 퍼즐 클리어!', {
//             fontSize: '24px',
//             color: '#ffcc00',
//             fontFamily: 'Arial',
//             fontStyle: 'bold',
//             align: 'center'
//         }).setOrigin(0.5);

//         const subText = this.add.text(300, 315, '모든 숫자를 정확히 맞추셨습니다!', {
//             fontSize: '15px',
//             color: '#ffffff',
//             fontFamily: 'Arial',
//             align: 'center'
//         }).setOrigin(0.5);

//         this.successWindow.add([overlay, panel, successText, subText]);
//         this.successWindow.setDepth(100);
//         this.successWindow.setVisible(false);
//     }
// }


import * as Phaser from 'phaser';

interface CellPosition {
    r: number;
    c: number;
}

interface Cage {
    target: number;
    operator: string; // '+', 'x', 또는 단일 칸일 경우 ''
    cells: CellPosition[];
}

interface PuzzleData {
    id: number;
    name: string;
    size: number;
    solution: number[][];
    cages: Cage[];
}

// 4x4 연산 스도쿠 (더하기, 곱하기만 사용)
const PUZZLES: PuzzleData[] = [
    {
        id: 1,
        name: '연산 퍼즐 (4x4)',
        size: 4,
        solution: [
            [2, 1, 3, 4],
            [3, 4, 2, 1],
            [4, 3, 1, 2],
            [1, 2, 4, 3]
        ],
        cages: [
            { target: 5, operator: '+', cells: [{r:0,c:0}, {r:1,c:0}] },       // 2 + 3
            { target: 4, operator: '+', cells: [{r:0,c:1}, {r:0,c:2}] },       // 1 + 3
            { target: 4, operator: 'x', cells: [{r:0,c:3}, {r:1,c:3}] },       // 4 x 1
            { target: 8, operator: 'x', cells: [{r:1,c:1}, {r:1,c:2}, {r:2,c:2}] }, // 4 x 2 x 1
            { target: 5, operator: '+', cells: [{r:2,c:0}, {r:3,c:0}] },       // 4 + 1
            { target: 5, operator: '+', cells: [{r:2,c:1}, {r:3,c:1}] },       // 3 + 2
            { target: 6, operator: 'x', cells: [{r:2,c:3}, {r:3,c:3}] },       // 2 x 3
            { target: 4, operator: '',  cells: [{r:3,c:2}] }                   // 4 (단일 칸)
        ]
    }
];

export class SudokuScene extends Phaser.Scene {
    private readonly N: number = 4;
    private readonly tileSize: number = 80;
    private readonly boardOffsetX: number = 140; // 4x4에 맞게 중앙 정렬
    private readonly boardOffsetY: number = 80; 

    private currentPuzzleIndex: number = 0;
    private currentBoard: number[][] = [];
    private solutionBoard: number[][] = [];

    private selectedCell: CellPosition | null = null;
    private isCleared: boolean = false;

    private titleText!: Phaser.GameObjects.Text;
    private instructionText!: Phaser.GameObjects.Text;
    private clearMarkText!: Phaser.GameObjects.Text;

    private submitButtonBg!: Phaser.GameObjects.Rectangle;
    private submitButtonText!: Phaser.GameObjects.Text;
    private resetButtonBg!: Phaser.GameObjects.Rectangle;
    private resetButtonText!: Phaser.GameObjects.Text;
    private hintButtonBg!: Phaser.GameObjects.Rectangle;
    private hintButtonText!: Phaser.GameObjects.Text;

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
        super({ key: 'MathdokuScene' });
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

        if (this.isCleared) {
            this.clearMarkText.setVisible(true);
            this.successWindow.setVisible(true);
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

        // 초기 보드는 모두 0으로 비워둡니다.
        this.currentBoard = Array.from({ length: this.N }, () => Array(this.N).fill(0));
        this.solutionBoard = puzzle.solution.map(row => [...row]);

        this.selectedCell = null;
        this.isCleared = false;

        if (this.clearMarkText) {
            this.clearMarkText.setVisible(false);
        }
        if (this.successWindow) {
            this.successWindow.setVisible(false);
        }

        this.drawGridLinesAndCages(); // 케이지 테두리와 라벨 그리기
        this.refreshTextDisplay();
        this.updateGameState();
    }

    private drawHeaderUI(): void {
        this.titleText = this.add.text(
            this.boardOffsetX,
            25,
            '연산 스도쿠 (+, x)',
            { fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold' }
        ).setOrigin(0, 0.5);

        this.clearMarkText = this.add.text(
            460,
            25,
            'CLEAR!',
            { fontSize: '24px', color: '#ffcc00', fontFamily: 'Arial', fontStyle: 'bold' }
        ).setOrigin(0.5);
        this.clearMarkText.setVisible(this.isCleared);
    }

    private drawBoard(): void {
        for (let r = 0; r < this.N; r++) {
            for (let c = 0; c < this.N; c++) {
                const x = this.boardOffsetX + c * this.tileSize + this.tileSize / 2;
                const y = this.boardOffsetY + r * this.tileSize + this.tileSize / 2;

                const tile = this.add.rectangle(x, y, this.tileSize - 2, this.tileSize - 2, 0x25283a);
                tile.setInteractive({ useHandCursor: true });
                tile.on('pointerdown', () => this.handleCellClick(r, c));

                // 숫자 텍스트 크기 키움
                const text = this.add.text(x, y + 8, '', {
                    fontSize: '32px',
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
        this.gridGraphics.lineStyle(4, 0xffffff, 1);
        const puzzle = PUZZLES[this.currentPuzzleIndex];

        puzzle.cages.forEach(cage => {
            // 라벨 위치 찾기 (가장 위쪽, 그리고 가장 왼쪽 셀)
            let topLeft = cage.cells[0];
            cage.cells.forEach(c => {
                if (c.r < topLeft.r || (c.r === topLeft.r && c.c < topLeft.c)) {
                    topLeft = c;
                }
            });

            const labelX = this.boardOffsetX + topLeft.c * this.tileSize + 6;
            const labelY = this.boardOffsetY + topLeft.r * this.tileSize + 6;
            
            const label = this.add.text(labelX, labelY, `${cage.target}${cage.operator}`, {
                fontSize: '16px', color: '#ffcc00', fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(0, 0);
            this.cageLabels.push(label);

            // 해당 케이지의 셀들을 순회하며 외곽선(벽) 그리기
            cage.cells.forEach(c => {
                const x = this.boardOffsetX + c.c * this.tileSize;
                const y = this.boardOffsetY + c.r * this.tileSize;

                // 윗벽
                if (!cage.cells.find(o => o.r === c.r - 1 && o.c === c.c)) {
                    this.gridGraphics.strokeLineShape(new Phaser.Geom.Line(x, y, x + this.tileSize, y));
                }
                // 아랫벽
                if (!cage.cells.find(o => o.r === c.r + 1 && o.c === c.c)) {
                    this.gridGraphics.strokeLineShape(new Phaser.Geom.Line(x, y + this.tileSize, x + this.tileSize, y + this.tileSize));
                }
                // 왼쪽벽
                if (!cage.cells.find(o => o.r === c.r && o.c === c.c - 1)) {
                    this.gridGraphics.strokeLineShape(new Phaser.Geom.Line(x, y, x, y + this.tileSize));
                }
                // 오른쪽벽
                if (!cage.cells.find(o => o.r === c.r && o.c === c.c + 1)) {
                    this.gridGraphics.strokeLineShape(new Phaser.Geom.Line(x + this.tileSize, y, x + this.tileSize, y + this.tileSize));
                }
            });
        });
    }

    private drawKeypad(): void {
        const keypadY = this.boardOffsetY + this.N * this.tileSize + 30; 
        const startX = 145; 
        const buttonWidth = 46;
        const buttonGap = 12; 

        // 4x4 이므로 숫자 1~4 까지만 생성
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

        const eraseX = startX + this.N * (buttonWidth + buttonGap) + 16; 
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
        const uiY = this.boardOffsetY + this.N * this.tileSize + 85;

        this.instructionText = this.add.text(
            300, 
            uiY,
            '셀 선택 후 키패드나 키보드(1~4)로 입력하세요',
            { fontSize: '15px', color: '#aaaaaa', fontFamily: 'Arial' }
        ).setOrigin(0.5, 0.5);

        const btnY = uiY + 40; 

        const resetX = 300; 
        const submitX = resetX - 45 - 20 - 50; 
        const hintX = resetX + 45 + 20 + 40;   

        this.submitButtonBg = this.add.rectangle(submitX, btnY, 100, 36, 0x555555).setOrigin(0.5);
        this.submitButtonText = this.add.text(submitX, btnY, '정답 확인', {
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

        this.hintButtonBg = this.add.rectangle(hintX, btnY, 80, 36, 0xd97706).setOrigin(0.5);
        this.hintButtonText = this.add.text(hintX, btnY, '힌트', {
            fontSize: '15px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.hintButtonBg.setInteractive({ useHandCursor: true });
        this.hintButtonBg.on('pointerdown', () => {
            if (!this.isCleared) this.giveHint();
        });
        this.hintButtonBg.on('pointerover', () => {
            if (!this.isCleared) this.hintButtonBg.setFillStyle(0xf59e0b);
        });
        this.hintButtonBg.on('pointerout', () => {
            if (!this.isCleared) this.hintButtonBg.setFillStyle(0xd97706);
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

    // 행, 열, 그리고 케이지(연산) 규칙 검증
    private checkConflicts(): boolean[][] {
        const conflicts: boolean[][] = Array.from({ length: this.N }, () => Array(this.N).fill(false));

        // 1. 행과 열 중복 체크
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
                    colSeen.get(cVal)!.push(j); // 여기선 j가 row 인덱스
                }
            }

            rowSeen.forEach(cols => {
                if (cols.length > 1) cols.forEach(c => conflicts[i][c] = true);
            });
            colSeen.forEach(rows => {
                if (rows.length > 1) rows.forEach(r => conflicts[r][i] = true);
            });
        }

        // 2. 케이지 연산 체크
        const puzzle = PUZZLES[this.currentPuzzleIndex];
        puzzle.cages.forEach(cage => {
            let isFull = true;
            let values: number[] = [];
            
            cage.cells.forEach(c => {
                const val = this.currentBoard[c.r][c.c];
                if (val === 0) isFull = false;
                else values.push(val);
            });

            // 해당 케이지가 다 채워졌을 때만 연산 결과 확인
            if (isFull) {
                let result = 0;
                if (cage.operator === '+') {
                    result = values.reduce((a, b) => a + b, 0);
                } else if (cage.operator === 'x') {
                    result = values.reduce((a, b) => a * b, 1);
                } else if (cage.operator === '') {
                    result = values[0];
                }

                // 결과가 타겟과 다르면 해당 케이지 전체를 에러로 표시
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

                // 체크보드 무늬 톤 분리
                const isLight = (r + c) % 2 === 0;
                let baseColor = isLight ? 0x272a3d : 0x222538;

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
            this.clearMarkText.setVisible(true);
            this.successWindow.setVisible(true);
            this.updateGameState();
        } else {
            this.cameras.main.shake(200, 0.005);
        }
    }

    private resetBoard(): void {
        this.currentBoard = Array.from({ length: this.N }, () => Array(this.N).fill(0));
        this.selectedCell = null;
        this.isCleared = false;
        
        if (this.clearMarkText) {
            this.clearMarkText.setVisible(false);
        }
        
        this.refreshTextDisplay();
        this.updateGameState();
    }

    private giveHint(): void {
        const emptyOrWrong: CellPosition[] = [];
        for (let r = 0; r < this.N; r++) {
            for (let c = 0; c < this.N; c++) {
                if (this.currentBoard[r][c] !== this.solutionBoard[r][c]) {
                    emptyOrWrong.push({ r, c });
                }
            }
        }

        if (emptyOrWrong.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyOrWrong.length);
            const target = emptyOrWrong[randomIndex];
            this.currentBoard[target.r][target.c] = this.solutionBoard[target.r][target.c];
            this.selectedCell = target;
            this.refreshCellText(target.r, target.c);
            this.updateGameState();
        }
    }

    private createSuccessWindow(): void {
        this.successWindow = this.add.container(0, 0);

        const overlay = this.add.rectangle(300, 300, 600, 600, 0x000000, 0.75);
        overlay.setInteractive(); // 뒤쪽 클릭 방지

        const panel = this.add.rectangle(300, 300, 360, 150, 0x1e1e2e).setStrokeStyle(4, 0xffcc00);

        const successText = this.add.text(300, 275, '🎉 연산 퍼즐 클리어!', {
            fontSize: '24px',
            color: '#ffcc00',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        const subText = this.add.text(300, 315, '모든 규칙을 완벽하게 맞추셨습니다!', {
            fontSize: '15px',
            color: '#ffffff',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);

        this.successWindow.add([overlay, panel, successText, subText]);
        this.successWindow.setDepth(100);
        this.successWindow.setVisible(false);
    }
}