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

function isStaleSignupErrorCode(errorCode: string | undefined): boolean {
  return (
    errorCode === "flow_state_expired" ||
    errorCode === "flow_state_not_found" ||
    errorCode === "identity_not_found" ||
    errorCode === "otp_expired" ||
    errorCode === "user_not_found"
  );
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
            "현재 이메일 인증 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
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
              isStaleSignupErrorCode(callbackError)
                ? {
                    status: "expired",
                    message:
                      "인증 링크가 만료되었거나 회원가입 요청이 삭제되었습니다. 다시 회원가입해 주세요.",
                  }
                : {
                    status: "error",
                    message:
                      "올바르지 않거나 이미 처리된 인증 링크입니다. 다시 회원가입해 주세요.",
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
                "유효한 인증 정보를 찾을 수 없습니다. 다시 회원가입해 주세요.",
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
            isStaleSignupErrorCode(error.code)
              ? {
                  status: "expired",
                  message:
                    "인증 링크가 만료되었거나 회원가입 요청이 삭제되었습니다. 다시 회원가입해 주세요.",
                }
              : {
                  status: "error",
                  message: getAuthErrorMessage(
                    error,
                    "올바르지 않거나 이미 처리된 인증 링크입니다. 다시 회원가입해 주세요.",
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
        className={`mx-auto flex size-12 items-center justify-center rounded-[3px] border font-mono text-lg ${
          isChecking
            ? "border-[var(--game-border)] bg-[var(--game-surface-raised)] text-[var(--game-muted)]"
            : isSuccess
              ? "border-[#315447] bg-[var(--game-success-surface)] text-[var(--game-accent)]"
              : "border-[#8b514d] bg-[var(--game-danger-surface)] text-[var(--game-warning)]"
        }`}
        aria-hidden="true"
      >
        {isChecking ? "…" : isSuccess ? "✓" : "!"}
      </div>

      <p
        role={isFailure ? "alert" : "status"}
        className="mt-5 text-sm leading-6 text-[var(--game-text)]"
      >
        {state.message}
      </p>

      {!isChecking && (
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href={isSuccess ? "/" : "/signup"}
            className="facility-button-primary facility-focus px-5"
          >
            {isSuccess ? "메인으로 돌아가기" : "회원가입 다시 하기"}
          </Link>
          {isFailure && (
            <Link
              href="/login"
              className="facility-button facility-focus px-4"
            >
              로그인하기
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
