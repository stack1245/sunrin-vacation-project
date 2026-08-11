import { SiteHeader } from "@/components/common/SiteHeader";
import { StartButton } from "@/components/home/StartButton";

export default function Home() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[url('/background.svg')] bg-cover bg-center bg-no-repeat text-stone-100">
      <SiteHeader />

      <main className="relative z-10 flex min-h-[calc(100dvh-4.5rem)] items-center justify-center px-5 py-14 text-center sm:min-h-[calc(100dvh-5rem)] sm:px-8 sm:py-20">
        <section aria-labelledby="hero-title" className="w-full max-w-3xl">
          <p
            className="font-serif text-[clamp(2.25rem,8vw,5.5rem)] leading-none tracking-[-0.035em] text-white [text-shadow:0_3px_28px_rgba(0,0,0,0.85)]"
            lang="en"
          >
            Out Of Bounds
          </p>

          <h1
            id="hero-title"
            className="mt-7 text-[clamp(1.25rem,4.5vw,2.25rem)] font-medium leading-snug tracking-[-0.025em] text-stone-100 [text-shadow:0_2px_18px_rgba(0,0,0,0.9)] sm:mt-9"
          >
            경계 밖으로 나아가시겠습니까?
          </h1>

          <StartButton />
        </section>
      </main>
    </div>
  );
}
