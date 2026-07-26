"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  type SupabaseBrowserClient,
} from "@/lib/supabase/client";

type ConfirmationState =
  | { status: "checking"; message: string }
  | { status: "error"; message: string }
  | { status: "expired"; message: string }
  | { status: "success"; message: string };

let codeExchange:
  | {
      code: string;
      promise: ReturnType<
        SupabaseBrowserClient["auth"]["exchangeCodeForSession"]
      >;
    }
  | null = null;

function exchangeConfirmationCode(
  supabase: SupabaseBrowserClient,
  code: string,
) {
  if (!codeExchange || codeExchange.code !== code) {
    codeExchange = {
      code,
      promise: supabase.auth.exchangeCodeForSession(code),
    };
  }

  return codeExchange.promise;
}

function isExpiredErrorCode(errorCode: string | undefined): boolean {
  return errorCode === "otp_expired" || errorCode === "flow_state_expired";
}

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
      const hashParameters = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );
      const callbackError =
        parameters.get("error_code") ?? hashParameters.get("error_code");
      const code = parameters.get("code") ?? hashParameters.get("code");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          if (isMounted) {
            window.history.replaceState({}, document.title, "/auth/confirm");
            setState({
              status: "success",
              message:
                "이메일 인증과 로그인이 완료되었습니다. 이제 게임을 시작할 수 있습니다.",
            });
          }
          return;
        }

        if (callbackError) {
          if (isMounted) {
            setState(
              isExpiredErrorCode(callbackError)
                ? {
                    status: "expired",
                    message:
                      "인증 링크가 만료되었습니다. 인증 메일을 다시 요청해 주세요.",
                  }
                : {
                    status: "error",
                    message:
                      "이미 처리되었거나 올바르지 않은 인증 링크입니다.",
                  },
            );
          }
          return;
        }

        if (!code) {
          if (isMounted) {
            setState({
              status: "error",
              message:
                "유효한 인증 정보를 찾을 수 없습니다. 이메일의 인증 링크를 다시 확인해 주세요.",
            });
          }
          return;
        }

        const { error } = await exchangeConfirmationCode(supabase, code);

        if (!isMounted) {
          return;
        }

        if (error) {
          setState(
            isExpiredErrorCode(error.code)
              ? {
                  status: "expired",
                  message:
                    "인증 링크가 만료되었습니다. 인증 메일을 다시 요청해 주세요.",
                }
              : {
                  status: "error",
                  message: getAuthErrorMessage(
                    error,
                    "이미 처리되었거나 올바르지 않은 인증 링크입니다.",
                  ),
                },
          );
          return;
        }

        window.history.replaceState({}, document.title, "/auth/confirm");
        setState({
          status: "success",
          message:
            "이메일 인증과 로그인이 완료되었습니다. 이제 게임을 시작할 수 있습니다.",
        });
      } catch {
        if (isMounted) {
          setState({
            status: "error",
            message:
              "네트워크 연결을 확인한 뒤 인증 링크를 다시 열어 주세요.",
          });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const isChecking = state.status === "checking";
  const isSuccess = state.status === "success";
  const isFailure = state.status === "error" || state.status === "expired";

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
        role={isFailure ? "alert" : "status"}
        className="mt-5 text-sm leading-6 text-stone-300"
      >
        {state.message}
      </p>

      {!isChecking && (
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href={isSuccess ? "/" : "/signup"}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/50 bg-white/10 px-5 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
          >
            {isSuccess ? "메인으로 돌아가기" : "인증 메일 다시 요청하기"}
          </Link>
          {isFailure && (
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-stone-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
            >
              로그인하기
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
