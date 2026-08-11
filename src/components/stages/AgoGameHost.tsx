"use client";

import * as Phaser from "phaser";
import { useEffect, useRef } from "react";

// 💡 SecurityGridPuzzleScene 파일이 있는 실제 경로로 반드시 수정해 주세요!
import { AgoPuzzleScene } from "@/game/stage-one/puzzles/document-storage"; 

export default function SecurityGridGameHost() {
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
      scene: [AgoPuzzleScene], // 씬 교체 완료
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
      aria-label="보안 노드 해제 퍼즐"
    />
  );
}