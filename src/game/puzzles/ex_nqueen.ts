// import * as Phaser from 'phaser';

// interface Position {
//     row: number;
//     col: number;
// }

// interface Queen extends Position {
//     sprite: Phaser.GameObjects.Text;
// }

// export class NQueensScene extends Phaser.Scene {
//     private readonly N: number = 8;
//     private readonly targetQueens: number = 12; 
//     private readonly tileSize: number = 60;
//     private readonly boardOffset: number = 50;
    
//     private queens: Queen[] = [];
//     private walls: Position[] = [];
//     private statusText!: Phaser.GameObjects.Text;
//     private tiles: Phaser.GameObjects.Rectangle[][] = [];

//     constructor() {
//         super({ key: 'NQueensScene' });
//     }

//     create(): void {
//         this.initWalls(['a3', 'a5', 'b5', 'b7', 'c7', 'd1', 'd3', 'e6', 'e8', 'f2', 'g2', 'g4', 'h4', 'h6']);
        
//         for (let i = 0; i < this.N; i++) {
//             this.tiles[i] = [];
//         }

//         this.drawBoard();

//         this.statusText = this.add.text(
//             this.boardOffset, 
//             this.boardOffset + (this.N * this.tileSize) + 20, 
//             '빈 타일을 클릭하여 퀸을 배치하세요.', 
//             { fontSize: '24px', color: '#ffffff', fontFamily: 'Arial' }
//         );
        
//         const resetButton: Phaser.GameObjects.Text = this.add.text(
//             this.boardOffset + 400, 
//             this.boardOffset + (this.N * this.tileSize) + 20, 
//             '[ 초기화 ]', 
//             { fontSize: '24px', color: '#ffcc00', fontFamily: 'Arial' }
//         ).setInteractive({ useHandCursor: true });
        
//         resetButton.on('pointerdown', () => this.resetBoard());
//     }

//     private initWalls(wallPositions: string[]): void {
//         this.walls = [];
//         for (const pos of wallPositions) {
//             const col = pos.charCodeAt(0) - 'a'.charCodeAt(0);
//             const row = parseInt(pos[1]) - 1;
//             this.walls.push({ row, col });
//         }
//     }

//     private isWall(row: number, col: number): boolean {
//         return this.walls.some(w => w.row === row && w.col === col);
//     }

//     private drawBoard(): void {
//         for (let r: number = 0; r < this.N; r++) {
//             for (let c: number = 0; c < this.N; c++) {
//                 const isLight: boolean = (r + c) % 2 === 0;
//                 // 💡 체스판 색상 변경: 흰색(0xffffff)과 검은색(0x222222)
//                 const color: number = isLight ? 0xffffff : 0x222222;
                
//                 const x: number = this.boardOffset + c * this.tileSize + this.tileSize / 2;
//                 const y: number = this.boardOffset + r * this.tileSize + this.tileSize / 2;

//                 const tile: Phaser.GameObjects.Rectangle = this.add.rectangle(x, y, this.tileSize, this.tileSize, color);
//                 this.tiles[r][c] = tile; 
                
//                 if (this.isWall(r, c)) {
//                     this.add.text(x, y, '■', { fontSize: '35px' }).setOrigin(0.5);
//                     // 벽 타일은 회색으로 처리
//                     tile.setFillStyle(0x666666);
//                 } else {
//                     tile.setInteractive({ useHandCursor: true });
//                     tile.on('pointerdown', () => this.handleTileClick(r, c, x, y));
//                 }
//             }
//         }
//     }

//     private handleTileClick(row: number, col: number, x: number, y: number): void {
//         const existingIndex: number = this.queens.findIndex(q => q.row === row && q.col === col);
        
//         if (existingIndex !== -1) {
//             this.queens[existingIndex].sprite.destroy();
//             this.queens.splice(existingIndex, 1);
//         } else {
//             // 💡 퀸 이미지(텍스트) 변경: 꽉 찬 체스 기호(♛)에 색상 적용
//             const qText: Phaser.GameObjects.Text = this.add.text(x, y, '♛', { 
//                 fontSize: '45px', 
//                 color: '#ffcc00', // 황금색
//                 stroke: '#000000', // 검정색 테두리
//                 strokeThickness: 3
//             }).setOrigin(0.5);
            
//             this.queens.push({ row, col, sprite: qText });
//         }
        
//         this.checkSafety();
//         this.updateThreats(); 
//     }

//     private isBlockedByWall(r1: number, c1: number, r2: number, c2: number): boolean {
//         const dr = Math.sign(r2 - r1);
//         const dc = Math.sign(c2 - c1);
        
