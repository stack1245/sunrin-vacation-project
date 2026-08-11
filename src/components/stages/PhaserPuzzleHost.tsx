"use client";

import * as Phaser from "phaser";
import { useEffect, useRef } from "react";

import { DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT } from "@/game/stage-one/puzzles/document-storage/documentStoragePuzzleEvents";

interface PhaserPuzzleHostProps {
  ariaLabel: string;
  scene: Phaser.Types.Scenes.SceneType;
  width: number;
  height: number;
  backgroundColor?: string;
  onComplete(): void;
}

/** 문서 보관실 퍼즐에서 공통으로 사용하는 Phaser 생성·정리 경계다. */
export function PhaserPuzzleHost({
  ariaLabel,
  scene,
  width,
  height,
  backgroundColor = "#1e1e2e",
  onComplete,
}: PhaserPuzzleHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const parent = containerRef.current;

    if (!parent || gameRef.current) {
      return;
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width,
      height,
      backgroundColor,
      parent,
      scene: [scene],
    });
    const handleComplete = () => {
      onCompleteRef.current();
    };

    game.events.on(
      DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT,
      handleComplete,
    );
    gameRef.current = game;

    return () => {
      game.events.off(
        DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT,
        handleComplete,
      );
      game.destroy(true);
      gameRef.current = null;
    };
  }, [backgroundColor, height, scene, width]);

  return <div ref={containerRef} role="application" aria-label={ariaLabel} />;
}
