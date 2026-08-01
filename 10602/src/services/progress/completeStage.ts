import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function completeStage(
  stageId: number,
  clearTimeMs: number,
): Promise<void> {
  if (!Number.isInteger(stageId) || stageId <= 0) {
    throw new Error("스테이지 정보를 확인할 수 없습니다.");
  }

  if (!Number.isSafeInteger(clearTimeMs) || clearTimeMs <= 0) {
    throw new Error("클리어 기록을 저장할 수 없습니다.");
  }

  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error(
      "게임 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인 후 이용해 주세요.");
  }

  const { error } = await supabase.rpc("complete_stage", {
    p_stage_id: stageId,
    p_clear_time_ms: clearTimeMs,
  });

  if (error) {
    throw new Error(
      "클리어 기록을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }
}
