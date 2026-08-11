"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  subscribeToScienceLabPuzzleOpen,
  type OpenScienceLabPuzzleDetail,
} from "@/game/stage-one/puzzles/science-lab";

export function ScienceLabPuzzleModal() {
  const [activeRequest, setActiveRequest] =
    useState<OpenScienceLabPuzzleDetail | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const activeRequestRef = useRef<OpenScienceLabPuzzleDetail | null>(null);

  const finishRequest = useCallback(
    (
      request: OpenScienceLabPuzzleDetail,
      result: Parameters<OpenScienceLabPuzzleDetail["complete"]>[0],
    ) => {
      request.complete(result);
      setActiveRequest((current) => (current === request ? null : current));
      setSelectedValue(null);
      setFeedback(null);
    },
    [],
  );

  const cancelActiveRequest = useCallback(() => {
    const request = activeRequestRef.current;

    if (request) {
      finishRequest(request, { status: "cancelled" });
    }
  }, [finishRequest]);

  useEffect(() => {
    return subscribeToScienceLabPuzzleOpen((request) => {
      setActiveRequest((current) => {
        current?.complete({ status: "cancelled" });
        return request;
      });
      setSelectedValue(null);
      setFeedback(null);
    });
  }, []);

  useEffect(() => {
    activeRequestRef.current = activeRequest;
  }, [activeRequest]);

  useEffect(
    () => () => {
      activeRequestRef.current?.complete({ status: "cancelled" });
    },
    [],
  );

  useEffect(() => {
    if (!activeRequest) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelActiveRequest();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [activeRequest, cancelActiveRequest]);

  if (!activeRequest) {
    return null;
  }

  const { definition } = activeRequest;

  const handleSubmit = () => {
    if (!selectedValue) {
      setFeedback("설정값을 하나 선택하세요.");
      return;
    }

    const result = activeRequest.submit(selectedValue);

    if (result.outcome !== "accepted") {
      setFeedback(result.message);
      return;
    }

    finishRequest(activeRequest, { status: "accepted", result });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#050b10]/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="science-lab-puzzle-title"
    >
      <div className="game-interface w-full max-w-2xl overflow-hidden rounded-[4px] border border-[var(--game-border-strong)] bg-[var(--game-surface)] shadow-2xl shadow-black/60">
        <header className="border-b border-[var(--game-border)] bg-[var(--game-surface-raised)] px-5 py-4 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--game-muted)]">
                SCIENCE LAB SAFETY CONTROL · {definition.order} / 5
              </p>
              <h2
                id="science-lab-puzzle-title"
                className="mt-2 text-xl font-semibold text-[var(--game-text-strong)] sm:text-2xl"
              >
                {definition.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={cancelActiveRequest}
              className="shrink-0 rounded-[3px] border border-[var(--game-border)] bg-[var(--game-void)] px-3 py-2 font-mono text-xs text-[var(--game-muted)] transition-colors hover:border-[var(--game-border-strong)] hover:text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-accent)]"
            >
              닫기 (ESC)
            </button>
          </div>
        </header>

        <div className="space-y-5 px-5 py-6 sm:px-7">
          <div>
            <p className="text-sm leading-6 text-[var(--game-text)]">
              {definition.prompt}
            </p>
            <p className="mt-2 font-mono text-xs leading-5 text-[var(--game-muted)]">
              힌트 · {definition.hint}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup">
            {definition.choices.map((choice, index) => {
              const selected = choice.value === selectedValue;

              return (
                <button
                  key={choice.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  autoFocus={index === 0}
                  onClick={() => {
                    setSelectedValue(choice.value);
                    setFeedback(null);
                  }}
                  className={
                    selected
                      ? "min-h-28 rounded-[3px] border border-[var(--game-accent)] bg-[#14261f] p-4 text-left shadow-lg shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-accent)]"
                      : "min-h-28 rounded-[3px] border border-[var(--game-border)] bg-[var(--game-void)] p-4 text-left transition-colors hover:border-[var(--game-border-strong)] hover:bg-[var(--game-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-accent)]"
                  }
                >
                  <strong className="block font-mono text-lg text-[var(--game-text-strong)]">
                    {choice.label}
                  </strong>
                  <span className="mt-2 block text-xs leading-5 text-[var(--game-muted)]">
                    {choice.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="min-h-6" aria-live="polite" aria-atomic="true">
            {feedback ? (
              <p
                className="rounded-[3px] border border-[#8b514d] bg-[#251517] px-4 py-3 text-sm text-[var(--game-warning)]"
                role="alert"
              >
                {feedback}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--game-border)] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cancelActiveRequest}
              className="inline-flex min-h-11 items-center justify-center rounded-[3px] border border-[var(--game-border)] px-5 text-sm text-[var(--game-muted)] transition-colors hover:border-[var(--game-border-strong)] hover:text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-accent)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex min-h-11 items-center justify-center rounded-[3px] border border-[#8fb49a] bg-[var(--game-accent)] px-6 text-sm font-semibold text-[var(--game-void)] transition-colors hover:bg-[#d0e4d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-accent)]"
            >
              설정 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
