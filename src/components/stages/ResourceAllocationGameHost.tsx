"use client";

import { ResourceAllocationPuzzleScene } from "@/game/stage-one/puzzles/document-storage";
import { PhaserPuzzleHost } from "./PhaserPuzzleHost";

interface ResourceAllocationGameHostProps {
  onComplete(): void;
}

export default function ResourceAllocationGameHost({
  onComplete,
}: ResourceAllocationGameHostProps) {
  return (
    <PhaserPuzzleHost
      ariaLabel="자원 분배 퍼즐"
      scene={ResourceAllocationPuzzleScene}
      width={800}
      height={600}
      onComplete={onComplete}
    />
  );
}
