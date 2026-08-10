"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";

import { NQueensPuzzleScene } from "@/game/stage-one/puzzles/document-storage";

const GAME_CONTAINER_ID = "resource-puzzle-game-container";

export default function ResourcePuzzleGameHost() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: "#1e1e2e",
        parent: GAME_CONTAINER_ID,
        scene: [NQueensPuzzleScene],
      };

      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div id={GAME_CONTAINER_ID} />;
}