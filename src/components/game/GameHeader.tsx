"use client";

import { useEffect, useState } from "react";

import { useGameStore } from "@/store/useGameStore";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function GameHeader() {
  const currentStage = useGameStore((state) => state.currentStage);
  const attemptsLeft = useGameStore((state) => state.attemptsLeft);
  const isTimerRunning = useGameStore((state) => state.isTimerRunning);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setElapsedSeconds(0);
  }, [currentStage]);

  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isTimerRunning]);

  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.24em] text-amber-200/70">
          ACTIVE CASE
        </p>
        <p className="mt-1 font-serif text-xl text-slate-50">
          STAGE {currentStage.toString().padStart(2, "0")}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:block">
        <span className="text-xs text-slate-500 sm:hidden">남은 시도</span>
        <div className="flex items-center gap-1.5" aria-label={`남은 시도 ${attemptsLeft}회`}>
          {Array.from({ length: 3 }).map((_, index) => (
            <span
              key={index}
              className={`h-2.5 w-7 rounded-full ${
                index < attemptsLeft ? "bg-amber-300" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <p className="mt-1 hidden text-center text-[10px] tracking-widest text-slate-500 sm:block">
          ATTEMPTS {attemptsLeft}/3
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-white/10 sm:border-l sm:pl-6">
        <span
          className={`size-2 rounded-full ${
            isTimerRunning ? "animate-pulse bg-emerald-300" : "bg-red-400"
          }`}
        />
        <div className="font-mono text-2xl tabular-nums text-slate-100">
          {formatTime(elapsedSeconds)}
        </div>
      </div>
    </div>
  );
}
