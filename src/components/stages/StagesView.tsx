"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import type {
  ProfileRow,
  StageRow,
  UserStageProgressRow,
} from "@/types/database";
import type {
  Profile,
  Stage,
  StageStatus,
  StageWithProgress,
  UserStageProgress,
} from "@/types/stage";
import { formatClearTime } from "@/utils/formatClearTime";
import { createStagePath } from "@/utils/stageRoute";

interface StageDashboardData {
  profile: Profile;
  stages: StageWithProgress[];
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: StageDashboardData };

const statusLabels: Record<StageStatus, string> = {
  locked: "잠김",
  unlocked: "입장 가능",
  in_progress: "진행 중",
  cleared: "클리어",
};

const statusStyles: Record<StageStatus, string> = {
  locked:
    "border-[var(--game-border)] bg-[var(--game-void)] text-[var(--game-muted)]",
  unlocked:
    "border-[var(--game-border-strong)] bg-[var(--game-surface-raised)] text-[var(--game-text)]",
  in_progress:
    "border-[#8b6d3e] bg-[#241d12] text-[var(--game-gold)]",
  cleared:
    "border-[#315447] bg-[var(--game-success-surface)] text-[var(--game-accent)]",
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    nickname: row.nickname,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStage(row: StageRow): Stage {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    stageOrder: row.stage_order,
    isPublished: row.is_published,
  };
}

function mapProgress(row: UserStageProgressRow): UserStageProgress {
  return {
    id: row.id,
    userId: row.user_id,
    stageId: row.stage_id,
    status: row.status,
    bestClearTimeMs: row.best_clear_time_ms,
    startedAt: row.started_at,
    clearedAt: row.cleared_at,
    lastPlayedAt: row.last_played_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="size-5"
    >
      <path
        d="M7.75 10V7.75a4.25 4.25 0 0 1 8.5 0V10M6.5 10h11a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-7A1.5 1.5 0 0 1 6.5 10Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StageCard({ stage }: { stage: StageWithProgress }) {
  const { progress } = stage;
  const isLocked = progress.status === "locked";
  const bestTime =
    progress.bestClearTimeMs === null
      ? null
      : formatClearTime(progress.bestClearTimeMs);

  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="facility-kicker text-[var(--game-muted)]">
            STAGE {String(stage.stageOrder).padStart(2, "0")}
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-[var(--game-text-strong)] sm:text-2xl">
            {stage.title}
          </h2>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-[2px] border px-3 py-1 font-mono text-[0.65rem] font-bold tracking-[0.08em] ${statusStyles[progress.status]}`}
        >
          {isLocked && <LockIcon />}
          {statusLabels[progress.status]}
        </span>
      </div>

      <p className="mt-5 min-h-12 text-sm leading-6 text-[var(--game-muted)]">
        {stage.description}
      </p>

      <div className="mt-7 flex min-h-8 items-end justify-between gap-4 border-t border-[var(--game-border)] pt-5 font-mono text-xs">
        {progress.status === "cleared" ? (
          <p className="text-[var(--game-muted)]">
            BEST{" "}
            <span className="ml-1 text-sm text-[var(--game-accent)]">
              {bestTime ?? "--:--.---"}
            </span>
          </p>
        ) : (
          <span className="text-[var(--game-muted)]">
            {isLocked
              ? "이전 스테이지를 완료하면 입장할 수 있습니다."
              : "스테이지에 입장할 수 있습니다."}
          </span>
        )}

        {!isLocked && (
          <span className="shrink-0 font-semibold tracking-[0.12em] text-[var(--game-accent)]">
            {progress.status === "in_progress"
              ? "이어하기"
              : progress.status === "cleared"
                ? "다시 입장"
                : "입장"}
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </span>
        )}
      </div>
    </>
  );

  const cardStyles =
    "block h-full rounded-[4px] border p-5 text-left sm:p-6";

  if (isLocked) {
    return (
      <article
        className={`${cardStyles} cursor-not-allowed border-[var(--game-border)] bg-[#071018]/80 opacity-65`}
      >
        {cardContent}
      </article>
    );
  }

  return (
    <Link
      href={createStagePath(stage.id)}
      aria-label={`${stage.title} ${
        progress.status === "in_progress" ? "이어하기" : "입장"
      }`}
      className={`${cardStyles} facility-focus group border-[var(--game-border)] bg-[#071018]/94 shadow-xl shadow-black/25 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-1 hover:border-[var(--game-border-strong)] hover:bg-[var(--game-surface-raised)] active:translate-y-0`}
    >
      {cardContent}
    </Link>
  );
}

