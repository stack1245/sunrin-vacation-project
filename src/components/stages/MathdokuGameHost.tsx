"use client";

import { MathdokuPuzzleScene } from "@/game/stage-one/puzzles/document-storage/mathdokuPuzzleScene";
import { PhaserPuzzleHost } from "./PhaserPuzzleHost";

interface MathdokuGameHostProps {
  onComplete(): void;
}

export default function MathdokuGameHost({
  onComplete,
}: MathdokuGameHostProps) {
  return (
    <PhaserPuzzleHost
      ariaLabel="변형 스도쿠 퍼즐"
      scene={MathdokuPuzzleScene}
      width={600}
      height={600}
      backgroundColor="#333333"
      onComplete={onComplete}
    />
  );
}
