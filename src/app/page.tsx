import Link from "next/link";

const features = [
  { value: "03", label: "연결된 사건" },
  { value: "03", label: "제한된 시도" },
  { value: "∞", label: "가능한 추리" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-5 pb-16 pt-32 sm:px-8 sm:pt-40">
      <div className="pointer-events-none absolute left-1/2 top-24 size-[38rem] -translate-x-1/2 rounded-full border border-white/[0.035]" />
      <div className="pointer-events-none absolute left-1/2 top-40 size-[26rem] -translate-x-1/2 rounded-full border border-amber-200/[0.05]" />

      <section className="relative mx-auto max-w-6xl">
        <div className="reveal max-w-4xl">
          <div className="mb-8 flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-amber-200/70">
            <span className="h-px w-10 bg-amber-200/45" />
            INTERACTIVE MYSTERY ARCHIVE
          </div>

          <h1 className="font-serif text-6xl leading-[0.92] tracking-[-0.045em] text-slate-50 sm:text-8xl lg:text-[9.5rem]">
            The
            <br />
            <span className="ml-[0.14em] text-amber-100">Escape.</span>
          </h1>

          <div className="mt-9 grid gap-8 border-t border-white/10 pt-7 sm:grid-cols-[1fr_auto] sm:items-end">
            <p className="max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              기억이 지워진 기록실. 세 개의 방에 흩어진 단서를 연결하고,
              마지막 문이 잠기기 전에 사건의 진실을 찾아내세요.
            </p>
            <div className="flex flex-col gap-3 sm:items-end">
              <Link
                href="/stages"
                className="group inline-flex min-w-52 items-center justify-between gap-7 rounded-full bg-amber-200 px-6 py-4 font-semibold text-[#12231e] transition hover:-translate-y-0.5 hover:bg-amber-100"
              >
                게임을 시작하기
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/leaderboard"
                className="px-5 text-sm text-slate-500 transition hover:text-slate-200"
              >
                리더보드 먼저 보기
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-20 grid divide-y divide-white/8 border-y border-white/8 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {features.map((feature) => (
            <div key={feature.label} className="flex items-baseline gap-4 px-2 py-6 sm:px-8">
              <strong className="font-serif text-3xl font-normal text-amber-100">
                {feature.value}
              </strong>
              <span className="text-sm text-slate-500">{feature.label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
