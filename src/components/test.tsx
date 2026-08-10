"use client"; // Next.js에게 이 파일은 브라우저에서만 실행하라고 알려줌

import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
// 작성하신 ex_nqueen.ts 파일에서 클래스를 불러옵니다. 
// (클래스 이름이 NQueensScene이 맞는지 확인해 주세요!)
import { SudokuScene } from '../game/puzzles/ex_sudoku'; 

export default function NQueenGame() {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        // 브라우저 환경일 때만 Phaser 게임 생성
        if (typeof window !== 'undefined' && !gameRef.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: 600,
                height: 600,
                backgroundColor: '#333333',
                parent: 'phaser-container', // 게임이 들어갈 div의 ID
                scene: [SudokuScene]
            };
            
            gameRef.current = new Phaser.Game(config);
        }

        // 컴포넌트가 화면에서 사라질 때 게임 인스턴스 정리
        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    // Phaser 게임이 그려질 공간(div)
    return <div id="phaser-container" />;
}