//         let r = r1 + dr;
//         let c = c1 + dc;
        
//         while (r !== r2 || c !== c2) {
//             if (this.isWall(r, c)) {
//                 return true; 
//             }
//             r += dr;
//             c += dc;
//         }
//         return false; 
//     }

//     private updateThreats(): void {
//         for (let r = 0; r < this.N; r++) {
//             for (let c = 0; c < this.N; c++) {
//                 if (this.isWall(r, c)) continue; 

//                 // 1. 기본 흑백 색상으로 되돌리기
//                 const isLight: boolean = (r + c) % 2 === 0;
//                 this.tiles[r][c].setFillStyle(isLight ? 0xffffff : 0x222222);

//                 let isAttacked = false;
//                 for (const q of this.queens) {
//                     if (q.row === r && q.col === c) continue;

//                     if (
//                         q.row === r || 
//                         q.col === c || 
//                         Math.abs(q.row - r) === Math.abs(q.col - c)
//                     ) {
//                         if (!this.isBlockedByWall(q.row, q.col, r, c)) {
//                             isAttacked = true;
//                             break;
//                         }
//                     }
//                 }

//                 // 2. 공격받는 자리라면 붉은색 톤으로 칠하기 (흑백 보드에 맞춤)
//                 if (isAttacked) {
//                     const threatColor = isLight ? 0xff9999 : 0xcc3333; 
//                     this.tiles[r][c].setFillStyle(threatColor);
//                 }
//             }
//         }
//     }

//     private checkSafety(): void {
//         let isSafe: boolean = true;
        
//         for (let i: number = 0; i < this.queens.length; i++) {
//             for (let j: number = i + 1; j < this.queens.length; j++) {
//                 const q1: Queen = this.queens[i];
//                 const q2: Queen = this.queens[j];
                
//                 if (
//                     q1.row === q2.row || 
//                     q1.col === q2.col || 
//                     Math.abs(q1.row - q2.row) === Math.abs(q1.col - q2.col)
//                 ) {
//                     if (!this.isBlockedByWall(q1.row, q1.col, q2.row, q2.col)) {
//                         isSafe = false;
//                     }
//                 }
//             }
//         }

//         if (this.queens.length === this.targetQueens && isSafe) {
//             this.statusText.setText(`성공! ${this.targetQueens}개의 퀸을 안전하게 배치했습니다! 🎉`);
//             this.statusText.setColor('#00ff00');
//         } else if (!isSafe) {
//             this.statusText.setText('충돌 발생! 퀸들이 서로 공격하고 있습니다. ❌');
//             this.statusText.setColor('#ff3333');
//         } else {
//             this.statusText.setText(`현재 퀸 갯수: ${this.queens.length} / ${this.targetQueens}`);
//             this.statusText.setColor('#ffffff');
//         }
//     }
    
//     private resetBoard(): void {
//         this.queens.forEach(q => q.sprite.destroy());
//         this.queens = [];
//         this.checkSafety();
//         this.updateThreats(); 
//         this.statusText.setText('빈 타일을 클릭하여 퀸을 배치하세요.');
//     }
// }

// const config: Phaser.Types.Core.GameConfig = {
//     type: Phaser.AUTO,
//     width: 600,
//     height: 600,
//     backgroundColor: '#333333',
//     scene: NQueensScene
// };

// new Phaser.Game(config);






import * as Phaser from 'phaser';

interface Position {
    row: number;
    col: number;
}

interface Queen extends Position {
    sprite: Phaser.GameObjects.Text;
}

export class NQueensScene extends Phaser.Scene {
    private readonly N: number = 8;
    private readonly targetQueens: number = 12; // 목표 퀸 12개
    
    // 💡 PC 환경에 맞춰 타일과 여백을 시원하게 키웠습니다.
    private readonly tileSize: number = 80;
    private readonly boardOffset: number = 80;
    
    // true면 처음부터 클리어 상태(빈 보드 + 마크 + 잠금 + 팝업)로 시작합니다.
    private isCleared: boolean = false; 
    
    private queens: Queen[] = [];
    private walls: Position[] = [];
    
    private instructionText!: Phaser.GameObjects.Text;
    private clearMarkText!: Phaser.GameObjects.Text;
    
    private submitButtonBg!: Phaser.GameObjects.Rectangle;
    private submitButtonText!: Phaser.GameObjects.Text;
    
    private tiles: Phaser.GameObjects.Rectangle[][] = [];
    
