import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/common/SiteHeader";
import { StageEntryView } from "@/components/stages/StageEntryView";

export const metadata: Metadata = {
  title: "스테이지 입장 | OutOfBounds",
  description: "OutOfBounds 스테이지에 입장합니다.",
};

interface StageEntryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function StageEntryPage({
  params,
}: StageEntryPageProps) {
  const { slug } = await params;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[url('/background.svg')] bg-cover bg-center bg-no-repeat text-stone-100">
      <SiteHeader />

      <main className="relative z-10 flex min-h-[calc(100dvh-4.5rem)] flex-col px-4 py-8 sm:min-h-[calc(100dvh-5rem)] sm:px-6 sm:py-10">
        <div className="mx-auto mb-6 w-full max-w-6xl">
          <Link
            href="/stages"
            className="inline-flex min-h-10 items-center rounded-sm text-xs font-medium tracking-[0.12em] text-stone-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
          >
            <span aria-hidden="true" className="mr-2">
              ←
            </span>
            STAGES
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center pb-12">
          <StageEntryView slug={slug} />
        </div>
      </main>
    </div>
  );
}
