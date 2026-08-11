"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { StageOneGameHost } from "@/components/stages/StageOneGameHost";
import { createSupabaseStageOneProgressBridge } from "@/game/stage-one/adapters/supabaseStageOneProgressBridge";
import { getStageOneLaunchRoomId } from "@/game/stage-one/core/initialProgress";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { startStage } from "@/services/progress/startStage";
import type { StageStatus } from "@/types/stage";
import {
  STAGE_ONE_ID,
  type StageOneProgressBridge,
  type StageOneProgressResult,
  type StageOneRoomId,
} from "@/types/stage-one";

interface StageEntryViewProps {
  stageId: number;
}

type EntryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      stageOrder: number;
      title: string;
      progressStatus: StageStatus;
      stageOne:
        | {
            bridge: StageOneProgressBridge;
            initialProgress: StageOneProgressResult;
            initialRoomId: StageOneRoomId;
          }
        | null;
    };

export function StageEntryView({ stageId }: StageEntryViewProps) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const stageOneBootstrapRef = useRef<{
    stageId: number;
    bridge: StageOneProgressBridge;
    promise: Promise<StageOneProgressResult>;
  } | null>(null);
  const [state, setState] = useState<EntryState>(
    configured
      ? { status: "loading" }
      : {
          status: "error",
          message:
            "현재 스테이지에 입장할 수 없습니다. 잠시 후 다시 시도해 주세요.",
        },
  );

  useEffect(() => {
    if (stageOneBootstrapRef.current?.stageId !== stageId) {
      stageOneBootstrapRef.current = null;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (isMounted) {
            router.replace("/login");
          }
          return;
        }

        const { error: setupError } = await supabase.rpc("ensure_user_setup");

        if (setupError) {
          throw new Error(setupError.message);
        }

        const { data: stage, error: stageError } = await supabase
          .from("stages")
          .select("id, title, stage_order")
          .eq("id", stageId)
          .eq("is_published", true)
          .maybeSingle();

        if (stageError) {
          throw new Error(stageError.message);
        }

        if (!stage) {
          if (isMounted) {
            router.replace("/stages");
          }
          return;
        }

        const { data: progress, error: progressError } = await supabase
          .from("user_stage_progress")
          .select("status")
          .eq("user_id", user.id)
          .eq("stage_id", stage.id)
          .maybeSingle();

        if (progressError) {
          throw new Error(progressError.message);
        }

        if (!progress || progress.status === "locked") {
          if (isMounted) {
            router.replace("/stages");
          }
          return;
        }

        let stageOne: Extract<EntryState, { status: "ready" }>["stageOne"] =
          null;

        if (stage.id === STAGE_ONE_ID) {
          let bootstrap = stageOneBootstrapRef.current;

          if (!bootstrap) {
            const bridge = createSupabaseStageOneProgressBridge();
            bootstrap = {
              stageId: stage.id,
              bridge,
              promise: bridge.start(),
            };
            stageOneBootstrapRef.current = bootstrap;
          }

          const initialProgress = await bootstrap.promise;

          stageOne = {
            bridge: bootstrap.bridge,
            initialProgress,
            initialRoomId: getStageOneLaunchRoomId(),
          };
        }

        if (!stageOne) {
          await startStage(stage.id);
        }

        if (!isMounted) {
          return;
        }

        setState({
          status: "ready",
          stageOrder: stage.stage_order,
          title: stage.title,
          progressStatus: stageOne
            ? stageOne.initialProgress.progress.status
            : progress.status === "unlocked"
              ? "in_progress"
              : progress.status,
          stageOne,
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setState({
          status: "error",
          message:
            "스테이지에 입장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [router, stageId]);

  if (state.status === "loading") {
    return (
      <div
        className="facility-panel mx-auto w-full max-w-xl p-8 text-center sm:p-12"
        aria-live="polite"
      >
        <p className="font-mono text-sm tracking-[0.12em] text-[var(--game-muted)]">
          ACCESS VALIDATION IN PROGRESS…
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="facility-panel mx-auto w-full max-w-xl border-[#8b514d] p-8 text-center sm:p-12"
      >
        <p className="text-sm leading-6 text-[var(--game-warning)]">{state.message}</p>
        <Link
          href="/stages"
          className="facility-button facility-focus mt-6 px-5"
        >
          스테이지 목록으로
        </Link>
      </div>
    );
  }

  if (state.stageOne) {
    return (
      <StageOneGameHost
        stageOrder={state.stageOrder}
        title={state.title}
        initialProgress={state.stageOne.initialProgress}
        initialRoomId={state.stageOne.initialRoomId}
        bridge={state.stageOne.bridge}
      />
    );
  }

  return (
    <section className="facility-panel-raised mx-auto w-full max-w-xl p-7 text-center sm:p-12">
      <p className="facility-kicker text-[var(--game-muted)]">
        STAGE {String(state.stageOrder).padStart(2, "0")}
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--game-text-strong)] sm:text-4xl">
        {state.title}
      </h1>
      <p className="mt-5 text-sm leading-6 text-[var(--game-muted)]">
        스테이지 입장이 완료되었습니다.
        <br />
        퍼즐 콘텐츠는 현재 준비 중입니다.
      </p>
      <p className="mt-5 font-mono text-xs text-[var(--game-muted)]">
        현재 상태:{" "}
        {state.progressStatus === "cleared" ? "클리어" : "진행 중"}
      </p>
      <Link
        href="/stages"
        className="facility-button facility-focus mt-8 px-6"
      >
        스테이지 목록으로 돌아가기
      </Link>
    </section>
  );
}
