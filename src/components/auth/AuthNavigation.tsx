"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

const FOCUS_VISIBLE_CLASS_NAMES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-4 focus-visible:ring-offset-[#030708]";

function getUserDisplayName(user: User | null): string | null {
  if (!user) {
    return null;
  }

  const metadataNickname = user.user_metadata.nickname;

  if (typeof metadataNickname === "string" && metadataNickname.trim()) {
    return metadataNickname.trim();
  }

  return user.email?.split("@")[0]?.trim() || "플레이어";
}

export function AuthNavigation() {
  const configured = isSupabaseConfigured();
  const [displayName, setDisplayName] = useState<string | null>(null);
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
    let authChangeTimer: ReturnType<typeof setTimeout> | null = null;

    function applyAuthenticatedUser(user: User | null) {
      if (!isMounted) {
        return;
      }

      setDisplayName(getUserDisplayName(user));
      setIsLoading(false);
    }

    void client.auth
      .getUser()
      .then(({ data }) => applyAuthenticatedUser(data.user))
      .catch(() => applyAuthenticatedUser(null));

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
        applyAuthenticatedUser(session?.user ?? null);
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

    setDisplayName(null);
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

  if (displayName) {
    return (
      <nav aria-label="회원 메뉴" className="ml-4">
        <div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-sm">
          <span
            className="max-w-24 truncate text-stone-400 sm:max-w-52"
            title={displayName}
          >
            {displayName}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={`rounded-sm px-1 py-2 font-medium text-stone-200 transition-colors duration-200 hover:text-white disabled:cursor-wait disabled:text-stone-500 ${FOCUS_VISIBLE_CLASS_NAMES}`}
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
            className={`rounded-sm px-1 py-2 transition-colors duration-200 hover:text-white ${FOCUS_VISIBLE_CLASS_NAMES}`}
          >
            로그인
          </Link>
        </li>
        <li>
          <Link
            href="/signup"
            className={`rounded-sm px-1 py-2 transition-colors duration-200 hover:text-white ${FOCUS_VISIBLE_CLASS_NAMES}`}
          >
            회원가입
          </Link>
        </li>
      </ul>
    </nav>
  );
}
