import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "리더보드",
};

const runners = [
  { rank: 1, name: "NOIR_07", time: "08:42", stages: "3/3" },
  { rank: 2, name: "KEYMAKER", time: "09:16", stages: "3/3" },
  { rank: 3, name: "MOTH", time: "10:03", stages: "3/3" },
  { rank: 4, name: "ROOM404", time: "11:28", stages: "3/3" },
  { rank: 5, name: "GHOST_NOTE", time: "12:51", stages: "3/3" },
];

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen px-5 pb-20 pt-28 sm:px-8 sm:pt-36">
      <section className="mx-auto max-w-5xl">
        <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="eyebrow">Speedrun archive</p>
            <h1 className="mt-4 font-serif text-5xl tracking-tight text-slate-50 sm:text-7xl">
              기록 보관소
            </h1>
            <p className="mt-5 max-w-xl leading-7 text-slate-400">
              가장 빠르게 사건의 진실에 도달한 조사관들의 기록입니다.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200/20 bg-amber-200/5 px-5 py-4">
            <p className="text-xs tracking-widest text-amber-200/60">SEASON 01</p>
            <p className="mt-1 text-sm text-slate-300">전체 스테이지 · 최소 시간</p>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
          <div className="grid grid-cols-[3rem_1fr_auto] gap-3 border-b border-white/8 px-5 py-4 text-xs tracking-widest text-slate-600 sm:grid-cols-[5rem_1fr_7rem_7rem] sm:px-7">
            <span>RANK</span>
            <span>PLAYER</span>
            <span className="hidden sm:block">STAGES</span>
            <span className="text-right">TIME</span>
          </div>

          <ol>
            {runners.map((runner) => (
              <li
                key={runner.rank}
                className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-white/6 px-5 py-5 last:border-0 sm:grid-cols-[5rem_1fr_7rem_7rem] sm:px-7"
              >
                <span className={runner.rank <= 3 ? "font-serif text-xl text-amber-100" : "text-slate-500"}>
                  {runner.rank.toString().padStart(2, "0")}
                </span>
                <span className="font-mono text-sm text-slate-200">{runner.name}</span>
                <span className="hidden text-sm text-slate-500 sm:block">{runner.stages}</span>
                <span className="text-right font-mono text-lg text-slate-100">{runner.time}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-4 text-right text-xs text-slate-600">
          현재 데이터는 UI 연결 확인을 위한 예시 기록입니다.
        </p>
      </section>
    </main>
  );
}
