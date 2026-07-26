import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function startStage(stageId: number): Promise<void> {
  if (!Number.isInteger(stageId) || stageId <= 0) {
    throw new Error("올바른 스테이지 ID가 필요합니다.");
  }

  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 연결 정보가 설정되지 않았습니다.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { error } = await supabase.rpc("start_stage", {
    p_stage_id: stageId,
  });

  if (error) {
    throw new Error(error.message);
  }
}
