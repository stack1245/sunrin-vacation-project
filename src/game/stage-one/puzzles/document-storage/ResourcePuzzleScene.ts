import * as Phaser from 'phaser';

export class ResourcePuzzleScene extends Phaser.Scene {
    private zones = {
        A: 20,
        B: 20,
        C: 20,
        D: 20,
        E: 20
    };

    private isCleared: boolean = false;

    // UI 요소들
    private totalSumText!: Phaser.GameObjects.Text;
    private zoneTexts: Record<string, Phaser.GameObjects.Text> = {};
    private checkTexts: Phaser.GameObjects.Text[] = [];
    private successWindow!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'ResourcePuzzleScene' });
    }

    create(): void {
        this.cameras.main.setBackgroundColor('#1e1e2e');

        this.drawHeaderUI();
        this.drawZoneControls();
        this.drawChecklist();
        this.drawBottomUI();
        this.createSuccessWindow();

        this.updateGameState();
    }

    private drawHeaderUI(): void {
        this.add.text(
            400, 
            40, 
            '자원 분배 퍼즐 (총 100개)', 
            { fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold' }
        ).setOrigin(0.5);

        this.totalSumText = this.add.text(
            400, 
            80, 
            '현재 합계: 100 / 100', 
            { fontSize: '22px', color: '#a6e3a1', fontFamily: 'Arial', fontStyle: 'bold' }
        ).setOrigin(0.5);
    }

    private drawZoneControls(): void {
        const startY = 150;
        const spacingY = 60;
        const labels = { A: '구역 A (주거)', B: '구역 B (산업)', C: '구역 C (연구)', D: '구역 D (농업)', E: '구역 E (발전)' };

        Object.keys(this.zones).forEach((key, index) => {
            const y = startY + index * spacingY;

            this.add.text(100, y, labels[key as keyof typeof labels], {
                fontSize: '18px', color: '#8be9fd', fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            this.createBtn(280, y, '-5', () => this.changeZoneValue(key, -5));
            this.createBtn(330, y, '-1', () => this.changeZoneValue(key, -1));

            this.zoneTexts[key] = this.add.text(380, y, `${this.zones[key as keyof typeof this.zones]}`, {
                fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(0.5);

            this.createBtn(430, y, '+1', () => this.changeZoneValue(key, 1));
            this.createBtn(480, y, '+5', () => this.changeZoneValue(key, 5));
        });
    }

    private createBtn(x: number, y: number, label: string, callback: () => void): void {
        const bg = this.add.rectangle(x, y, 40, 36, 0x44475a).setOrigin(0.5);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(x, y, label, {
            fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        bg.on('pointerdown', () => {
            if (!this.isCleared) callback();
        });
        bg.on('pointerover', () => bg.setFillStyle(0x6272a4));
        bg.on('pointerout', () => bg.setFillStyle(0x44475a));
    }

    private changeZoneValue(zoneKey: string, amount: number): void {
        const current = this.zones[zoneKey as keyof typeof this.zones];
        let newValue = current + amount;
        
        if (newValue < 0) newValue = 0;
        if (newValue > 100) newValue = 100;

        this.zones[zoneKey as keyof typeof this.zones] = newValue;
        this.zoneTexts[zoneKey].setText(`${newValue}`);
        
        this.updateGameState();
    }

    private drawChecklist(): void {
        const startX = 550;
        const startY = 150;
        const spacingY = 45;

        const rules = [
            '총 자원 합계 100개',
            '구역 A: 15~30 사이의 소수',
            '구역 B: 구역 E의 2배',
            '구역 C: 5의 배수 & A보다 큼',
            '구역 D: 구역 A + 구역 E',
            '구역 E: 8의 배수'
        ];

        rules.forEach((rule, idx) => {
            const text = this.add.text(startX, startY + idx * spacingY, `❌ ${rule}`, {
                fontSize: '16px', color: '#ff5555', fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
            this.checkTexts.push(text);
        });
    }

    private drawBottomUI(): void {
        const resetBg = this.add.rectangle(400, 500, 120, 40, 0x883333).setOrigin(0.5);
        resetBg.setInteractive({ useHandCursor: true });
        
        const resetText = this.add.text(400, 500, '초기화', {
            fontSize: '18px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        resetBg.on('pointerdown', () => {
            if (!this.isCleared) {
                this.zones = { A: 20, B: 20, C: 20, D: 20, E: 20 };
                Object.keys(this.zones).forEach(key => {
                    this.zoneTexts[key].setText(`${this.zones[key as keyof typeof this.zones]}`);
                });
                this.updateGameState();
            }
        });
        resetBg.on('pointerover', () => resetBg.setFillStyle(0xaa4444));
        resetBg.on('pointerout', () => resetBg.setFillStyle(0x883333));
    }

    private updateGameState(): void {
        const { A, B, C, D, E } = this.zones;
        const totalSum = A + B + C + D + E;

        this.totalSumText.setText(`현재 합계: ${totalSum} / 100`);
        if (totalSum === 100) {
            this.totalSumText.setColor('#a6e3a1');
        } else if (totalSum > 100) {
            this.totalSumText.setColor('#ff5555');
        } else {
            this.totalSumText.setColor('#f1fa8c');
        }

        const primes = [17, 19, 23, 29];
        
        const conditions = [
            totalSum === 100,
            primes.includes(A),
            B === 2 * E,
            C % 5 === 0 && C > A,
            D === A + E,
            E % 8 === 0 && E > 0
        ];

        const rulesText = [
            '총 자원 합계 100개',
            '구역 A: 15~30 사이의 소수',
            '구역 B: 구역 E의 2배',
            '구역 C: 5의 배수 & A보다 큼',
            '구역 D: 구역 A + 구역 E',
            '구역 E: 8의 배수'
        ];

        let allClear = true;

        conditions.forEach((isMet, idx) => {
            if (isMet) {
                this.checkTexts[idx].setText(`✅ ${rulesText[idx]}`);
                this.checkTexts[idx].setColor('#50fa7b');
            } else {
                this.checkTexts[idx].setText(`❌ ${rulesText[idx]}`);
                this.checkTexts[idx].setColor('#ff5555');
                allClear = false;
            }
        });

        if (allClear && !this.isCleared) {
            this.isCleared = true;
            this.successWindow.setVisible(true);
        }
    }

    private createSuccessWindow(): void {
        this.successWindow = this.add.container(0, 0);

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.75);
        overlay.setInteractive();

        const panel = this.add.rectangle(400, 300, 400, 180, 0x1e1e2e).setStrokeStyle(4, 0x50fa7b);

        const successText = this.add.text(400, 270, '🎉 완벽한 자원 분배!', {
            fontSize: '28px',
            color: '#50fa7b',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        const subText = this.add.text(400, 320, '모든 논리 조건을 완벽하게 맞추셨습니다.', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);

        this.successWindow.add([overlay, panel, successText, subText]);
        this.successWindow.setDepth(100);
        this.successWindow.setVisible(false);
    }
}