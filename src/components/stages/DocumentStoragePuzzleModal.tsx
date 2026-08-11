"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  markDocumentStoragePuzzleCleared,
  subscribeToDocumentStoragePuzzleOpen,
  type OpenDocumentStoragePuzzleDetail,
} from "@/game/stage-one/puzzles/document-storage/documentStoragePuzzleEvents";

function DocumentStoragePuzzleLoadingFallback() {
  return (
    <p className="font-mono text-sm tracking-[0.12em] text-[var(--game-muted)]">
      <span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-[var(--game-success)]" aria-hidden="true" />
      PUZZLE SYSTEM LOADING…
    </p>
  );
}

const AgoGameHost = dynamic(() => import("./AgoGameHost"), {
  loading: DocumentStoragePuzzleLoadingFallback,
  ssr: false,
});
const MathdokuGameHost = dynamic(() => import("./MathdokuGameHost"), {
  loading: DocumentStoragePuzzleLoadingFallback,
  ssr: false,
});
const NQueensGameHost = dynamic(() => import("./NQueensGameHost"), {
  loading: DocumentStoragePuzzleLoadingFallback,
  ssr: false,
});
const ResourceAllocationGameHost = dynamic(
  () => import("./ResourceAllocationGameHost"),
  {
    loading: DocumentStoragePuzzleLoadingFallback,
    ssr: false,
  },
);
const TtfGameHost = dynamic(() => import("./TtfGameHost"), {
  loading: DocumentStoragePuzzleLoadingFallback,
  ssr: false,
});

export function DocumentStoragePuzzleModal() {
  const [activePuzzle, setActivePuzzle] =
    useState<OpenDocumentStoragePuzzleDetail | null>(null);
  const activePuzzleRef = useRef<OpenDocumentStoragePuzzleDetail | null>(null);

  const closeActivePuzzle = useCallback(() => {
    setActivePuzzle((currentPuzzle) => {
      currentPuzzle?.releaseInputLock();
      return null;
    });
  }, []);

  useEffect(() => {
    return subscribeToDocumentStoragePuzzleOpen((puzzle) => {
      setActivePuzzle((currentPuzzle) => {
        currentPuzzle?.releaseInputLock();
        return puzzle;
      });
    });
  }, []);

  useEffect(() => {
    activePuzzleRef.current = activePuzzle;
  }, [activePuzzle]);

  useEffect(
    () => () => {
      activePuzzleRef.current?.releaseInputLock();
    },
    [],
  );

  useEffect(() => {
    if (!activePuzzle) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeActivePuzzle();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [activePuzzle, closeActivePuzzle]);

  if (!activePuzzle) {
    return null;
  }

  const handlePuzzleComplete = () => {
    markDocumentStoragePuzzleCleared({
      puzzleType: activePuzzle.puzzleType,
    });
    closeActivePuzzle();
  };

  const renderPuzzleHost = () => {
    switch (activePuzzle.puzzleType) {
      case "ago":
        return <AgoGameHost onComplete={handlePuzzleComplete} />;
      case "mathdoku":
        return <MathdokuGameHost onComplete={handlePuzzleComplete} />;
      case "nqueens":
        return <NQueensGameHost onComplete={handlePuzzleComplete} />;
      case "resource":
        return (
          <ResourceAllocationGameHost onComplete={handlePuzzleComplete} />
        );
      case "ttf":
        return <TtfGameHost onComplete={handlePuzzleComplete} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b10]/92 p-3 backdrop-blur-md sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-storage-puzzle-title"
    >
      <div className="game-interface relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col items-center justify-center overflow-hidden rounded-[4px] border border-[var(--game-border-strong)] bg-[var(--game-surface)] p-4 shadow-2xl shadow-black/60 sm:max-h-[90vh] sm:p-6">
        <div className="mb-4 flex w-full flex-col gap-3 border-b border-[var(--game-border)] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-mono text-[0.6rem] font-semibold tracking-widest text-[var(--game-muted)] sm:text-xs">
              DOCUMENT STORAGE SECURITY TERMINAL
            </span>
            <h2
              id="document-storage-puzzle-title"
              className="text-xl font-bold text-[var(--game-text-strong)]"
            >
              {activePuzzle.title}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {process.env.NODE_ENV === "development" ? (
              <button
                type="button"
                onClick={handlePuzzleComplete}
                className="facility-focus min-h-9 rounded-[3px] border border-[#315447] bg-[#14261f] px-3 py-1.5 text-xs font-semibold text-[var(--game-accent)] transition-colors hover:border-[var(--game-success)]"
              >
                개발용 퍼즐 해제
              </button>
            ) : null}
            <button
              type="button"
              onClick={closeActivePuzzle}
              className="facility-focus min-h-9 rounded-[3px] border border-[var(--game-border)] bg-[var(--game-void)] px-3 py-1.5 text-xs font-semibold text-[var(--game-muted)] transition-colors hover:border-[var(--game-border-strong)] hover:text-[var(--game-text)]"
            >
              닫기 (ESC)
            </button>
          </div>
        </div>

        <div className="flex w-full min-h-0 flex-1 items-center justify-center overflow-auto py-2">
          {renderPuzzleHost()}
        </div>
      </div>
    </div>
  );
}
