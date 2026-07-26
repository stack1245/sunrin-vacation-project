import type { ReactNode } from "react";

import { SiteHeader } from "@/components/common/SiteHeader";

interface AuthPageShellProps {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}

export function AuthPageShell({
  children,
  description,
  eyebrow,
  title,
}: AuthPageShellProps) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[url('/background.svg')] bg-cover bg-center bg-no-repeat text-stone-100">
      <SiteHeader />

      <main className="relative z-10 flex min-h-[calc(100dvh-4.5rem)] items-center justify-center px-4 py-10 sm:min-h-[calc(100dvh-5rem)] sm:px-6 sm:py-14">
        <section className="w-full max-w-md rounded-lg border border-white/15 bg-black/55 p-6 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-9">
          <p className="text-[0.65rem] font-semibold tracking-[0.28em] text-stone-400">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            {description}
          </p>

          <div className="mt-8">{children}</div>
        </section>
      </main>
    </div>
  );
}

