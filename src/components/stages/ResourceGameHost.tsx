"use client";

import * as Phaser from "phaser";
import { useEffect, useRef } from "react";

import { ResourcePuzzleScene } from "@/game/stage-one/puzzles/document-storage";

export default function ResourceAllocationGameHost() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const parent = containerRef.current;

    if (!parent || gameRef.current) {
      return;
    }

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      backgroundColor: "#1e1e2e",
      parent,
      scene: [ResourcePuzzleScene],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="자원 분배 퍼즐"
    />
  );
}
