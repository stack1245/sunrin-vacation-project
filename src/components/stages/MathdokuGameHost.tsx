"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";

import { MathdokuPuzzleScene } from "@/game/stage-one/puzzles/document-storage";

const GAME_CONTAINER_ID = "mathdoku-game-container";

export default function MathdokuGameHost() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 600,
        height: 600,
        backgroundColor: "#333333",
        parent: GAME_CONTAINER_ID,
        scene: [MathdokuPuzzleScene],
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
