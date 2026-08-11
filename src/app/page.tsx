import { SiteHeader } from "@/components/common/SiteHeader";
import { FacilityShell } from "@/components/common/FacilityShell";
import { StartButton } from "@/components/home/StartButton";

export default function HomePage() {
  return (
    <FacilityShell>
      <SiteHeader />

      <main
        id="main-content"
        className="relative z-10 flex min-h-[calc(100dvh-var(--site-header-height))] items-center justify-center px-5 py-12 text-center sm:px-8 sm:py-16"
      >
        <section aria-labelledby="hero-title" className="w-full max-w-4xl">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--game-border)] bg-black/35 px-3.5 py-2 font-mono text-[0.62rem] font-bold tracking-[0.12em] text-[var(--game-muted)] backdrop-blur-md sm:text-[0.68rem]">
            <span className="facility-status-dot" aria-hidden="true" />
            ESCAPE PROTOCOL READY
          </div>

          <p
            className="mt-7 font-sans text-[clamp(2.65rem,9.5vw,6.4rem)] font-semibold leading-[0.92] tracking-[-0.065em] text-[var(--game-text-strong)] [text-shadow:0_4px_36px_rgba(0,0,0,0.9)] sm:mt-9"
            lang="en"
          >
            Out Of Bounds
          </p>

          <h1
            id="hero-title"
            className="mt-7 text-[clamp(1.35rem,4.5vw,2.45rem)] font-semibold leading-snug tracking-[-0.035em] text-[var(--game-text-strong)] [text-shadow:0_2px_18px_rgba(0,0,0,0.9)] sm:mt-9"
          >
            경계 밖으로 나아가시겠습니까?
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--game-muted)] [text-shadow:0_2px_12px_rgba(0,0,0,0.95)] sm:mt-5 sm:text-base sm:leading-7">
            단서를 연결하고 잠긴 구역을 돌파해 폐쇄된 시설의 진실과
            탈출 경로를 찾아내세요.
          </p>

          <div className="mt-8 flex justify-center sm:mt-10">
            <StartButton />
          </div>

          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-2 sm:mt-10 sm:gap-3">
            <span className="facility-chip">SIDE VIEW</span>
            <span className="facility-chip">STORY PUZZLE</span>
            <span className="facility-chip">AUTO SAVE</span>
          </div>
        </section>
      </main>
    </FacilityShell>
  );
}
