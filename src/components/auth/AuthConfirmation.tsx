"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type ConfirmationState =
  | { status: "checking"; message: string }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

export function AuthConfirmation() {
  const configured = isSupabaseConfigured();
  const [state, setState] = useState<ConfirmationState>(
    configured
      ? {
          status: "checking",
          message: "이메일 인증 정보를 확인하고 있습니다.",
        }
      : {
          status: "error",
          message:
            "Supabase 연결 정보가 설정되지 않았습니다. 환경변수를 먼저 설정해 주세요.",
        },
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    void (async () => {
      const parameters = new URLSearchParams(window.location.search);
      const callbackError = parameters.get("error_code");
      const code = parameters.get("code");

      if (callbackError) {
        if (isMounted) {
          setState({
            status: "error",
            message:
              callbackError === "otp_expired"
                ? "인증 링크가 만료되었습니다. 다시 회원가입해 주세요."
                : "이메일 인증에 실패했습니다. 다시 시도해 주세요.",
          });
        }
        return;
      }

      if (!code) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (isMounted) {
          setState(
            session
              ? {
                  status: "success",
                  message: "이메일 인증이 완료되었습니다.",
                }
              : {
                  status: "error",
                  message:
                    "유효한 인증 정보를 찾을 수 없습니다. 이메일의 인증 링크를 다시 확인해 주세요.",
                },
          );
        }
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!isMounted) {
        return;
      }

      if (error) {
        setState({
          status: "error",
          message: getAuthErrorMessage(
            error,
            "이메일 인증을 완료하지 못했습니다. 다시 회원가입해 주세요.",
          ),
        });
        return;
      }

      window.history.replaceState({}, document.title, "/auth/confirm");
      setState({
        status: "success",
        message: "이메일 인증과 로그인이 완료되었습니다.",
      });
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const isChecking = state.status === "checking";
  const isSuccess = state.status === "success";

  return (
    <div className="text-center">
      <div
        className={`mx-auto flex size-12 items-center justify-center rounded-full border text-lg ${
          isChecking
            ? "border-white/20 bg-white/5 text-stone-400"
            : isSuccess
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
              : "border-red-300/30 bg-red-300/10 text-red-200"
        }`}
        aria-hidden="true"
      >
        {isChecking ? "…" : isSuccess ? "✓" : "!"}
      </div>

      <p
        role={state.status === "error" ? "alert" : "status"}
        className="mt-5 text-sm leading-6 text-stone-300"
      >
        {state.message}
      </p>

      {!isChecking && (
        <div className="mt-7 flex justify-center gap-3">
          <Link
            href={isSuccess ? "/" : "/signup"}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/50 bg-white/10 px-5 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
          >
            {isSuccess ? "홈으로 이동" : "회원가입 다시 하기"}
          </Link>
          {!isSuccess && (
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-stone-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
            >
              로그인
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

