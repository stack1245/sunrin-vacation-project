export interface Stage {
  id: number;
  title: string;
  description: string;
  stageOrder: number;
}

export interface UserProgress {
  currentStageId: number;
  attemptsLeft: number;
  /** 스테이지 클리어까지 걸린 시간(초). 미완료 상태는 null입니다. */
  clearTime: number | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  /** 이모지, 이미지 경로 또는 아이콘 식별자를 저장할 수 있습니다. */
  icon: string;
}
