import type { Metadata } from "next";
import Link from "next/link";

import type { Stage } from "@/types/game";

export const metadata: Metadata = {
  title: "스테이지",
};

const stages: Stage[] = [
  {
    id: 1,
    title: "사라진 기록",
    description: "버려진 기록실에서 첫 번째 사건 파일을 복원하세요.",
    stageOrder: 1,
  },
  {
    id: 2,
    title: "무음의 복도",
    description: "소리가 사라진 복도에서 반복되는 신호의 규칙을 찾으세요.",
    stageOrder: 2,
  },
  {
    id: 3,
    title: "마지막 목격자",
    description: "모든 단서를 연결해 잠긴 기억과 사건의 진실을 밝히세요.",
    stageOrder: 3,
  },
];

export default function StagesPage() {
  return (
    <main className="min-h-screen px-5 pb-20 pt-28 sm:px-8 sm:pt-36">
      <section className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <p className="eyebrow">Case route</p>
          <h1 className="mt-4 font-serif text-5xl tracking-tight text-slate-50 sm:text-7xl">
            사건 진행도
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-400">
            각 방의 기록은 하나의 사건으로 이어집니다. 스테이지를 선택해
            조사를 시작하세요.
          </p>
        </div>

        <ol className="relative mt-14 space-y-5 before:absolute before:bottom-10 before:left-6 before:top-10 before:w-px before:bg-gradient-to-b before:from-amber-200/50 before:to-transparent sm:before:left-10">
          {stages.map((stage, index) => (
            <li key={stage.id} className="relative">
              <Link
                href={`/stages/${stage.id}`}
                className="group grid gap-5 rounded-3xl border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-amber-200/30 hover:bg-amber-200/[0.035] sm:grid-cols-[5rem_1fr_auto] sm:items-center sm:p-7"
              >
                <span className="relative z-10 grid size-12 place-items-center rounded-full border border-amber-200/25 bg-[#0b1915] font-mono text-sm text-amber-100 sm:size-16">
                  {stage.stageOrder.toString().padStart(2, "0")}
                </span>

                <span>
                  <span className="block text-xs font-semibold tracking-[0.18em] text-slate-600">
                    {index === 0 ? "AVAILABLE NOW" : "STORY CHAPTER"}
                  </span>
                  <span className="mt-2 block font-serif text-2xl text-slate-100 sm:text-3xl">
                    {stage.title}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-slate-500">
                    {stage.description}
                  </span>
                </span>

                <span className="hidden size-11 place-items-center rounded-full border border-white/10 text-slate-400 transition group-hover:border-amber-200/35 group-hover:text-amber-100 sm:grid">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
