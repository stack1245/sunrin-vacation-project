"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  StageOneGameEventMap,
  StageOneGameMessage,
  StageOneHudState,
  StageOneSaveStatus,
} from "@/game/stage-one/contracts/events";
import { StageOneEventBus } from "@/game/stage-one/core/eventBus";
import { getInteractionActionLabel } from "@/game/stage-one/core/interactionFeedback";
import type { StageOneGameHandle } from "@/game/stage-one/core/createStageOneGame";
import type {
  StageOneProgressBridge,
  StageOneProgressResult,
  StageOneRoomId,
} from "@/types/stage-one";
import { STAGE_ONE_ROOM_DISPLAY_NAMES } from "@/types/stage-one";
import { formatClearTime } from "@/utils/formatClearTime";

interface StageOneGameHostProps {
  stageOrder: number;
  title: string;
  initialProgress: StageOneProgressResult;
  initialRoomId: StageOneRoomId;
  bridge: StageOneProgressBridge;
}

const INITIAL_SAVE_STATUS: StageOneSaveStatus = {
  phase: "idle",
  attempt: 0,
  maxAttempts: 4,
  message: "현재 저장 상태와 동기화되었습니다.",
};

function createInitialHud(
  initialProgress: StageOneProgressResult,
  initialRoomId: StageOneRoomId,
): StageOneHudState {
  const { state, elapsedTimeMs } = initialProgress;
  const initialState = {
    ...state,
    currentRoom: initialRoomId,
  };

  return {
    roomId: initialRoomId,
    roomName: STAGE_ONE_ROOM_DISPLAY_NAMES[initialRoomId],
    objective: "Stage 1 게임 시스템을 준비하고 있습니다.",
    elapsedTimeMs,
    paused: false,
    interactionPrompt: null,
    state: initialState,
  };
}

function getSaveStatusLabel(status: StageOneSaveStatus): string {
  switch (status.phase) {
    case "saving":
      return "저장 중";
    case "retrying":
      return "재시도 중";
    case "saved":
      return "저장됨";
    case "failed":
      return "저장 실패";
    default:
      return "동기화됨";
  }
}

