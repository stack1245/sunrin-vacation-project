export type StageStatus =
  | "locked"
  | "unlocked"
  | "in_progress"
  | "cleared";

export interface Profile {
  id: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stage {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  stageOrder: number;
  isPublished: boolean;
}

export interface UserStageProgress {
  id: string;
  userId: string;
  stageId: number;
  status: StageStatus;
  bestClearTimeMs: number | null;
  startedAt: string | null;
  clearedAt: string | null;
  lastPlayedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StageWithProgress extends Stage {
  progress: UserStageProgress;
}
