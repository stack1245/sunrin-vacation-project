import Image from "next/image";
import Link from "next/link";

import { AuthNavigation } from "@/components/auth/AuthNavigation";

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-4 focus-visible:ring-offset-[#030708]";

export function SiteHeader() {
  return (
    <header className="facility-header">
      <a href="#main-content" className="facility-skip-link">
        본문으로 바로가기
      </a>

      <div className="mx-auto flex h-full w-full max-w-[90rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
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
            className="size-9 shrink-0 object-contain drop-shadow-[0_0_14px_rgba(183,216,193,0.12)] transition-[opacity,transform] duration-200 group-hover:scale-[1.03] group-hover:opacity-90 sm:size-10"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-[0.07em] text-[var(--game-text-strong)] sm:text-[0.95rem] sm:tracking-[0.1em]">
              Out Of Bounds
            </span>
            <span className="mt-0.5 hidden items-center gap-1.5 font-mono text-[0.52rem] font-semibold tracking-[0.14em] text-[var(--game-muted)] sm:flex">
              <span className="facility-status-dot" aria-hidden="true" />
              SYSTEM ONLINE
            </span>
          </span>
        </Link>

        <AuthNavigation />
      </div>
    </header>
  );
}

