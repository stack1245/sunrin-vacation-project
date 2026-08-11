"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  markDocumentStoragePuzzleCleared,
  subscribeToDocumentStoragePuzzleOpen,
  type OpenDocumentStoragePuzzleDetail,
} from "@/game/stage-one/puzzles/document-storage";
import AgoGameHost from "./AgoGameHost";
import MathdokuGameHost from "./MathdokuGameHost";
import NQueensGameHost from "./NQueensGameHost";
import ResourceAllocationGameHost from "./ResourceAllocationGameHost";
import TtfGameHost from "./TtfGameHost";

interface DocumentStoragePuzzleModalProps {
  onClose(): void;
  onOpen(): void;
}

export function DocumentStoragePuzzleModal({
  onClose,
  onOpen,
}: DocumentStoragePuzzleModalProps) {
  const [activePuzzle, setActivePuzzle] =
    useState<OpenDocumentStoragePuzzleDetail | null>(null);
  const activePuzzleRef = useRef<OpenDocumentStoragePuzzleDetail | null>(null);

  const closeActivePuzzle = useCallback(() => {
    setActivePuzzle(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    return subscribeToDocumentStoragePuzzleOpen((puzzle) => {
      setActivePuzzle(puzzle);
      onOpen();
    });
  }, [onOpen]);

  useEffect(() => {
    activePuzzleRef.current = activePuzzle;
  }, [activePuzzle]);

  useEffect(
    () => () => {
      if (activePuzzleRef.current) {
        onClose();
      }
    },
    [onClose],
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-storage-puzzle-title"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col items-center justify-center overflow-hidden rounded-xl border border-violet-500/40 bg-[#0f172a] p-6 shadow-2xl">
        <div className="mb-4 flex w-full items-center justify-between border-b border-slate-700/60 pb-3">
          <div>
            <span className="text-xs font-semibold tracking-widest text-indigo-400">
              DOCUMENT STORAGE SECURITY TERMINAL
            </span>
            <h2
              id="document-storage-puzzle-title"
              className="text-xl font-bold text-slate-100"
            >
              {activePuzzle.title}
            </h2>
          </div>
          <div className="flex gap-2">
            {process.env.NODE_ENV === "development" ? (
              <button
                type="button"
                onClick={handlePuzzleComplete}
                className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                개발용 퍼즐 해제
              </button>
            ) : null}
            <button
              type="button"
              onClick={closeActivePuzzle}
              className="rounded bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-600"
            >
              닫기 (ESC)
            </button>
          </div>
        </div>

        <div className="flex w-full items-center justify-center overflow-auto py-2">
          {renderPuzzleHost()}
        </div>
      </div>
    </div>
  );
}
