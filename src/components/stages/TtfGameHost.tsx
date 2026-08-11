"use client";

import { TtfPuzzleScene } from "@/game/stage-one/puzzles/document-storage";
import { PhaserPuzzleHost } from "./PhaserPuzzleHost";

interface TtfGameHostProps {
  onComplete(): void;
}

export default function TtfGameHost({ onComplete }: TtfGameHostProps) {
  return (
    <PhaserPuzzleHost
      ariaLabel="TTF 퍼즐"
      scene={TtfPuzzleScene}
      width={800}
      height={600}
      onComplete={onComplete}
    />
  );
}
