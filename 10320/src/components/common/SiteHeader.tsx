import Image from "next/image";
import Link from "next/link";

import { AuthNavigation } from "@/components/auth/AuthNavigation";

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-4 focus-visible:ring-offset-[#030708]";

export function SiteHeader() {
  return (
    <header className="relative z-20 h-[4.5rem] border-b border-white/15 bg-black/10 sm:h-20">
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

        <AuthNavigation />
      </div>
    </header>
  );
}

