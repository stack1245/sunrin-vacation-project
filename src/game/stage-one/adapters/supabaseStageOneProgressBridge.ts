import "client-only";

import {
  completeStageOne,
  loadStageOneProgress,
  saveStageOneProgress,
  startStageOne,
} from "@/services/progress/stageOneProgressService";
import type { StageOneProgressBridge } from "@/types/stage-one";

export function createSupabaseStageOneProgressBridge(): StageOneProgressBridge {
  return {
    start: startStageOne,
    load: loadStageOneProgress,
    save: (state, elapsedTimeMs) =>
      saveStageOneProgress({ state, elapsedTimeMs }),
    complete: completeStageOne,
  };
}
