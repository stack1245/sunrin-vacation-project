"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const focusStyles =
  "facility-focus";

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
      className={`facility-button-primary mt-9 min-h-13 min-w-48 px-9 py-3 sm:mt-11 sm:min-h-14 sm:min-w-52 ${focusStyles}`}
    >
      <span className="mr-3 text-[0.62rem] opacity-70">01</span>
      {isCheckingAuth ? "ACCESS CHECK" : "INITIATE ESCAPE"}
    </button>
  );
}
