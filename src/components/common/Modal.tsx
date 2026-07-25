"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ isOpen, title, children, onClose }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/75 p-5 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="w-full max-w-lg border border-white/15 bg-zinc-950 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2
            id="modal-title"
            className="text-lg font-bold tracking-wide text-white"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center border border-white/10 text-zinc-400 transition hover:border-cyan-300/40 hover:text-white"
            aria-label="모달 닫기"
          >
            ×
          </button>
        </div>
        <div className="text-sm leading-7 text-zinc-300">{children}</div>
      </section>
    </div>
  );
}
