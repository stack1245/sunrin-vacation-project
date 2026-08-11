import type { Metadata } from "next";

import { AccountSettings } from "@/components/account/AccountSettings";
import { SiteHeader } from "@/components/common/SiteHeader";

export const metadata: Metadata = {
  title: "회원정보 | Out Of Bounds",
  description: "Out Of Bounds 회원정보와 게임 데이터를 관리합니다.",
};

export default function AccountPage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[url('/background.svg')] bg-cover bg-center bg-fixed bg-no-repeat text-stone-100">
      <div className="absolute inset-0 bg-[#030708]/55" aria-hidden="true" />
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <p className="text-[0.68rem] font-semibold tracking-[0.3em] text-stone-500">ACCOUNT CONTROL</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">회원정보 관리</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400 sm:text-base">
          플레이에 필요한 최소 회원정보와 보안 설정만 관리합니다.
        </p>

        <div className="mt-8">
          <AccountSettings />
        </div>
      </main>
    </div>
  );
}
