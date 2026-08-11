"use client";

import { NQueensPuzzleScene } from "@/game/stage-one/puzzles/document-storage/nQueensPuzzleScene";
import { PhaserPuzzleHost } from "./PhaserPuzzleHost";

interface NQueensGameHostProps {
  onComplete(): void;
}

export default function NQueensGameHost({
  onComplete,
}: NQueensGameHostProps) {
  return (
    <PhaserPuzzleHost
      ariaLabel="벽이 있는 N-Queens 퍼즐"
      scene={NQueensPuzzleScene}
      width={800}
      height={600}
      onComplete={onComplete}
    />
  );
}