export function StagesView() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<LoadState>(
    configured
      ? { status: "loading" }
      : {
          status: "error",
          message:
            "현재 스테이지 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.",
        },
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    void (async () => {
      setState({ status: "loading" });

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

        const [profileResult, stagesResult, progressResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single(),
          supabase
            .from("stages")
            .select("*")
            .eq("is_published", true)
            .order("stage_order"),
          supabase
            .from("user_stage_progress")
            .select("*")
            .eq("user_id", user.id),
        ]);

        if (profileResult.error) {
          throw new Error(profileResult.error.message);
        }

        if (stagesResult.error) {
          throw new Error(stagesResult.error.message);
        }

        if (progressResult.error) {
          throw new Error(progressResult.error.message);
        }

        const progressByStage = new Map(
          progressResult.data.map((row) => [row.stage_id, mapProgress(row)]),
        );

        const stages = stagesResult.data.map((row) => {
          const stage = mapStage(row);
          const progress = progressByStage.get(stage.id);

          if (!progress) {
            throw new Error(
              `${stage.title} 스테이지의 진행도 정보를 찾을 수 없습니다.`,
            );
          }

          return {
            ...stage,
            progress,
          };
        });

        if (!isMounted) {
          return;
        }

        setState({
          status: "ready",
          data: {
            profile: mapProfile(profileResult.data),
            stages,
          },
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setState({
          status: "error",
          message:
            "스테이지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [reloadKey, router]);

  const currentStage = useMemo(() => {
    if (state.status !== "ready") {
      return null;
    }

    return (
      state.data.stages.find(
        (stage) => stage.progress.status === "in_progress",
      ) ??
      state.data.stages.find(
        (stage) => stage.progress.status === "unlocked",
      ) ??
      [...state.data.stages]
        .reverse()
        .find((stage) => stage.progress.status === "cleared") ??
      null
    );
  }, [state]);

  if (state.status === "loading") {
    return (
      <div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-label="스테이지 정보를 불러오는 중"
      >
        {[1, 2, 3].map((stageNumber) => (
          <div
            key={stageNumber}
            className="h-64 animate-pulse rounded-[4px] border border-[var(--game-border)] bg-[var(--game-surface)]"
          />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="facility-panel px-6 py-8 text-center"
      >
        <p className="text-sm leading-6 text-[var(--game-warning)]">{state.message}</p>
        <button
          type="button"
          onClick={() => setReloadKey((current) => current + 1)}
          className="facility-button facility-focus mt-5 px-5"
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-2 border-l border-[var(--game-success)] pl-4 font-mono text-sm text-[var(--game-muted)] sm:mb-9 sm:flex-row sm:items-center sm:gap-5">
        <p>
          플레이어{" "}
          <strong className="font-medium text-[var(--game-text-strong)]">
            {state.data.profile.nickname}
          </strong>
        </p>
        {currentStage && (
          <p>
            현재 진행{" "}
            <strong className="font-medium text-[var(--game-accent)]">
              Stage {currentStage.stageOrder}
            </strong>
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.data.stages.map((stage) => (
          <StageCard key={stage.id} stage={stage} />
        ))}
      </div>
    </>
  );
}
