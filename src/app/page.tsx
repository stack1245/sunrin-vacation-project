import { SiteHeader } from "@/components/common/SiteHeader";
import { FacilityShell } from "@/components/common/FacilityShell";
import { StartButton } from "@/components/home/StartButton";

export default function Home() {
  return (
    <FacilityShell>
      <SiteHeader />

      <main className="relative z-10 flex min-h-[calc(100dvh-4.5rem)] items-center px-5 py-14 sm:min-h-[calc(100dvh-5rem)] sm:px-8 sm:py-20 lg:px-14">
        <section aria-labelledby="hero-title" className="mx-auto grid w-full max-w-[90rem] items-end gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="max-w-4xl">
            <p className="facility-kicker flex items-center gap-3 text-[var(--game-accent)]">
              <span className="h-px w-10 bg-[var(--game-success)]" aria-hidden="true" />
              FACILITY RECOVERY PROTOCOL
            </p>

            <p
              className="mt-7 font-mono text-[clamp(3rem,9vw,7.5rem)] font-semibold leading-[0.82] tracking-[-0.075em] text-[var(--game-text-strong)] [text-shadow:0_4px_34px_rgba(0,0,0,0.9)]"
              lang="en"
            >
              OUT OF
              <br />
              BOUNDS
            </p>

            <h1
              id="hero-title"
              className="mt-8 text-[clamp(1.15rem,3vw,1.75rem)] font-medium leading-snug tracking-[-0.02em] text-[var(--game-text)] [text-shadow:0_2px_18px_rgba(0,0,0,0.9)]"
            >
              폐쇄된 연구 시설의 경계를 넘어
              <br className="hidden sm:block" /> 기밀 문서를 회수하십시오.
            </h1>

            <StartButton />
          </div>

          <aside className="facility-panel hidden p-5 font-mono text-xs lg:block" aria-label="작전 상태">
            <div className="flex items-center justify-between border-b border-[var(--game-border)] pb-4">
              <span className="facility-label">MISSION STATUS</span>
              <span className="flex items-center gap-2 text-[var(--game-success)]">
                <span className="facility-status-dot" aria-hidden="true" />
                READY
              </span>
            </div>
            <dl className="mt-4 space-y-3 text-[var(--game-muted)]">
              <div className="flex justify-between gap-4">
                <dt>SECTOR</dt>
                <dd className="text-[var(--game-text)]">RESEARCH COMPLEX</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>OBJECTIVE</dt>
                <dd className="text-[var(--game-text)]">DOCUMENT RECOVERY</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>ACCESS</dt>
                <dd className="text-[var(--game-warning)]">RESTRICTED</dd>
              </div>
            </dl>
          </aside>
        </section>
      </main>
    </FacilityShell>
  );
}
