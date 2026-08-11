import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StageEntryView } from "@/components/stages/StageEntryView";
import { parseStageIdPathSegment } from "@/utils/stageRoute";

export const metadata: Metadata = {
  title: "스테이지 입장 | OutOfBounds",
  description: "OutOfBounds 스테이지에 입장합니다.",
};

interface StageEntryPageProps {
  params: Promise<{
    stageId: string;
  }>;
}

export default async function StageEntryPage({
  params,
}: StageEntryPageProps) {
  const { stageId: stageIdSegment } = await params;
  const stageId = parseStageIdPathSegment(stageIdSegment);

  if (stageId === null) {
    notFound();
  }

  return (
    <main className="flex h-dvh w-full items-center justify-center overflow-hidden bg-[#030708]">
      <StageEntryView stageId={stageId} />
    </main>
  );
}