export function StageOneGameHost({
  stageOrder,
  title,
  initialProgress,
  initialRoomId,
  bridge,
}: StageOneGameHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameHandleRef = useRef<StageOneGameHandle | null>(null);
  const [bootStatus, setBootStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [hud, setHud] = useState<StageOneHudState>(() =>
    createInitialHud(initialProgress, initialRoomId),
  );
  const [saveStatus, setSaveStatus] =
    useState<StageOneSaveStatus>(INITIAL_SAVE_STATUS);
  const [message, setMessage] = useState<StageOneGameMessage | null>(null);
  const [completed, setCompleted] = useState(
    initialProgress.progress.status === "cleared",
  );

  useEffect(() => {
    const parent = containerRef.current;

    if (!parent) {
      return;
    }

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    const events = new StageOneEventBus<StageOneGameEventMap>();
    const unsubscribers = [
      events.on("ready", (nextHud) => {
        setHud(nextHud);
        setBootStatus("ready");
      }),
      events.on("hud", setHud),
      events.on("save-status", setSaveStatus),
      events.on("message", setMessage),
      events.on("complete", (result) => {
        setCompleted(result.progress.status === "cleared");
      }),
      events.on("fatal-error", (fatalMessage) => {
        setMessage(fatalMessage);
        setBootStatus("error");
      }),
    ];

    void (async () => {
      try {
        const { createStageOneGame } = await import(
          "@/game/stage-one/core/createStageOneGame"
        );

        if (cancelled) {
          return;
        }

        const handle = createStageOneGame({
          parent,
          initialProgress,
          initialRoomId,
          bridge,
          events,
        });

        gameHandleRef.current = handle;

        if ("ResizeObserver" in window) {
          resizeObserver = new ResizeObserver(() => {
            handle.refreshSize();
          });
          resizeObserver.observe(parent);
        }
      } catch {
        if (!cancelled) {
          setBootStatus("error");
          setMessage({
            tone: "error",
            text: "Stage 1 게임을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      gameHandleRef.current?.destroy();
      gameHandleRef.current = null;

      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }

      events.clear();
    };
  }, [bridge, initialProgress, initialRoomId]);

  const completedFlags = useMemo(
    () =>
      [
        hud.state.hasKeycard,
        hud.state.entranceUnlocked,
        hud.state.archiveClueFound,
        hud.state.scienceLabPuzzleSolved,
        hud.state.controlRoomSolved,
        hud.state.documentStorageUnlocked,
        hud.state.confidentialDocumentObtained,
        hud.state.escaped,
      ].filter(Boolean).length,
    [hud.state],
  );

  const handlePauseToggle = () => {
    if (hud.paused) {
      gameHandleRef.current?.resume();
    } else {
      gameHandleRef.current?.pause();
    }
  };

  const handleRetrySave = () => {
    void gameHandleRef.current?.retrySave();
  };

  return (
    <section
      className="relative h-dvh w-full overflow-hidden bg-[#030708]"
      aria-labelledby="stage-one-title"
    >
      <div className="pointer-events-none absolute inset-x-3 top-3 z-30 flex flex-col gap-4 rounded-lg border border-white/10 bg-black/55 p-4 backdrop-blur-md sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-semibold tracking-[0.3em] text-violet-300/70">
            STAGE {String(stageOrder).padStart(2, "0")}
          </p>
          <h1
            id="stage-one-title"
            className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl"
          >
            {title}
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-5 text-left text-xs sm:text-right">
          <div>
            <span className="block text-stone-500">현재 위치</span>
            <strong className="mt-1 block font-medium text-stone-100">
              {hud.roomName}
            </strong>
          </div>
          <div>
            <span className="block text-stone-500">경과 시간</span>
            <strong className="mt-1 block font-medium tabular-nums text-stone-100">
              {formatClearTime(hud.elapsedTimeMs)}
            </strong>
          </div>
          <div>
            <span className="block text-stone-500">진행</span>
            <strong className="mt-1 block font-medium text-stone-100">
              {completedFlags} / 8
            </strong>
          </div>
        </div>
      </div>

      <div className="relative h-full w-full">
        <div className="h-full w-full overflow-hidden bg-[#030708]">
          <div
            ref={containerRef}
            className="relative h-full w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-300"
            tabIndex={0}
            role="application"
            aria-label="OutOfBounds Stage 1 게임 화면"
            onPointerDown={(event) => event.currentTarget.focus()}
          >
            {bootStatus !== "ready" ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#030708] px-6 text-center">
                <p
                  role={bootStatus === "error" ? "alert" : undefined}
                  className={
                    bootStatus === "error"
                      ? "text-sm leading-6 text-red-200"
                      : "text-sm tracking-[0.12em] text-stone-400"
                  }
                >
                  {bootStatus === "error"
                    ? "게임 화면을 불러오지 못했습니다."
                    : "PHASER 시스템을 준비하고 있습니다…"}
                </p>
              </div>
            ) : null}

            {hud.paused ? (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                <div className="rounded-md border border-white/20 bg-black/70 px-8 py-6 text-center">
                  <p className="text-xs font-semibold tracking-[0.28em] text-violet-200">
                    PAUSED
                  </p>
                  <p className="mt-3 text-sm text-stone-300">
                    Escape 또는 계속하기 버튼으로 돌아갑니다.
                  </p>
                </div>
              </div>
            ) : null}

            {hud.interactionPrompt && !hud.paused ? (
              <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 flex w-[min(90%,36rem)] -translate-x-1/2 items-center justify-center gap-3 rounded-md border border-emerald-200/70 bg-[#03080d]/96 px-4 py-3 text-sm text-stone-100 shadow-[0_0_28px_rgba(183,216,193,0.24)] backdrop-blur-sm">
                <kbd className="inline-flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-sm border border-emerald-200 bg-[#14261f] px-2 font-mono text-sm font-bold text-white motion-safe:animate-pulse">
                  E
                </kbd>
                <span className="leading-5 tracking-[0.02em]">
                  {getInteractionActionLabel(hud.interactionPrompt)}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="absolute bottom-4 right-4 top-32 z-30 hidden w-72 flex-col gap-4 overflow-y-auto rounded-lg border border-white/10 bg-black/70 p-5 backdrop-blur-md lg:flex">
          <div>
            <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-stone-500">
              CURRENT OBJECTIVE
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-200">{hud.objective}</p>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-stone-500">저장 상태</span>
              <strong
                className={
                  saveStatus.phase === "failed"
                    ? "text-xs font-medium text-red-200"
                    : saveStatus.phase === "retrying"
                      ? "text-xs font-medium text-amber-200"
                      : "text-xs font-medium text-emerald-200"
                }
              >
                {getSaveStatusLabel(saveStatus)}
              </strong>
            </div>
            <p className="mt-2 text-xs leading-5 text-stone-500">
              {saveStatus.message}
            </p>
          </div>

          <div className="border-t border-white/10 pt-4 text-xs leading-5 text-stone-400">
            <p>이동 · WASD / 방향키</p>
            <p>달리기 · Space</p>
            <p>상호작용 · E</p>
            <p>일시정지 · Escape</p>
          </div>

          <div className="mt-auto grid gap-2 pt-2">
            <button
              type="button"
              onClick={handlePauseToggle}
              disabled={bootStatus !== "ready"}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/30 bg-white/5 px-4 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {hud.paused ? "계속하기" : "일시정지"}
            </button>
            {saveStatus.phase === "failed" ? (
              <button
                type="button"
                onClick={handleRetrySave}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-amber-200/30 bg-amber-200/5 px-4 text-sm font-medium text-amber-100 transition-colors hover:border-amber-200/60 hover:bg-amber-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-100"
              >
                저장 다시 시도
              </button>
            ) : null}
            <Link
              href="/stages"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/20 px-4 text-sm text-stone-300 transition-colors hover:border-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
            >
              Stage 나가기
            </Link>
          </div>
        </aside>
      </div>

      <div
        className="pointer-events-none absolute bottom-4 left-1/2 z-30 w-[min(90%,40rem)] -translate-x-1/2"
        aria-live="polite"
        aria-atomic="true"
      >
        {message ? (
          <p
            className={
              message.tone === "error"
                ? "rounded-md border border-red-200/15 bg-red-950/30 px-4 py-3 text-sm text-red-100"
                : message.tone === "warning"
                  ? "rounded-md border border-amber-200/15 bg-amber-950/25 px-4 py-3 text-sm text-amber-100"
                  : message.tone === "success"
                    ? "rounded-md border border-emerald-200/15 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100"
                    : "rounded-md border border-white/10 bg-black/35 px-4 py-3 text-sm text-stone-300"
            }
          >
            {message.text}
          </p>
        ) : null}
      </div>

      {completed ? (
        <p className="pointer-events-none absolute bottom-4 left-4 z-30 text-sm font-medium text-emerald-200">
          Stage 1 클리어 상태입니다. 기존 저장을 유지한 채 다시 입장했습니다.
        </p>
      ) : null}
    </section>
  );
}
