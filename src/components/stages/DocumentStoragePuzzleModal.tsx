"use client";

import { useEffect, useState } from "react";
import AgoGameHost from "./AgoGameHost";
import MathdokuGameHost from "./MathdokuGameHost";
import NQueensGameHost from "./NQueensGameHost";
import ResourceGameHost from "./ResourceGameHost";
import TtfGameHost from "./TtfGameHost";
import type { OpenPuzzleEventDetail } from "@/game/stage-one/rooms/documentStorageRoomModule";

export function DocumentStoragePuzzleModal() {
  const [activePuzzle, setActivePuzzle] = useState<OpenPuzzleEventDetail | null>(null);

  useEffect(() => {
    const handleOpen = (evt: Event) => {
      const customEvt = evt as CustomEvent<OpenPuzzleEventDetail>;
      if (customEvt.detail) {
        setActivePuzzle(customEvt.detail);
      }
    };

    window.addEventListener("open-document-puzzle", handleOpen);
    return () => {
      window.removeEventListener("open-document-puzzle", handleOpen);
    };
  }, []);

  if (!activePuzzle) return null;

  const handleClose = () => {
    setActivePuzzle(null);
  };

  const handlePuzzleComplete = () => {
    if (activePuzzle) {
      const event = new CustomEvent("puzzle-cleared-event", {
        detail: { puzzleType: activePuzzle.puzzleType },
      });
      window.dispatchEvent(event);
    }
    handleClose();
  };

  const renderPuzzleHost = () => {
    switch (activePuzzle.puzzleType) {
      case "ago":
        return <AgoGameHost />;
      case "mathdoku":
        return <MathdokuGameHost />;
      case "nqueens":
        return <NQueensGameHost />;
      case "resource":
        return <ResourceGameHost />;
      case "ttf":
        return <TtfGameHost />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col items-center justify-center overflow-hidden rounded-xl border border-violet-500/40 bg-[#0f172a] p-6 shadow-2xl">
        {/* 모달 헤더 */}
        <div className="mb-4 flex w-full items-center justify-between border-b border-slate-700/60 pb-3">
          <div>
            <span className="text-xs font-semibold tracking-widest text-indigo-400">
              DOCUMENT STORAGE SECURITY TERMINAL
            </span>
            <h2 className="text-xl font-bold text-slate-100">{activePuzzle.title}</h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePuzzleComplete}
              className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              퍼즐 완료 (해제)
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-600 transition-colors"
            >
              닫기 (ESC)
            </button>
          </div>
        </div>

        {/* 퍼즐 게임 호스트 컨테이너 */}
        <div className="flex w-full items-center justify-center overflow-auto py-2">
          {renderPuzzleHost()}
        </div>
      </div>
    </div>
  );
}
