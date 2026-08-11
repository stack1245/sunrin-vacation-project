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
import type { StageOneGameHandle } from "@/game/stage-one/core/createStageOneGame";
import type {
  StageOneProgressBridge,
  StageOneProgressResult,
} from "@/types/stage-one";
import { STAGE_ONE_ROOM_DISPLAY_NAMES } from "@/types/stage-one";
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
): StageOneHudState {
  const { state, elapsedTimeMs } = initialProgress;

  return {
    roomId: state.currentRoom,
    roomName: STAGE_ONE_ROOM_DISPLAY_NAMES[state.currentRoom],
    objective: "Stage 1 게임 시스템을 준비하고 있습니다.",
    elapsedTimeMs,
    paused: false,
    interactionPrompt: null,
    state,
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
  bridge,
}: StageOneGameHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameHandleRef = useRef<StageOneGameHandle | null>(null);
  const [bootStatus, setBootStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [hud, setHud] = useState<StageOneHudState>(() =>
    createInitialHud(initialProgress),
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
  }, [bridge, initialProgress]);

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
      className="game-interface mx-auto w-full max-w-6xl"
      aria-labelledby="stage-one-title"
    >
      <div className="mb-4 flex flex-col gap-4 rounded-[3px] border border-[var(--game-border)] bg-[var(--game-surface)] p-5 shadow-2xl shadow-black/25 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--game-accent)]">
            OUTOFBOUNDS // STAGE {String(stageOrder).padStart(2, "0")}
          </p>
          <h1
            id="stage-one-title"
            className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--game-text-strong)] sm:text-3xl"
          >
            {title}
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-5 font-mono text-left text-xs sm:text-right">
          <div>
            <span className="block text-[0.6rem] tracking-[0.12em] text-[var(--game-muted)]">LOCATION</span>
            <strong className="mt-1 block font-medium text-[var(--game-text)]">
              {hud.roomName}
            </strong>
          </div>
          <div>
            <span className="block text-[0.6rem] tracking-[0.12em] text-[var(--game-muted)]">ELAPSED</span>
            <strong className="mt-1 block font-medium tabular-nums text-[var(--game-text)]">
              {formatClearTime(hud.elapsedTimeMs)}
            </strong>
          </div>
          <div>
            <span className="block text-[0.6rem] tracking-[0.12em] text-[var(--game-muted)]">PROGRESS</span>
            <strong className="mt-1 block font-medium text-[var(--game-accent)]">
              {completedFlags} / 8
            </strong>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="overflow-hidden rounded-[4px] border border-[var(--game-border-strong)] bg-[var(--game-void)] shadow-2xl shadow-black/50">
          <div
            ref={containerRef}
            className="game-grid-surface relative aspect-video w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-accent)]"
            tabIndex={0}
            role="application"
            aria-label="OutOfBounds Stage 1 게임 화면"
            onPointerDown={(event) => event.currentTarget.focus()}
          >
            {bootStatus !== "ready" ? (
              <div className="game-grid-surface absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
                <p
                  role={bootStatus === "error" ? "alert" : undefined}
                  className={
                    bootStatus === "error"
                      ? "text-sm leading-6 text-[var(--game-warning)]"
                      : "font-mono text-sm tracking-[0.12em] text-[var(--game-muted)]"
                  }
                >
                  {bootStatus === "error"
                    ? "게임 화면을 불러오지 못했습니다."
                    : "PHASER 시스템을 준비하고 있습니다…"}
                </p>
              </div>
            ) : null}

            {hud.paused ? (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#050b10]/80 backdrop-blur-[2px]">
                <div className="rounded-[3px] border border-[var(--game-border-strong)] bg-[var(--game-surface)] px-8 py-6 text-center shadow-2xl shadow-black/40">
                  <p className="font-mono text-xs font-semibold tracking-[0.28em] text-[var(--game-warning)]">
                    PAUSED
                  </p>
                  <p className="mt-3 text-sm text-[var(--game-text)]">
                    Escape 또는 계속하기 버튼으로 돌아갑니다.
                  </p>
                </div>
              </div>
            ) : null}

            {hud.interactionPrompt && !hud.paused ? (
              <p className="pointer-events-none absolute bottom-5 left-1/2 z-20 w-[min(90%,32rem)] -translate-x-1/2 rounded-[3px] border border-[var(--game-border-strong)] bg-[#050b10]/95 px-4 py-3 text-center font-mono text-sm text-[var(--game-accent)] shadow-lg">
                {hud.interactionPrompt}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col gap-4 rounded-[3px] border border-[var(--game-border)] bg-[var(--game-surface)] p-5 shadow-2xl shadow-black/25">
          <div>
            <p className="font-mono text-[0.65rem] font-semibold tracking-[0.22em] text-[var(--game-muted)]">
              CURRENT OBJECTIVE
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--game-text)]">{hud.objective}</p>
          </div>

          <div className="border-t border-[var(--game-border)] pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-[var(--game-muted)]">SAVE STATUS</span>
              <strong
                className={
                  saveStatus.phase === "failed"
                    ? "text-xs font-medium text-[var(--game-warning)]"
                    : saveStatus.phase === "retrying"
                      ? "text-xs font-medium text-[var(--game-warning)]"
                      : "text-xs font-medium text-[var(--game-success)]"
                }
              >
                {getSaveStatusLabel(saveStatus)}
              </strong>
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--game-muted)]">
              {saveStatus.message}
            </p>
          </div>

          <div className="border-t border-[var(--game-border)] pt-4 font-mono text-xs leading-5 text-[var(--game-muted)]">
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
              className="inline-flex min-h-11 items-center justify-center rounded-[3px] border border-[var(--game-border-strong)] bg-[var(--game-surface-raised)] px-4 text-sm font-medium text-[var(--game-text)] transition-colors hover:border-[var(--game-accent)] hover:text-[var(--game-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-accent)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {hud.paused ? "계속하기" : "일시정지"}
            </button>
            {saveStatus.phase === "failed" ? (
              <button
                type="button"
                onClick={handleRetrySave}
                className="inline-flex min-h-11 items-center justify-center rounded-[3px] border border-[#8b514d] bg-[#251517] px-4 text-sm font-medium text-[var(--game-warning)] transition-colors hover:border-[#d17e74] hover:bg-[#321b1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-warning)]"
              >
                저장 다시 시도
              </button>
            ) : null}
            <Link
              href="/stages"
              className="inline-flex min-h-11 items-center justify-center rounded-[3px] border border-[var(--game-border)] px-4 text-sm text-[var(--game-muted)] transition-colors hover:border-[var(--game-border-strong)] hover:text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-accent)]"
            >
              Stage 나가기
            </Link>
          </div>
        </aside>
      </div>

      <div className="mt-4 min-h-12" aria-live="polite" aria-atomic="true">
        {message ? (
          <p
            className={
              message.tone === "error"
                ? "rounded-[3px] border border-[#8b514d] bg-[#251517] px-4 py-3 text-sm text-[var(--game-warning)]"
                : message.tone === "warning"
                  ? "rounded-[3px] border border-[#8b514d] bg-[#251517] px-4 py-3 text-sm text-[var(--game-warning)]"
                  : message.tone === "success"
                    ? "rounded-[3px] border border-[#315447] bg-[#0c211a] px-4 py-3 text-sm text-[var(--game-accent)]"
                    : "rounded-[3px] border border-[var(--game-border)] bg-[var(--game-surface)] px-4 py-3 text-sm text-[var(--game-text)]"
            }
          >
            {message.text}
          </p>
        ) : null}
      </div>

      {completed ? (
        <p className="mt-2 text-center text-sm font-medium text-[var(--game-success)]">
          Stage 1 클리어 상태입니다. 기존 저장을 유지한 채 다시 입장했습니다.
        </p>
      ) : null}

      <DocumentStoragePuzzleModal />
      <ScienceLabPuzzleModal />
    </section>
  );
}
