"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-4 focus-visible:ring-offset-[#030708]";

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
      className={`mt-9 inline-flex min-h-13 min-w-40 items-center justify-center rounded-md border border-white/65 bg-black/25 px-9 py-3 text-sm font-semibold tracking-[0.24em] text-white backdrop-blur-[2px] transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white/12 active:translate-y-0 active:scale-[0.98] disabled:cursor-wait disabled:translate-y-0 disabled:border-white/35 disabled:text-stone-400 sm:mt-11 sm:min-h-14 sm:min-w-44 ${focusStyles}`}
    >
      {isCheckingAuth ? "확인 중..." : "START"}
    </button>
  );
}
