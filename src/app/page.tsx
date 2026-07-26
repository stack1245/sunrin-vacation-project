import Image from "next/image";
import Link from "next/link";

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-4 focus-visible:ring-offset-[#030708]";

export default function Home() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[url('/background.svg')] bg-cover bg-center bg-no-repeat text-stone-100">
      <header className="relative z-10 h-[4.5rem] border-b border-white/15 bg-black/10 sm:h-20">
        <div className="mx-auto flex h-full w-full max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link
            href="/"
            className={`group flex min-w-0 items-center gap-2.5 rounded-sm sm:gap-3 ${focusStyles}`}
            aria-label="Out Of Bounds 홈으로 이동"
          >
            <Image
              src="/logo.png"
              alt="Out Of Bounds 로고"
              width={1254}
              height={1254}
              priority
              unoptimized
              className="size-9 shrink-0 object-contain transition-opacity duration-200 group-hover:opacity-80 sm:size-11"
            />
            <span className="truncate text-sm font-medium tracking-[0.06em] text-stone-100 sm:text-base sm:tracking-[0.09em]">
              Out Of Bounds
            </span>
          </Link>

          <nav aria-label="회원 메뉴" className="ml-4">
            <ul className="flex items-center gap-3 text-xs font-medium text-stone-300 sm:gap-6 sm:text-sm">
              <li>
                <Link
                  href="/login"
                  className={`rounded-sm px-1 py-2 transition-colors duration-200 hover:text-white ${focusStyles}`}
                >
                  로그인
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className={`rounded-sm px-1 py-2 transition-colors duration-200 hover:text-white ${focusStyles}`}
                >
                  회원가입
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

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

          <Link
            href="/stages"
            className={`mt-9 inline-flex min-h-13 min-w-40 items-center justify-center rounded-md border border-white/65 bg-black/25 px-9 py-3 text-sm font-semibold tracking-[0.24em] text-white backdrop-blur-[2px] transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white/12 active:translate-y-0 active:scale-[0.98] sm:mt-11 sm:min-h-14 sm:min-w-44 ${focusStyles}`}
          >
            START
          </Link>
        </section>
      </main>
    </div>
  );
}
