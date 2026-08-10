"use client";

import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { SudokuScene } from '../game/puzzles/ex_sudoku';

export default function SudokuGame() {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && !gameRef.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: 600,
                height: 600,
                backgroundColor: '#1e1e2e',
                parent: 'phaser-sudoku-container',
                scene: [SudokuScene]
            };

            gameRef.current = new Phaser.Game(config);
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return <div id="phaser-sudoku-container" className="flex items-center justify-center" />;
}
