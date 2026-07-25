"use client";

import { useState } from "react";

import { useGameStore } from "@/store/useGameStore";

export function PuzzleArea() {
  const attemptsLeft = useGameStore((state) => state.attemptsLeft);
  const isAlarmActive = useGameStore((state) => state.isAlarmActive);
  const useAttempt = useGameStore((state) => state.useAttempt);
  const addItem = useGameStore((state) => state.addItem);
  const [clueFound, setClueFound] = useState(false);

  const revealClue = () => {
    setClueFound(true);
    addItem({ id: "brass-key", name: "황동 열쇠", icon: "⚿" });
  };

  return (
    <section
      className={`relative min-h-[380px] overflow-hidden rounded-3xl border bg-[#0a1714] p-5 sm:p-8 ${
        isAlarmActive
          ? "border-red-400/50 shadow-[0_0_80px_rgba(248,113,113,0.14)]"
          : "border-white/10"
      }`}
      aria-labelledby="puzzle-title"
    >
      <div className="absolute inset-0 puzzle-grid opacity-30" />
      <div className="relative flex min-h-[330px] flex-col">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="eyebrow">Puzzle module placeholder</p>
            <h2 id="puzzle-title" className="mt-2 font-serif text-2xl text-slate-50">
              잠긴 기록 보관함
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              스테이지별 퍼즐 컴포넌트가 이 영역에 연결됩니다. 단서 조사와
              오답 처리 흐름을 확인할 수 있도록 기본 상호작용을 넣었습니다.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-500">
            MODULE 01
          </span>
        </div>

        <div className="my-auto grid gap-4 py-8 sm:grid-cols-2">
          <button
            type="button"
            onClick={revealClue}
            className="group rounded-2xl border border-white/10 bg-black/20 p-5 text-left transition hover:border-amber-200/30 hover:bg-amber-200/5"
          >
            <span className="text-xs tracking-widest text-amber-200/70">
              조사 포인트 A
            </span>
            <span className="mt-3 block text-base text-slate-200">
              {clueFound ? "황동 열쇠를 획득했습니다." : "서랍 안쪽을 조사한다"}
            </span>
            <span className="mt-6 block text-xs text-slate-600 group-hover:text-slate-400">
              클릭하여 단서 확인 →
            </span>
          </button>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs tracking-widest text-slate-500">암호 입력기</p>
            <div className="mt-4 flex gap-2">
              {[8, 2, 4, 9].map((number) => (
                <span
                  key={number}
                  className="grid h-12 flex-1 place-items-center rounded-xl border border-white/10 bg-white/[0.035] font-mono text-lg text-slate-300"
                >
                  {number}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={useAttempt}
              disabled={attemptsLeft === 0}
              className="mt-3 w-full rounded-xl bg-white/8 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:text-red-300"
            >
              {attemptsLeft === 0 ? "경보 발동 — 입력 잠김" : "암호 제출 테스트"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-white/8 pt-4 text-xs text-slate-600">
          <span className="size-1.5 rounded-full bg-emerald-300/70" />
          Stage 1, 2, 3 퍼즐 로직 연결 준비 완료
        </div>
      </div>
    </section>
  );
}
