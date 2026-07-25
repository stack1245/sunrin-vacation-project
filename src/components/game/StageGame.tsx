"use client";

import { useEffect } from "react";

import { GameHeader } from "@/components/game/GameHeader";
import { Inventory } from "@/components/game/Inventory";
import { PuzzleArea } from "@/components/game/PuzzleArea";
import { useGameStore } from "@/store/useGameStore";

interface StageGameProps {
  stageId: number;
  title: string;
  description: string;
}

export function StageGame({ stageId, title, description }: StageGameProps) {
  const setStage = useGameStore((state) => state.setStage);

  useEffect(() => {
    setStage(stageId);
  }, [setStage, stageId]);

  return (
    <main className="min-h-screen bg-[#07090d] px-4 pb-8 pt-24 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-4">
        <GameHeader stageId={stageId} title={title} />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <PuzzleArea stageId={stageId} />

          <aside className="border border-white/10 bg-black/30 p-5">
            <p className="font-mono text-[9px] tracking-[0.24em] text-cyan-300">
              MISSION BRIEF
            </p>
            <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-500">
              {description}
            </p>
            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="text-[10px] tracking-[0.16em] text-zinc-600">
                CONNECTION
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                GLOBAL STORE READY
              </p>
            </div>
          </aside>
        </div>

        <Inventory />
      </div>
    </main>
  );
}
