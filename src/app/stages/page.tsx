import type { Metadata } from "next";
import Link from "next/link";

import type { Stage } from "@/types/game";

export const metadata: Metadata = {
  title: "Stages",
  description: "OutOfBounds 스토리 스테이지 로드맵",
};

const stages: Stage[] = [
  {
    id: 1,
    title: "통제실",
    description: "멈춘 시스템을 재가동하고 첫 번째 출구 좌표를 확보하세요.",
    stageOrder: 1,
  },
  {
    id: 2,
    title: "경계 구역",
    description: "왜곡된 기록 사이에서 진짜 접근 코드를 찾아내세요.",
    stageOrder: 2,
  },
  {
    id: 3,
    title: "아웃 오브 바운즈",
    description: "이야기의 마지막 경계를 넘어 탈출 프로토콜을 완성하세요.",
    stageOrder: 3,
  },
];

export default function StagesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07090d] px-5 pb-20 pt-28 sm:px-8">
      <div className="game-grid absolute inset-0 opacity-20" aria-hidden="true" />

      <section className="relative z-10 mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] tracking-[0.26em] text-cyan-300">
              STORY ROADMAP
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
              탈출 경로 선택
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-7 text-zinc-500">
            각 스테이지는 하나의 연속된 이야기입니다. 현재 스캐폴딩에서는
            모든 퍼즐 컨테이너를 미리 확인할 수 있습니다.
          </p>
        </div>

        <ol className="relative mt-10 grid gap-5 before:absolute before:bottom-10 before:left-[27px] before:top-10 before:w-px before:bg-gradient-to-b before:from-cyan-300/50 before:to-transparent lg:grid-cols-3 lg:before:bottom-auto lg:before:left-10 lg:before:right-10 lg:before:top-[27px] lg:before:h-px lg:before:w-auto">
          {stages.map((stage) => (
            <li key={stage.id} className="relative">
              <Link
                href={`/stages/${stage.id}`}
                className="group block min-h-72 border border-white/10 bg-[#0b0f14]/90 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-[0_18px_50px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <span className="grid size-14 place-items-center border border-cyan-300/30 bg-[#07090d] font-mono text-sm font-bold text-cyan-200">
                    {String(stage.stageOrder).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[9px] tracking-[0.16em] text-zinc-600">
                    MODULE READY
                  </span>
                </div>

                <h2 className="mt-12 text-2xl font-bold text-white transition group-hover:text-cyan-100">
                  {stage.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-zinc-500">
                  {stage.description}
                </p>

                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-[10px] font-bold tracking-[0.18em] text-zinc-400">
                    ENTER STAGE
                  </span>
                  <span className="text-cyan-300 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
