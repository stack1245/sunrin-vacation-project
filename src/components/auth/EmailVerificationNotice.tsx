"use client";

import { useEffect, useState } from "react";

import { getEmailConfirmationUrl } from "@/lib/auth/email-redirect";
import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type VerificationReason = "signup" | "unconfirmed_login";

interface EmailVerificationNoticeProps {
  email: string;
  onUseDifferentEmail: () => void;
  reason: VerificationReason;
}

interface ResendNotice {
  kind: "error" | "success";
  message: string;
}

const RESEND_COOLDOWN_SECONDS = 60;

export function EmailVerificationNotice({
  email,
  onUseDifferentEmail,
  reason,
}: EmailVerificationNoticeProps) {
  const [cooldownSeconds, setCooldownSeconds] = useState(
    reason === "signup" ? RESEND_COOLDOWN_SECONDS : 0,
  );
  const [isResending, setIsResending] = useState(false);
  const [notice, setNotice] = useState<ResendNotice | null>(null);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cooldownSeconds]);

  async function handleResend() {
    if (isResending || cooldownSeconds > 0) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setNotice({
        kind: "error",
        message:
          "인증 메일을 보내지 못했어. 잠시 후 다시 시도해 줘.",
      });
      return;
    }

    setIsResending(true);
    setNotice(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: getEmailConfirmationUrl(),
        },
      });

      if (error) {
        setNotice({
          kind: "error",
          message: getAuthErrorMessage(
            error,
            "인증 메일을 보내지 못했어. 잠시 후 다시 시도해 줘.",
          ),
        });
        return;
      }

      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
      setNotice({
        kind: "success",
        message:
          "인증 메일을 다시 보냈어. 메일함과 스팸함을 확인해 줘.",
      });
    } catch {
      setNotice({
        kind: "error",
        message:
          "네트워크 연결을 확인한 뒤 인증 메일을 다시 요청해 줘.",
      });
    } finally {
      setIsResending(false);
    }
  }

  const isCoolingDown = cooldownSeconds > 0;

  return (
    <div className="text-center">
      <div
        className="mx-auto flex size-12 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/10 text-lg text-emerald-200"
        aria-hidden="true"
      >
        ✓
      </div>

      <p className="mt-5 text-sm font-medium leading-6 text-stone-100">
        {reason === "signup"
          ? "인증 메일을 보냈어."
          : "이메일 인증이 아직 완료되지 않았어."}
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-400">
        메일함에서 인증 링크를 눌러 회원가입을 완료해 줘.
      </p>

      <p className="mt-4 break-all rounded-md border border-white/10 bg-black/25 px-4 py-3 text-sm text-stone-200">
        {email}
      </p>

      <ul className="mt-5 space-y-1.5 text-left text-xs leading-5 text-stone-500">
        <li>· 메일이 없다면 스팸함을 확인해 줘.</li>
        <li>· 위 이메일 주소가 맞는지 확인해 줘.</li>
        <li>· 메일 도착까지 잠시 시간이 걸릴 수 있어.</li>
      </ul>

      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`mt-5 rounded-md border px-4 py-3 text-sm leading-6 ${
            notice.kind === "error"
              ? "border-red-300/20 bg-red-300/10 text-red-100"
              : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
          }`}
        >
          {notice.message}
        </p>
      )}

      <button
        type="button"
        onClick={handleResend}
        disabled={isResending || isCoolingDown}
        aria-describedby="resend-email-help"
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md border border-white/50 bg-white/10 px-5 text-sm font-medium text-white transition-colors duration-200 hover:border-white hover:bg-white/15 disabled:cursor-wait disabled:border-white/15 disabled:bg-white/5 disabled:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-4 focus-visible:ring-offset-[#030708]"
      >
        {isResending
          ? "전송 중..."
          : isCoolingDown
            ? `${cooldownSeconds}초 후 재전송`
            : "인증 메일 재전송"}
      </button>

      <p id="resend-email-help" className="sr-only" aria-live="polite">
        {isCoolingDown
          ? `${cooldownSeconds}초 후에 인증 메일을 다시 보낼 수 있습니다.`
          : "인증 메일을 다시 보낼 수 있습니다."}
      </p>

      <button
        type="button"
        onClick={onUseDifferentEmail}
        className="mt-4 rounded-sm px-2 py-2 text-sm text-stone-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
      >
        다른 이메일로 다시 입력
      </button>
    </div>
  );
}
