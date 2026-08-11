"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { ScienceLabPuzzleModal } from "./ScienceLabPuzzleModal";
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
import { createAnimationFrameBatcher } from "@/utils/animationFrameBatcher";
import { formatClearTime } from "@/utils/formatClearTime";

const DocumentStoragePuzzleModal = dynamic(
  () =>
    import("./DocumentStoragePuzzleModal").then(
      (module) => module.DocumentStoragePuzzleModal,
    ),
  { ssr: false },
);

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
    const resizeBatcher = createAnimationFrameBatcher(
      window.requestAnimationFrame.bind(window),
      window.cancelAnimationFrame.bind(window),
    );
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
            resizeBatcher.schedule(() => {
              handle.refreshSize();
            });
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
      resizeBatcher.cancel();
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
      className="game-interface h-dvh w-full overflow-hidden"
      aria-labelledby="stage-one-title"
    >
      <h1 id="stage-one-title" className="sr-only">
        {title} · Stage {stageOrder}
      </h1>

      <div
        ref={containerRef}
        className="game-grid-surface relative h-full w-full overflow-hidden bg-[var(--game-void)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--game-accent)]"
        tabIndex={0}
        role="application"
        aria-label="OutOfBounds Stage 1 횡스크롤 게임 화면"
        onPointerDown={(event) => event.currentTarget.focus()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 grid min-h-14 grid-cols-[1fr_auto] border-b border-white/10 bg-[#03080d]/90 px-3 font-mono backdrop-blur-sm sm:grid-cols-[1.45fr_repeat(3,1fr)_auto] sm:px-5">
          <div className="flex min-w-0 items-center border-r border-white/10 pr-3">
            <p className="truncate text-[0.58rem] font-semibold tracking-[0.18em] text-[var(--game-text-strong)] sm:text-[0.68rem]">
              OUTOFBOUNDS <span className="text-[var(--game-muted)]">{"//"} STAGE {String(stageOrder).padStart(2, "0")}</span>
            </p>
          </div>
          <div className="hidden items-center border-r border-white/10 px-4 sm:flex">
            <p><span className="block text-[0.48rem] tracking-[0.16em] text-[var(--game-muted)]">TIME</span><strong className="text-xs font-medium tabular-nums text-[var(--game-text)]">{formatClearTime(hud.elapsedTimeMs)}</strong></p>
          </div>
          <div className="hidden min-w-0 items-center border-r border-white/10 px-4 sm:flex">
            <p className="min-w-0"><span className="block text-[0.48rem] tracking-[0.16em] text-[var(--game-muted)]">SECTOR</span><strong className="block truncate text-xs font-medium text-[var(--game-text)]">{hud.roomName}</strong></p>
          </div>
          <div className="hidden items-center border-r border-white/10 px-4 sm:flex">
            <p><span className="block text-[0.48rem] tracking-[0.16em] text-[var(--game-muted)]">PROGRESS</span><strong className="text-xs font-medium text-[var(--game-accent)]">{String(completedFlags).padStart(2, "0")} / 08</strong></p>
          </div>
          <div className="pointer-events-auto flex items-center gap-1 pl-2 sm:pl-3">
            <span
              className={saveStatus.phase === "failed" ? "mr-1 text-[0.55rem] text-[var(--game-warning)]" : "mr-1 text-[0.55rem] text-[var(--game-success)]"}
              title={saveStatus.message}
            >
              {getSaveStatusLabel(saveStatus)}
            </span>
            <button
              type="button"
              onClick={handlePauseToggle}
              disabled={bootStatus !== "ready"}
              className="min-h-8 border border-white/15 px-2 text-[0.55rem] tracking-[0.12em] text-[var(--game-text)] transition-colors hover:border-[var(--game-accent)] disabled:opacity-40"
            >
              {hud.paused ? "RESUME" : "PAUSE"}
            </button>
            <Link
              href="/stages"
              className="inline-flex min-h-8 items-center border border-white/15 px-2 text-[0.55rem] tracking-[0.12em] text-[var(--game-muted)] transition-colors hover:border-white/40 hover:text-[var(--game-text)]"
            >
              EXIT
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute left-4 top-[4.5rem] z-20 max-w-[16rem] font-mono sm:left-6 sm:top-20 sm:max-w-xs">
          <p className="text-[0.52rem] tracking-[0.2em] text-[var(--game-accent)]">CURRENT OBJECTIVE</p>
          <p className="mt-1.5 text-[0.62rem] leading-5 text-[var(--game-text)] sm:text-xs">{hud.objective}</p>
          <div className="mt-4 hidden border-l border-white/15 pl-3 text-[0.55rem] leading-5 text-[var(--game-muted)] sm:block">
            <p>A / D · MOVE</p>
            <p>W / SPACE · JUMP</p>
            <p>S · CROUCH &nbsp; SHIFT · RUN</p>
            <p>E · INTERACT &nbsp; ESC · PAUSE</p>
          </div>
        </div>

        {bootStatus !== "ready" ? (
          <div className="game-grid-surface absolute inset-0 z-40 flex items-center justify-center px-6 text-center">
            <p role={bootStatus === "error" ? "alert" : undefined} className={bootStatus === "error" ? "text-sm leading-6 text-[var(--game-warning)]" : "font-mono text-sm tracking-[0.12em] text-[var(--game-muted)]"}>
              {bootStatus === "error" ? "게임 화면을 불러오지 못했습니다." : "PHASER SYSTEM BOOTING…"}
            </p>
          </div>
        ) : null}

        {hud.paused ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#03080d]/84 backdrop-blur-[2px]">
            <div className="border-y border-white/15 px-12 py-7 text-center font-mono">
              <p className="text-lg font-semibold tracking-[0.32em] text-[var(--game-text-strong)]">PAUSED</p>
              <p className="mt-3 text-[0.62rem] tracking-[0.08em] text-[var(--game-muted)]">ESCAPE 또는 RESUME으로 복귀</p>
              <button type="button" onClick={handlePauseToggle} className="mt-5 min-h-9 border border-[var(--game-border-strong)] px-6 text-xs text-[var(--game-accent)] hover:border-[var(--game-accent)]">RESUME</button>
            </div>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex flex-col items-center gap-2 px-4 sm:bottom-5" aria-live="polite" aria-atomic="true">
          {message ? (
            <p className={message.tone === "error" || message.tone === "warning" ? "max-w-[34rem] border-l-2 border-[var(--game-warning)] bg-[#050b10]/88 px-3 py-2 text-center text-[0.64rem] text-[var(--game-warning)] backdrop-blur-sm sm:text-xs" : message.tone === "success" ? "max-w-[34rem] border-l-2 border-[var(--game-success)] bg-[#050b10]/88 px-3 py-2 text-center text-[0.64rem] text-[var(--game-accent)] backdrop-blur-sm sm:text-xs" : "max-w-[34rem] bg-[#050b10]/80 px-3 py-2 text-center text-[0.64rem] text-[var(--game-muted)] backdrop-blur-sm sm:text-xs"}>
              {message.text}
            </p>
          ) : null}
          {hud.interactionPrompt && !hud.paused ? (
            <div className="flex max-w-[min(92vw,36rem)] items-center gap-3 border border-[var(--game-accent)]/70 bg-[#03080d]/96 px-3 py-2.5 font-mono text-[0.68rem] text-[var(--game-text-strong)] shadow-[0_0_28px_rgba(183,216,193,0.2)] backdrop-blur-sm sm:px-4 sm:text-sm">
              <kbd className="inline-flex min-h-8 min-w-8 shrink-0 items-center justify-center border border-[var(--game-accent)] bg-[#14261f] px-2 font-mono text-sm font-bold text-white motion-safe:animate-pulse">
                E
              </kbd>
              <span className="leading-5 tracking-[0.02em]">
                {getInteractionActionLabel(hud.interactionPrompt)}
              </span>
            </div>
          ) : null}
        </div>

        {saveStatus.phase === "failed" ? (
          <button type="button" onClick={handleRetrySave} className="absolute bottom-4 right-4 z-30 border border-[#8b514d] bg-[#251517]/95 px-3 py-2 text-xs text-[var(--game-warning)] hover:border-[#d17e74]">
            저장 다시 시도
          </button>
        ) : null}

        {completed ? (
          <p className="pointer-events-none absolute right-4 top-[4.5rem] z-20 font-mono text-[0.58rem] tracking-[0.16em] text-[var(--game-success)] sm:right-6 sm:top-20">
            STAGE CLEARED // SAVE LOADED
          </p>
        ) : null}
      </div>

      <DocumentStoragePuzzleModal />
      <ScienceLabPuzzleModal />
    </section>
  );
}
