import type { Metadata } from "next";
import Link from "next/link";

import { AccountSettings } from "@/components/account/AccountSettings";
import { FacilityShell } from "@/components/common/FacilityShell";
import { SiteHeader } from "@/components/common/SiteHeader";

export const metadata: Metadata = {
  title: "회원정보 | Out Of Bounds",
  description: "Out Of Bounds 회원정보와 게임 데이터를 관리합니다.",
};

export default function AccountPage() {
  return (
    <FacilityShell>
      <SiteHeader />

      <main id="main-content" className="facility-page">
        <div className="mx-auto w-full max-w-5xl">
          <Link href="/stages" className="facility-back-link facility-focus">
            <span aria-hidden="true" className="mr-2">←</span>
            STAGES
          </Link>

          <div className="facility-page-intro mt-5">
            <p className="facility-kicker text-[var(--game-accent)]">ACCOUNT CONTROL</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--game-text-strong)] sm:text-4xl">회원정보 관리</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--game-muted)] sm:text-base">
              플레이에 필요한 최소 회원정보와 보안 설정만 관리합니다.
            </p>
          </div>

          <div className="mt-8">
            <AccountSettings />
          </div>
        </div>
      </main>
    </FacilityShell>
  );
}
