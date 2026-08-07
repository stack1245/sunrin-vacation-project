"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-4 focus-visible:ring-offset-[#030708]";

export function AuthNavigation() {
  const configured = isSupabaseConfigured();
  const [nickname, setNickname] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(configured);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const client = supabase;
    let isMounted = true;
    let profileRequestId = 0;
    let authChangeTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadProfile(
      user: { id: string; email?: string | null } | null,
    ) {
      const requestId = ++profileRequestId;

      if (!user) {
        if (isMounted && requestId === profileRequestId) {
          setNickname(null);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
      }

      const fallbackNickname =
        user.email?.split("@")[0]?.trim() || "플레이어";

      await client.rpc("ensure_user_setup");

      const { data } = await client
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();

      if (!isMounted || requestId !== profileRequestId) {
        return;
      }

      setNickname(data?.nickname ?? fallbackNickname);
      setIsLoading(false);
    }

    void client.auth.getUser().then(({ data }) => {
      void loadProfile(data.user);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      if (authChangeTimer) {
        clearTimeout(authChangeTimer);
      }

      authChangeTimer = setTimeout(() => {
        void loadProfile(session?.user ?? null);
      }, 0);
    });

    return () => {
      isMounted = false;
      if (authChangeTimer) {
        clearTimeout(authChangeTimer);
      }
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase || isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setStatusMessage("");

    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      setStatusMessage("로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setIsSigningOut(false);
      return;
    }

    setNickname(null);
    setIsSigningOut(false);
  }

  if (isLoading) {
    return (
      <div
        className="ml-4 flex min-w-20 justify-end text-xs text-stone-500 sm:min-w-36 sm:text-sm"
        aria-label="회원 정보를 불러오는 중"
      >
        ···
      </div>
    );
  }

  if (nickname) {
    return (
      <nav aria-label="회원 메뉴" className="ml-4">
        <div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-sm">
          <span
            className="max-w-24 truncate text-stone-400 sm:max-w-52"
            title={nickname}
          >
            {nickname}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={`rounded-sm px-1 py-2 font-medium text-stone-200 transition-colors duration-200 hover:text-white disabled:cursor-wait disabled:text-stone-500 ${focusStyles}`}
          >
            {isSigningOut ? "처리 중" : "로그아웃"}
          </button>
          <span className="sr-only" aria-live="polite">
            {statusMessage}
          </span>
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="회원 메뉴" className="ml-4">
      <ul className="flex items-center gap-3 text-xs font-medium text-stone-300 sm:gap-6 sm:text-sm">
        <li>
          <Link
            href="/login"
            className={`rounded-sm px-1 py-2 transition-colors duration-200 hover:text-white ${focusStyles}`}
          >
            로그인
          </Link>
        </li>
        <li>
          <Link
            href="/signup"
            className={`rounded-sm px-1 py-2 transition-colors duration-200 hover:text-white ${focusStyles}`}
          >
            회원가입
          </Link>
        </li>
      </ul>
    </nav>
  );
}
