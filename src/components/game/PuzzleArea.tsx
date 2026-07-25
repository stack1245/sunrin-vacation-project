"use client";

import { useGameStore } from "@/store/useGameStore";

interface PuzzleAreaProps {
  stageId: number;
}

export function PuzzleArea({ stageId }: PuzzleAreaProps) {
  const attemptsLeft = useGameStore((state) => state.attemptsLeft);
  const useAttempt = useGameStore((state) => state.useAttempt);
  const addItem = useGameStore((state) => state.addItem);

  return (
    <section className="relative grid min-h-[390px] place-items-center overflow-hidden border border-white/10 bg-[#0b0f14]/80 p-6 sm:min-h-[460px]">
      <div className="absolute inset-0 game-grid opacity-35" aria-hidden="true" />
      <div
        className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent motion-safe:animate-[scan_5s_ease-in-out_infinite]"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-lg text-center">
        <div className="mx-auto grid size-16 place-items-center border border-dashed border-cyan-300/30 bg-cyan-300/[0.03] font-mono text-xs font-bold text-cyan-200">
          P{stageId}
        </div>
        <p className="mt-6 font-mono text-[10px] tracking-[0.28em] text-cyan-300">
          PUZZLE MOUNT POINT
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
          퍼즐 컴포넌트 연결 영역
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-zinc-500">
          팀에서 구현할 실제 퍼즐 UI와 판정 로직을 이 영역에 연결하세요.
          현재는 전역 상태의 기본 동작만 확인할 수 있습니다.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() =>
              addItem({
                id: `stage-${stageId}-key`,
                name: "암호 키",
                icon: "◇",
              })
            }
            className="border border-cyan-300/30 bg-cyan-300/5 px-4 py-2.5 text-[10px] font-bold tracking-[0.16em] text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-300/10"
          >
            TEST ITEM
          </button>
          <button
            type="button"
            onClick={useAttempt}
            disabled={attemptsLeft === 0}
            className="border border-white/10 px-4 py-2.5 text-[10px] font-bold tracking-[0.16em] text-zinc-300 transition hover:border-red-300/40 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            CHECK ANSWER
          </button>
        </div>
      </div>

      <span className="absolute bottom-4 right-4 font-mono text-[9px] tracking-[0.14em] text-zinc-700">
        MODULE_NOT_CONNECTED
      </span>
    </section>
  );
}
