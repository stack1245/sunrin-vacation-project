"use client";

import { useRouter } from "next/navigation";
import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
} from "react";

interface AuthDialogProps {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}

export function AuthDialog({
  children,
  description,
  eyebrow,
  title,
}: AuthDialogProps) {
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();

  const closeDialog = useCallback(() => {
    router.replace("/");
  }, [router]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDialog();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDialog]);

  function handleBackdropClick(event: MouseEvent<HTMLElement>) {
    if (event.target === event.currentTarget) {
      closeDialog();
    }
  }

  return (
    <main
      id="main-content"
      className="relative z-10 flex min-h-[calc(100dvh_-_var(--site-header-height))] items-center justify-center px-4 py-8 sm:px-6 sm:py-12"
      onClick={handleBackdropClick}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="facility-panel-raised relative w-full max-w-[30rem] overflow-hidden p-6 backdrop-blur-xl sm:p-9"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--game-accent-soft)] to-transparent"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={closeDialog}
          aria-label={`${title} 창 닫기`}
          className="facility-focus absolute right-4 top-4 z-10 inline-flex size-10 items-center justify-center rounded-[3px] border border-transparent text-xl leading-none text-[var(--game-muted)] transition-colors duration-200 hover:border-[var(--game-border)] hover:bg-white/[0.05] hover:text-[var(--game-text-strong)] sm:right-5 sm:top-5"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="relative">
          <p className="facility-kicker pr-10 text-[var(--game-accent)]">
            {eyebrow}
          </p>
        <h1
          id={titleId}
            className="mt-3 pr-10 text-3xl font-semibold tracking-[-0.04em] text-[var(--game-text-strong)] sm:text-4xl"
        >
          {title}
        </h1>
        <p
          id={descriptionId}
            className="mt-3 text-sm leading-6 text-[var(--game-muted)]"
        >
          {description}
        </p>

          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