    private successWindow!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'NQueensScene' });
    }

    create(): void {
        this.initWalls(['a3', 'a5', 'b5', 'b7', 'c7', 'd1', 'd3', 'e6', 'e8', 'f2', 'g2', 'g4', 'h4', 'h6']);
        
        for (let i = 0; i < this.N; i++) {
            this.tiles[i] = [];
        }

        this.drawBoard();

        // 클리어 마크 텍스트 세팅 (크기 및 위치 조정)
        this.clearMarkText = this.add.text(
            this.boardOffset, 
            25, 
            '$ - o', 
            { fontSize: '36px', color: '#ffcc00', fontFamily: 'Arial', fontStyle: 'bold' }
        );
        this.clearMarkText.setVisible(this.isCleared);

        const uiY = this.boardOffset + (this.N * this.tileSize) + 40;

        this.instructionText = this.add.text(
            this.boardOffset, 
            uiY, 
            '클릭하여 퀸을 배치하세요', 
            { fontSize: '24px', color: '#ffffff', fontFamily: 'Arial' }
        );
        
        // 버튼 위치 및 크기 조정
        const submitX = this.boardOffset + 430;
        this.submitButtonBg = this.add.rectangle(submitX, uiY + 15, 140, 50, 0x555555).setOrigin(0.5);
        this.submitButtonText = this.add.text(submitX, uiY + 15, '정답 확인', { 
            fontSize: '22px', color: '#aaaaaa', fontFamily: 'Arial' 
        }).setOrigin(0.5);
        
        this.createSuccessWindow();

        // 정답 확인 버튼 클릭 이벤트
        this.submitButtonBg.on('pointerdown', () => {
            if (this.submitButtonBg.input?.enabled && !this.isCleared) {
                this.isCleared = true;
                this.clearMarkText.setVisible(true);
                this.successWindow.setVisible(true);

                this.queens.forEach(q => q.sprite.destroy());
                this.queens = [];
                this.updateGameState(); 
            }
        });

        const resetX = this.boardOffset + 590;
        const resetButtonBg = this.add.rectangle(resetX, uiY + 15, 120, 50, 0x883333).setOrigin(0.5);
        const resetButtonText = this.add.text(resetX, uiY + 15, '초기화', { 
            fontSize: '22px', color: '#ffffff', fontFamily: 'Arial' 
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

        // 💡 시작 시 isCleared가 true라면 즉시 팝업창 띄우기
        if (this.isCleared) {
            this.clearMarkText.setVisible(true);
            this.successWindow.setVisible(true);
        }
    }

    private createSuccessWindow(): void {
        this.successWindow = this.add.container(0, 0);
        
        // 커진 해상도(800x900)에 맞춰 오버레이 및 패널 크기/위치 조정
        const overlay = this.add.rectangle(400, 450, 800, 900, 0x000000, 0.7);
        overlay.setInteractive(); 

        const panel = this.add.rectangle(400, 450, 450, 200, 0x222222).setStrokeStyle(4, 0xffcc00);
        
        const successText = this.add.text(400, 450, '$ : o', { 
            fontSize: '32px', 
            color: '#ffffff', 
            fontFamily: 'Arial',
            align: 'center'
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
                
                const x: number = this.boardOffset + c * this.tileSize + this.tileSize / 2;
                const y: number = this.boardOffset + r * this.tileSize + this.tileSize / 2;

                const tile: Phaser.GameObjects.Rectangle = this.add.rectangle(x, y, this.tileSize, this.tileSize, color);
                this.tiles[r][c] = tile; 
                
                if (this.isWall(r, c)) {
                    // 💡 타일이 커졌으므로 벽 이모지 크기도 키웠습니다
                    this.add.text(x, y, '■', { fontSize: '45px', color: '#ffffff' }).setOrigin(0.5);
                    tile.setFillStyle(0x666666);
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

            // 💡 타일이 커졌으므로 퀸 기호 크기도 키웠습니다
            const qText: Phaser.GameObjects.Text = this.add.text(x, y, '♛', { 
                fontSize: '60px', 
                color: '#ffcc00', 
                stroke: '#000000', 
                strokeThickness: 4
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

// 💡 PC 환경에 맞춘 스케일 매니저 설정 적용
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT, // 창 크기에 맞춰 자동 확대/축소
        autoCenter: Phaser.Scale.CENTER_BOTH, // 무조건 정중앙에 배치
        width: 800, // 기본 해상도 증가
        height: 900
    },
    backgroundColor: '#333333',
    scene: NQueensScene
};

new Phaser.Game(config);