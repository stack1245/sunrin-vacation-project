"use client";

import { AgoPuzzleScene } from "@/game/stage-one/puzzles/document-storage/agoPuzzleScene";
import { PhaserPuzzleHost } from "./PhaserPuzzleHost";

interface AgoGameHostProps {
  onComplete(): void;
}

export default function AgoGameHost({ onComplete }: AgoGameHostProps) {
  return (
    <PhaserPuzzleHost
      ariaLabel="보안 노드 해제 퍼즐"
      scene={AgoPuzzleScene}
      width={800}
      height={600}
      onComplete={onComplete}
    />
  );
}
