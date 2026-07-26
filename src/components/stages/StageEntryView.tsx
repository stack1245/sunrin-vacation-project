"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { startStage } from "@/services/progress/startStage";
import type { StageStatus } from "@/types/stage";

interface StageEntryViewProps {
  slug: string;
}

type EntryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      stageOrder: number;
      title: string;
      progressStatus: StageStatus;
    };

export function StageEntryView({ slug }: StageEntryViewProps) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [state, setState] = useState<EntryState>(
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
          .eq("slug", slug)
          .eq("is_published", true)
          .maybeSingle();

        if (stageError) {
          throw new Error(stageError.message);
        }

        if (!stage) {
          throw new Error("요청한 스테이지를 찾을 수 없습니다.");
        }

        const { data: progress, error: progressError } = await supabase
          .from("user_stage_progress")
          .select("status")
          .eq("user_id", user.id)
          .eq("stage_id", stage.id)
          .single();

        if (progressError) {
          throw new Error(progressError.message);
        }

        if (progress.status === "locked") {
          if (isMounted) {
            router.replace("/stages");
          }
          return;
        }

        await startStage(stage.id);

        if (!isMounted) {
          return;
        }

        setState({
          status: "ready",
          stageOrder: stage.stage_order,
          title: stage.title,
          progressStatus:
            progress.status === "unlocked" ? "in_progress" : progress.status,
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
              : "스테이지에 입장하지 못했습니다.",
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [router, slug]);

  if (state.status === "loading") {
    return (
      <div
        className="mx-auto w-full max-w-xl rounded-lg border border-white/10 bg-black/40 p-8 text-center backdrop-blur-md sm:p-12"
        aria-live="polite"
      >
        <p className="text-sm tracking-[0.12em] text-stone-400">
          입장 권한을 확인하고 있습니다…
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="mx-auto w-full max-w-xl rounded-lg border border-red-200/15 bg-black/45 p-8 text-center backdrop-blur-md sm:p-12"
      >
        <p className="text-sm leading-6 text-red-100">{state.message}</p>
        <Link
          href="/stages"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 bg-white/10 px-5 text-sm font-medium text-white transition-colors hover:border-white/70 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
        >
          스테이지 목록으로
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-xl rounded-lg border border-white/15 bg-black/50 p-7 text-center shadow-2xl shadow-black/25 backdrop-blur-md sm:p-12">
      <p className="text-[0.68rem] font-semibold tracking-[0.3em] text-stone-500">
        STAGE {String(state.stageOrder).padStart(2, "0")}
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
        {state.title}
      </h1>
      <p className="mt-5 text-sm leading-6 text-stone-400">
        입장 기록과 마지막 플레이 시각이 저장되었습니다.
        <br />
        실제 퍼즐 콘텐츠는 아직 연결되지 않았습니다.
      </p>
      <p className="mt-5 text-xs text-stone-500">
        현재 상태:{" "}
        {state.progressStatus === "cleared" ? "클리어" : "진행 중"}
      </p>
      <Link
        href="/stages"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-md border border-white/50 bg-white/10 px-6 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
      >
        스테이지 목록으로 돌아가기
      </Link>
    </section>
  );
}
