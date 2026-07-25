import { notFound } from "next/navigation";

import { StageGame } from "@/components/game/StageGame";
import type { Stage } from "@/types/game";

const stages: Stage[] = [
  {
    id: 1,
    title: "통제실",
    description: "멈춘 시스템을 재가동하고 첫 번째 출구 좌표를 확보하세요.",
    stageOrder: 1,
  },
  {
    id: 2,
    title: "경계 구역",
    description: "왜곡된 기록 사이에서 진짜 접근 코드를 찾아내세요.",
    stageOrder: 2,
  },
  {
    id: 3,
    title: "아웃 오브 바운즈",
    description: "이야기의 마지막 경계를 넘어 탈출 프로토콜을 완성하세요.",
    stageOrder: 3,
  },
];

interface StagePageProps {
  params: Promise<{ id: string }>;
}

export default async function StagePage({ params }: StagePageProps) {
  const { id } = await params;
  const stageId = Number(id);
  const stage = stages.find((item) => item.id === stageId);

  if (!stage) notFound();

  return (
    <StageGame
      stageId={stage.id}
      title={stage.title}
      description={stage.description}
    />
  );
}
