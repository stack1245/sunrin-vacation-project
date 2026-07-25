"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import { GameHeader, Inventory, PuzzleArea } from "@/components/game";
import { useGameStore } from "@/store/useGameStore";

export default function StageGamePage() {
  const params = useParams<{ id: string }>();
  const parsedStageId = Number(params.id);
  const stageId = Number.isFinite(parsedStageId) ? parsedStageId : 1;
  const setStage = useGameStore((state) => state.setStage);

  useEffect(() => {
    setStage(stageId);
  }, [setStage, stageId]);

  return (
    <main className="min-h-screen px-5 pb-16 pt-24 sm:px-8 sm:pt-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link
            href="/stages"
            className="text-sm text-slate-500 transition hover:text-slate-200"
          >
            ← 스테이지 맵
          </Link>
          <p className="text-xs tracking-[0.18em] text-slate-600">
            CURRENT STAGE ID: {stageId}
          </p>
        </div>

        <GameHeader />

        <div className="mt-5">
          <PuzzleArea />
        </div>

        <div className="mt-7 rounded-3xl border border-white/8 bg-black/10 p-5 sm:p-7">
          <Inventory />
        </div>
      </div>
    </main>
  );
}
