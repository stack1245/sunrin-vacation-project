import Link from "next/link";

const systemDetails = [
  ["MODE", "STORY ESCAPE"],
  ["STAGES", "03 MODULES"],
  ["STATUS", "AWAITING PLAYER"],
];

export default function Home() {
  return (
    <main className="hero-noise relative min-h-screen overflow-hidden bg-[#07090d] px-5 pt-16">
      <div className="game-grid absolute inset-0 opacity-30" aria-hidden="true" />
      <div
        className="absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent"
        aria-hidden="true"
      />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center py-16">
        <div className="grid w-full items-end gap-14 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <span className="h-px w-10 bg-cyan-300/60" />
              <p className="font-mono text-[10px] font-bold tracking-[0.28em] text-cyan-300">
                INTERACTIVE ESCAPE PROTOCOL
              </p>
            </div>

            <h1 className="max-w-5xl text-[clamp(3.8rem,12vw,9.5rem)] font-black leading-[0.78] tracking-[-0.075em] text-white">
              OUT
              <span className="block pl-[0.34em] text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.35)]">
                OF BOUNDS
              </span>
            </h1>

            <p className="mt-10 max-w-xl text-lg font-medium tracking-tight text-zinc-300 sm:text-2xl">
              Break the limits, escape the story
            </p>
            <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-500">
              단서를 추적하고, 제한된 시도 안에 퍼즐을 돌파하세요. 한 번의
              선택이 다음 장면의 경계를 바꿉니다.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                href="/stages"
                className="group inline-flex min-h-14 items-center gap-10 border border-cyan-300/50 bg-cyan-300 px-6 text-xs font-black tracking-[0.22em] text-[#061014] shadow-[0_0_40px_rgba(103,232,249,0.12)] transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black"
              >
                GAME START
                <span
                  className="text-lg transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
              <span className="font-mono text-[10px] tracking-[0.15em] text-zinc-600">
                NO SAVE DATA DETECTED
              </span>
            </div>
          </div>

          <aside className="border border-white/10 bg-black/25 p-6 backdrop-blur-sm">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-500">
                SYSTEM / 01
              </span>
              <span className="size-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" />
            </div>

            <dl className="space-y-5">
              {systemDetails.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-end justify-between gap-6 border-b border-white/10 pb-3"
                >
                  <dt className="text-[9px] tracking-[0.18em] text-zinc-600">
                    {label}
                  </dt>
                  <dd className="font-mono text-[10px] text-zinc-300">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-8 font-mono text-[9px] leading-5 text-zinc-700">
              CONNECTION SECURE
              <br />
              STORYLINE READY
              <br />
              WAITING FOR INPUT_
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
