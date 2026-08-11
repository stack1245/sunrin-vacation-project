import Image from "next/image";
import Link from "next/link";

import { AuthNavigation } from "@/components/auth/AuthNavigation";

const focusStyles =
  "facility-focus";

export function SiteHeader() {
  return (
    <header className="relative z-20 h-[4.5rem] border-b border-[var(--game-border)] bg-[#050b10]/88 backdrop-blur-md sm:h-20">
      <div className="mx-auto flex h-full w-full max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link
          href="/"
          className={`group flex min-w-0 items-center gap-2.5 rounded-[2px] sm:gap-3 ${focusStyles}`}
          aria-label="Out Of Bounds 홈으로 이동"
        >
          <Image
            src="/logo.png"
            alt="Out Of Bounds 로고"
            width={1254}
            height={1254}
            priority
            unoptimized
            className="size-9 shrink-0 object-contain opacity-90 grayscale transition-opacity duration-200 group-hover:opacity-100 sm:size-11"
          />
          <span className="min-w-0">
            <strong className="block truncate font-mono text-xs tracking-[0.16em] text-[var(--game-text-strong)] sm:text-sm">
              OUT OF BOUNDS
            </strong>
            <span className="hidden font-mono text-[0.56rem] tracking-[0.12em] text-[var(--game-muted)] sm:block">
              RESEARCH COMPLEX // RECOVERY NETWORK
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <p className="hidden items-center gap-2 font-mono text-[0.62rem] tracking-[0.1em] text-[var(--game-muted)] lg:flex">
            <span className="facility-status-dot" aria-hidden="true" />
            SYSTEM ONLINE
          </p>
          <AuthNavigation />
        </div>
      </div>
    </header>
  );
}

