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
      className="relative z-10 flex min-h-[calc(100dvh-4.5rem)] items-center justify-center px-4 py-10 sm:min-h-[calc(100dvh-5rem)] sm:px-6 sm:py-14"
      onClick={handleBackdropClick}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="facility-panel-raised relative w-full max-w-md p-6 sm:p-9"
      >
        <button
          type="button"
          onClick={closeDialog}
          aria-label={`${title} 창 닫기`}
          className="facility-focus absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-[3px] border border-transparent font-mono text-xl leading-none text-[var(--game-muted)] transition-colors duration-200 hover:border-[#8b514d] hover:bg-[var(--game-danger-surface)] hover:text-[var(--game-warning)] sm:right-5 sm:top-5"
        >
          <span aria-hidden="true">×</span>
        </button>

        <p className="facility-kicker pr-10 text-[var(--game-accent)]">
          {eyebrow}
        </p>
        <h1
          id={titleId}
          className="mt-3 pr-10 text-3xl font-semibold tracking-[-0.035em] text-[var(--game-text-strong)] sm:text-4xl"
        >
          {title}
        </h1>
        <p
          id={descriptionId}
          className="mt-3 text-sm leading-6 text-[var(--game-muted)]"
        >
          {description}
        </p>

        <div className="mt-8 border-t border-[var(--game-border)] pt-7">{children}</div>
      </section>
    </main>
  );
}
