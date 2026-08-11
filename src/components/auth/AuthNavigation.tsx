"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  PROFILE_UPDATED_EVENT,
  type ProfileUpdatedEventDetail,
} from "@/lib/account/profileEvents";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--game-void)]";

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="size-[1.1rem]"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.75 19c.7-3.2 2.85-4.8 6.25-4.8s5.55 1.6 6.25 4.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AuthNavigation() {
  const configured = isSupabaseConfigured();
  const [nickname, setNickname] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(configured);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

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

      await client.rpc("ensure_my_profile");

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

    function handleProfileUpdated(event: Event) {
      const detail = (event as CustomEvent<ProfileUpdatedEventDetail>).detail;

      if (isMounted && typeof detail?.nickname === "string") {
        setNickname(detail.nickname);
      }
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);

    return () => {
      isMounted = false;
      if (authChangeTimer) {
        clearTimeout(authChangeTimer);
      }
      subscription.unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

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

    setIsMenuOpen(false);
    setNickname(null);
    setIsSigningOut(false);
  }

  if (isLoading) {
    return (
      <div
        className="ml-auto flex min-w-20 justify-end"
        aria-label="회원 정보를 불러오는 중"
      >
        <span className="facility-skeleton h-10 w-24 rounded-[3px] border border-[var(--game-border)] sm:w-[14.5rem]" />
      </div>
    );
  }

  if (nickname) {
    return (
      <nav
        ref={menuRef}
        aria-label="회원 메뉴"
        className="relative ml-auto min-w-0"
      >
        <div className="hidden h-10 items-stretch overflow-hidden rounded-[3px] border border-[var(--game-border)] bg-black/25 text-xs sm:flex">
          <span
            className="flex max-w-32 items-center truncate border-r border-[var(--game-border)] px-3 font-medium text-[var(--game-muted)] lg:max-w-52 lg:px-4"
            title={nickname}
          >
            {nickname}
          </span>
          <Link
            href="/account"
            className={`flex min-w-[5rem] items-center justify-center border-r border-[var(--game-border)] px-3 font-medium text-[var(--game-muted)] transition-colors duration-200 hover:bg-white/[0.06] hover:text-[var(--game-text-strong)] lg:min-w-[5.5rem] ${focusStyles}`}
          >
            회원정보
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={`flex min-w-[4.75rem] items-center justify-center px-3 font-medium text-[var(--game-muted)] transition-colors duration-200 hover:bg-white/[0.06] hover:text-[var(--game-text-strong)] disabled:text-[var(--game-border-strong)] lg:min-w-[5.25rem] ${focusStyles}`}
          >
            {isSigningOut ? "처리 중" : "로그아웃"}
          </button>
        </div>

        <button
          type="button"
          className={`inline-flex min-h-10 items-center gap-2 rounded-[3px] border border-[var(--game-border)] bg-black/30 px-3 text-xs font-semibold text-[var(--game-text)] sm:hidden ${focusStyles}`}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-account-menu"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <UserIcon />
          계정
          <ChevronIcon open={isMenuOpen} />
        </button>

        {isMenuOpen ? (
          <div
            id="mobile-account-menu"
            className="absolute right-0 top-full z-50 mt-2.5 w-56 overflow-hidden rounded-[4px] border border-[var(--game-border-strong)] bg-[var(--game-surface)] p-2 shadow-2xl shadow-black/60 sm:hidden"
          >
            <p className="truncate border-b border-[var(--game-border)] px-3 py-3 font-mono text-xs text-[var(--game-muted)]">
              {nickname}
            </p>
            <Link
              href="/account"
              onClick={() => setIsMenuOpen(false)}
              className={`mt-1 flex min-h-11 items-center rounded-[3px] px-3 text-sm font-medium text-[var(--game-text)] hover:bg-white/[0.06] ${focusStyles}`}
            >
              회원정보 관리
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`flex min-h-11 w-full items-center rounded-[3px] px-3 text-left text-sm font-medium text-[var(--game-muted)] hover:bg-white/[0.06] hover:text-[var(--game-text)] ${focusStyles}`}
            >
              {isSigningOut ? "로그아웃 중…" : "로그아웃"}
            </button>
            {statusMessage ? (
              <p role="alert" className="px-3 pb-2 pt-1 text-xs leading-5 text-[var(--game-warning)]">
                {statusMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        <span className="sr-only" aria-live="polite">
          {statusMessage}
        </span>
      </nav>
    );
  }

  return (
    <nav aria-label="회원 메뉴" className="ml-auto">
      <ul className="flex items-center gap-1 text-xs font-semibold sm:gap-2 sm:text-[0.82rem]">
        <li>
          <Link
            href="/login"
            className={`inline-flex min-h-10 items-center rounded-[3px] px-2.5 text-[var(--game-muted)] transition-colors duration-200 hover:bg-white/[0.06] hover:text-[var(--game-text-strong)] sm:px-3 ${focusStyles}`}
          >
            로그인
          </Link>
        </li>
        <li>
          <Link
            href="/signup"
            className={`inline-flex min-h-10 items-center rounded-[3px] border border-[var(--game-border-strong)] bg-[var(--game-accent-soft)] px-2.5 text-[var(--game-text-strong)] transition-colors duration-200 hover:border-[var(--game-accent)] hover:bg-white/[0.09] sm:px-3 ${focusStyles}`}
          >
            회원가입
          </Link>
        </li>
      </ul>
    </nav>
  );
}
