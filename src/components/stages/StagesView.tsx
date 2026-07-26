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
  locked: "border-white/10 bg-black/35 text-stone-500",
  unlocked: "border-white/30 bg-black/45 text-stone-100",
  in_progress: "border-amber-100/30 bg-amber-950/20 text-amber-100",
  cleared: "border-emerald-100/25 bg-emerald-950/20 text-emerald-100",
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
          <p className="text-[0.65rem] font-semibold tracking-[0.28em] text-stone-500">
            STAGE {String(stage.stageOrder).padStart(2, "0")}
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-white sm:text-2xl">
            {stage.title}
          </h2>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-medium ${statusStyles[progress.status]}`}
        >
          {isLocked && <LockIcon />}
          {statusLabels[progress.status]}
        </span>
      </div>

      <p className="mt-5 min-h-12 text-sm leading-6 text-stone-400">
        {stage.description}
      </p>

      <div className="mt-7 flex min-h-8 items-end justify-between gap-4 border-t border-white/10 pt-5 text-xs">
        {progress.status === "cleared" ? (
          <p className="text-stone-400">
            BEST{" "}
            <span className="ml-1 font-mono text-sm text-stone-100">
              {bestTime ?? "--:--.---"}
            </span>
          </p>
        ) : (
          <span className="text-stone-500">
            {isLocked ? "이전 스테이지를 먼저 완료하세요." : "준비가 되면 입장하세요."}
          </span>
        )}

        {!isLocked && (
          <span className="shrink-0 font-semibold tracking-[0.12em] text-stone-200">
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
    "block h-full rounded-lg border p-5 text-left backdrop-blur-md sm:p-6";

  if (isLocked) {
    return (
      <article
        className={`${cardStyles} cursor-not-allowed border-white/10 bg-black/40 opacity-70`}
      >
        {cardContent}
      </article>
    );
  }

  return (
    <Link
      href={`/stages/${stage.slug}`}
      aria-label={`${stage.title} ${
        progress.status === "in_progress" ? "이어하기" : "입장"
      }`}
      className={`${cardStyles} group border-white/20 bg-black/45 shadow-xl shadow-black/15 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-1 hover:border-white/45 hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-4 focus-visible:ring-offset-[#030708] active:translate-y-0`}
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
            "Supabase 연결 정보가 설정되지 않았습니다. 환경변수를 확인해 주세요.",
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
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "스테이지 정보를 불러오지 못했습니다.",
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
            className="h-64 animate-pulse rounded-lg border border-white/10 bg-black/35"
          />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200/15 bg-black/45 px-6 py-8 text-center backdrop-blur-md"
      >
        <p className="text-sm leading-6 text-red-100">{state.message}</p>
        <button
          type="button"
          onClick={() => setReloadKey((current) => current + 1)}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 bg-white/10 px-5 text-sm font-medium text-white transition-colors hover:border-white/70 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-2 border-l border-white/30 pl-4 text-sm text-stone-400 sm:mb-9 sm:flex-row sm:items-center sm:gap-5">
        <p>
          플레이어{" "}
          <strong className="font-medium text-stone-100">
            {state.data.profile.nickname}
          </strong>
        </p>
        {currentStage && (
          <p>
            현재 진행{" "}
            <strong className="font-medium text-stone-100">
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
