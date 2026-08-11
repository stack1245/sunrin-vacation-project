"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--game-void)]";

export function StartButton() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  async function handleStart() {
    if (isCheckingAuth) {
      return;
    }

    setIsCheckingAuth(true);

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      router.push("/login");
      return;
    }

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user) {
        router.push("/stages");
        return;
      }
    } catch {
      // 인증 서버에 연결할 수 없는 경우에도 플레이를 허용하지 않습니다.
    }

    router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={isCheckingAuth}
      aria-busy={isCheckingAuth}
      className={`group relative inline-flex min-h-14 min-w-52 items-center justify-center overflow-hidden rounded-[3px] border border-[var(--game-accent)] bg-[var(--game-accent)] px-8 py-3 font-mono text-xs font-extrabold tracking-[0.18em] text-[var(--game-void)] shadow-[0_14px_42px_rgba(93,189,139,0.18)] transition-[transform,background-color,box-shadow] duration-200 before:absolute before:inset-y-0 before:-left-1/2 before:w-1/3 before:-skew-x-12 before:bg-white/35 before:opacity-0 before:transition-[left,opacity] before:duration-500 hover:-translate-y-0.5 hover:bg-[#d0e4d6] hover:shadow-[0_18px_48px_rgba(93,189,139,0.25)] hover:before:left-[120%] hover:before:opacity-100 active:translate-y-0 active:scale-[0.99] disabled:translate-y-0 disabled:border-[var(--game-border-strong)] disabled:bg-[var(--game-border-strong)] disabled:text-[var(--game-void)] sm:min-h-[3.75rem] sm:min-w-56 ${focusStyles}`}
    >
      <span>{isCheckingAuth ? "ACCESS CHECK…" : "GAME START"}</span>
      {!isCheckingAuth ? (
        <span className="ml-3 text-base transition-transform group-hover:translate-x-1" aria-hidden="true">
          →
        </span>
      ) : null}
    </button>
  );
}
