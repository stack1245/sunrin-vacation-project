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

const GAME_MESSAGE_BASE_CLASS_NAME =
  "max-w-[min(92vw,50rem)] border border-[var(--game-border-strong)] bg-[#03080d]/96 px-5 py-3 text-center font-sans text-base font-semibold leading-7 shadow-[0_14px_42px_rgba(0,0,0,0.5)] backdrop-blur-md sm:px-7 sm:py-3.5 sm:text-lg";

const GAME_MESSAGE_TONE_CLASS_NAMES: Record<
  StageOneGameMessage["tone"],
  string
> = {
  error: "border-l-4 border-l-[var(--game-warning)] text-[var(--game-warning)]",
  warning:
    "border-l-4 border-l-[var(--game-warning)] text-[var(--game-warning)]",
  success:
    "border-l-4 border-l-[var(--game-success)] text-[var(--game-accent)]",
  info: "border-l-4 border-l-[var(--game-border-strong)] text-[var(--game-text)]",
};

function getGameMessageClassName(tone: StageOneGameMessage["tone"]): string {
  return `${GAME_MESSAGE_BASE_CLASS_NAME} ${GAME_MESSAGE_TONE_CLASS_NAMES[tone]}`;
}

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
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 grid h-16 grid-cols-[minmax(0,1fr)_auto] border-b border-[var(--game-border)] bg-[#03080d]/94 px-3 font-mono shadow-[0_10px_32px_rgba(0,0,0,0.25)] backdrop-blur-md sm:grid-cols-[1.45fr_repeat(3,1fr)_auto] sm:px-5">
          <div className="flex min-w-0 items-center border-r border-white/10 pr-3">
            <p className="truncate text-[0.62rem] font-semibold tracking-[0.16em] text-[var(--game-text-strong)] sm:text-xs">
              OUTOFBOUNDS <span className="text-[var(--game-muted)]">{"//"} STAGE {String(stageOrder).padStart(2, "0")}</span>
            </p>
          </div>
          <div className="hidden items-center border-r border-white/10 px-4 sm:flex">
            <p><span className="block text-[0.55rem] font-semibold tracking-[0.16em] text-[var(--game-muted)]">TIME</span><strong className="mt-0.5 block text-sm font-medium tabular-nums text-[var(--game-text)]">{formatClearTime(hud.elapsedTimeMs)}</strong></p>
          </div>
          <div className="hidden min-w-0 items-center border-r border-white/10 px-4 sm:flex">
            <p className="min-w-0"><span className="block text-[0.55rem] font-semibold tracking-[0.16em] text-[var(--game-muted)]">SECTOR</span><strong className="mt-0.5 block truncate font-sans text-sm font-semibold text-[var(--game-text)]">{hud.roomName}</strong></p>
          </div>
          <div className="hidden items-center border-r border-white/10 px-4 sm:flex">
            <p><span className="block text-[0.55rem] font-semibold tracking-[0.16em] text-[var(--game-muted)]">PROGRESS</span><strong className="mt-0.5 block text-sm font-medium text-[var(--game-accent)]">{String(completedFlags).padStart(2, "0")} / 08</strong></p>
          </div>
          <div className="pointer-events-auto flex items-center gap-1.5 pl-2 sm:gap-2 sm:pl-3">
            <span
              className={saveStatus.phase === "failed" ? "mr-0.5 text-[0.62rem] font-semibold text-[var(--game-warning)] sm:mr-1 sm:text-[0.68rem]" : "mr-0.5 text-[0.62rem] font-semibold text-[var(--game-success)] sm:mr-1 sm:text-[0.68rem]"}
              title={saveStatus.message}
            >
              <span className="mr-1 hidden size-1.5 rounded-full bg-current sm:inline-block" aria-hidden="true" />
              {getSaveStatusLabel(saveStatus)}
            </span>
            <button
              type="button"
              onClick={handlePauseToggle}
              disabled={bootStatus !== "ready"}
              className="facility-focus min-h-10 rounded-[2px] border border-[var(--game-border)] px-2.5 text-[0.62rem] font-semibold tracking-[0.1em] text-[var(--game-text)] transition-colors hover:border-[var(--game-accent)] hover:bg-white/[0.04] disabled:opacity-40 sm:px-3 sm:text-[0.68rem]"
            >
              {hud.paused ? "RESUME" : "PAUSE"}
            </button>
            <Link
              href="/stages"
              className="facility-focus inline-flex min-h-10 items-center rounded-[2px] border border-[var(--game-border)] px-2.5 text-[0.62rem] font-semibold tracking-[0.1em] text-[var(--game-muted)] transition-colors hover:border-[var(--game-border-strong)] hover:bg-white/[0.04] hover:text-[var(--game-text)] sm:px-3 sm:text-[0.68rem]"
            >
              EXIT
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-3 top-20 z-20 flex flex-col items-stretch gap-2 sm:inset-x-6 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
          <div className="max-w-xl border-l-2 border-[var(--game-accent)] bg-[#03080d]/78 px-3.5 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:px-4 sm:py-3.5">
            <p className="font-mono text-[0.58rem] font-bold tracking-[0.2em] text-[var(--game-accent)] sm:text-[0.62rem]">CURRENT OBJECTIVE</p>
            <p className="mt-1.5 text-[0.82rem] font-semibold leading-6 text-[var(--game-text-strong)] sm:text-[0.95rem]">{hud.objective}</p>

            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/10 pt-2.5 font-mono text-[0.62rem] text-[var(--game-muted)] sm:hidden">
              <span>{hud.roomName}</span>
              <span className="text-[var(--game-accent)]">{String(completedFlags).padStart(2, "0")} / 08</span>
              <span className="tabular-nums">{formatClearTime(hud.elapsedTimeMs)}</span>
            </div>

            <p className="game-device-notice mt-2.5 items-center gap-1.5 border-t border-white/10 pt-2.5 text-xs font-semibold text-[var(--game-warning)]">
              가로 화면과 키보드 플레이를 권장합니다.
            </p>

            <div className="mt-3.5 hidden grid-cols-2 gap-x-5 border-t border-white/10 pt-3 font-mono text-[0.6rem] leading-5 text-[var(--game-muted)] sm:grid">
              <p>A / D · MOVE</p>
              <p>W / SPACE · JUMP</p>
              <p>S · CROUCH · SHIFT · RUN</p>
              <p>E · INTERACT · ESC · PAUSE</p>
            </div>
          </div>

          {completed ? (
            <p className="self-end rounded-[2px] border border-[#315447] bg-[var(--game-success-surface)] px-3 py-2 font-mono text-[0.58rem] font-bold tracking-[0.14em] text-[var(--game-success)] shadow-lg sm:self-start sm:text-[0.64rem]">
              <span className="sm:hidden">CLEARED</span>
              <span className="hidden sm:inline">STAGE CLEARED // SAVE LOADED</span>
            </p>
          ) : null}
        </div>

        {bootStatus !== "ready" ? (
          <div className="game-grid-surface absolute inset-0 z-40 flex items-center justify-center px-6 text-center">
            <p role={bootStatus === "error" ? "alert" : undefined} className={bootStatus === "error" ? "text-sm leading-6 text-[var(--game-warning)]" : "font-mono text-sm tracking-[0.12em] text-[var(--game-muted)]"}>
              {bootStatus === "error" ? "게임 화면을 불러오지 못했습니다." : "PHASER SYSTEM BOOTING…"}
            </p>
          </div>
        ) : null}

        {hud.paused ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#03080d]/88 px-5 backdrop-blur-sm">
            <div className="facility-panel-raised w-full max-w-sm p-7 text-center sm:p-9">
              <p className="font-mono text-xl font-semibold tracking-[0.28em] text-[var(--game-text-strong)]">PAUSED</p>
              <p className="mt-3 text-sm font-medium leading-6 text-[var(--game-muted)]">ESC 키 또는 아래 버튼으로 게임에 복귀합니다.</p>
              <button type="button" onClick={handlePauseToggle} className="facility-button-primary facility-focus mt-6 min-w-36 px-6">RESUME</button>
            </div>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex flex-col items-center px-4 sm:bottom-8" aria-live="polite" aria-atomic="true">
          {message ? (
            <p className={getGameMessageClassName(message.tone)}>
              {message.text}
            </p>
          ) : null}
          {hud.interactionPrompt && !hud.paused ? (
            <p className="sr-only">
              상호작용 가능: {getInteractionActionLabel(hud.interactionPrompt)}
            </p>
          ) : null}
        </div>

        {saveStatus.phase === "failed" ? (
          <button type="button" onClick={handleRetrySave} className="facility-button-danger facility-focus absolute bottom-4 right-4 z-30 px-4">
            저장 다시 시도
          </button>
        ) : null}
      </div>

      <DocumentStoragePuzzleModal />
      <ScienceLabPuzzleModal />
    </section>
  );
}
