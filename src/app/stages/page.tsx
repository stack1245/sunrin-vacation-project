import type { Metadata } from "next";
import Link from "next/link";

import { FacilityShell } from "@/components/common/FacilityShell";
import { SiteHeader } from "@/components/common/SiteHeader";
import { StagesView } from "@/components/stages/StagesView";

export const metadata: Metadata = {
  title: "스테이지 | OutOfBounds",
  description: "OutOfBounds의 스테이지 진행도와 해금 상태를 확인합니다.",
};

export default function StagesPage() {
  return (
    <FacilityShell>
      <SiteHeader />

      <main className="relative z-10 min-h-[calc(100dvh-4.5rem)] px-4 py-10 sm:min-h-[calc(100dvh-5rem)] sm:px-6 sm:py-14 lg:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <Link
            href="/"
            className="facility-back-link facility-focus"
          >
            <span aria-hidden="true" className="mr-2">
              ←
            </span>
            HOME
          </Link>

          <div className="mb-9 mt-5 sm:mb-11">
            <p className="facility-kicker text-[var(--game-accent)]">
              ESCAPE SEQUENCE // ACCESS MAP
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--game-text-strong)] sm:text-5xl">
              스테이지 선택
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--game-muted)] sm:text-base sm:leading-7">
              경계는 순서대로 열립니다. 이전 스테이지를 완료하고 다음
              이야기로 나아가세요.
            </p>
          </div>

          <StagesView />
        </div>
      </main>
    </FacilityShell>
  );
}
