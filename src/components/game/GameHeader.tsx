"use client";

import Link from "next/link";

import { useGameStore } from "@/store/useGameStore";

interface GameHeaderProps {
  stageId: number;
  title: string;
}

export function GameHeader({ stageId, title }: GameHeaderProps) {
  const attemptsLeft = useGameStore((state) => state.attemptsLeft);
  const isTimerRunning = useGameStore((state) => state.isTimerRunning);
  const isAlarmActive = useGameStore((state) => state.isAlarmActive);

  return (
    <header
      className={`border bg-black/35 backdrop-blur-md ${
        isAlarmActive
          ? "border-red-400/50 shadow-[0_0_32px_rgba(248,113,113,0.12)]"
          : "border-white/10"
      }`}
    >
      <div className="grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
        <Link
          href="/stages"
          className="grid size-10 place-items-center border border-white/10 text-zinc-400 transition hover:border-cyan-300/40 hover:text-cyan-200"
          aria-label="스테이지 선택으로 돌아가기"
        >
          ←
        </Link>

        <div>
          <p className="font-mono text-[10px] tracking-[0.24em] text-cyan-300">
            STAGE {String(stageId).padStart(2, "0")}
          </p>
          <h1 className="mt-1 truncate text-sm font-bold tracking-wide text-white sm:text-base">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="text-right">
            <p className="text-[9px] tracking-[0.18em] text-zinc-500">
              ATTEMPTS
            </p>
            <p
              className={`mt-1 font-mono text-sm font-bold ${
                attemptsLeft === 0 ? "text-red-300" : "text-white"
              }`}
            >
              {attemptsLeft} / 3
            </p>
          </div>
          <div className="hidden h-8 w-px bg-white/10 sm:block" />
          <div className="hidden text-right sm:block">
            <p className="text-[9px] tracking-[0.18em] text-zinc-500">
              TIMER
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-white">
              {isTimerRunning ? "00:00" : "--:--"}
            </p>
          </div>
          <span
            className={`size-2 rounded-full ${
              isAlarmActive
                ? "animate-pulse bg-red-400 shadow-[0_0_12px_#f87171]"
                : isTimerRunning
                  ? "bg-cyan-300 shadow-[0_0_10px_#67e8f9]"
                  : "bg-zinc-700"
            }`}
            aria-label={
              isAlarmActive
                ? "경보 활성화"
                : isTimerRunning
                  ? "타이머 작동 중"
                  : "대기 중"
            }
          />
        </div>
      </div>
    </header>
  );
}
