import type { Metadata } from "next";

import { FacilityShell } from "@/components/common/FacilityShell";
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
    <FacilityShell>
      <main className="relative z-10 flex min-h-dvh items-center justify-center bg-[#03080d] px-1 py-2 sm:px-3 sm:py-3">
        <StageEntryView slug={slug} />
      </main>
    </FacilityShell>
  );
}
