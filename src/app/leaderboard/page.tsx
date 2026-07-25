import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "OutOfBounds 스피드런 리더보드",
};

const placeholderRows = [
  { rank: "01", player: "AWAITING_RUNNER", time: "--:--" },
  { rank: "02", player: "AWAITING_RUNNER", time: "--:--" },
  { rank: "03", player: "AWAITING_RUNNER", time: "--:--" },
  { rank: "04", player: "AWAITING_RUNNER", time: "--:--" },
  { rank: "05", player: "AWAITING_RUNNER", time: "--:--" },
];

export default function LeaderboardPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07090d] px-5 pb-20 pt-28 sm:px-8">
      <div className="game-grid absolute inset-0 opacity-20" aria-hidden="true" />

      <section className="relative z-10 mx-auto max-w-5xl">
        <div className="border-b border-white/10 pb-8">
          <p className="font-mono text-[10px] tracking-[0.26em] text-cyan-300">
            SPEEDRUN ARCHIVE
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
            리더보드
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-500">
            Supabase 기록 조회를 연결할 수 있도록 준비된 순위표
            플레이스홀더입니다.
          </p>
        </div>

        <div className="mt-10 overflow-hidden border border-white/10 bg-black/25">
          <div className="grid grid-cols-[70px_1fr_90px] border-b border-white/10 px-4 py-3 text-[9px] tracking-[0.2em] text-zinc-600 sm:grid-cols-[100px_1fr_140px] sm:px-6">
            <span>RANK</span>
            <span>PLAYER</span>
            <span className="text-right">CLEAR TIME</span>
          </div>
          <ol>
            {placeholderRows.map((row) => (
              <li
                key={row.rank}
                className="grid grid-cols-[70px_1fr_90px] items-center border-b border-white/5 px-4 py-5 last:border-0 sm:grid-cols-[100px_1fr_140px] sm:px-6"
              >
                <span className="font-mono text-sm font-bold text-cyan-300/70">
                  {row.rank}
                </span>
                <span className="truncate font-mono text-xs tracking-wider text-zinc-500">
                  {row.player}
                </span>
                <span className="text-right font-mono text-sm text-zinc-400">
                  {row.time}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
