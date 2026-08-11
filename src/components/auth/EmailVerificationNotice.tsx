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
          "인증 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
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
            "인증 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ),
        });
        return;
      }

      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
      setNotice({
        kind: "success",
        message:
          "인증 메일을 다시 보냈습니다. 메일함과 스팸함을 확인해 주세요.",
      });
    } catch {
      setNotice({
        kind: "error",
        message:
          "네트워크 연결을 확인한 뒤 인증 메일을 다시 요청해 주세요.",
      });
    } finally {
      setIsResending(false);
    }
  }

  const isCoolingDown = cooldownSeconds > 0;

  return (
    <div className="text-center">
      <div
        className="mx-auto flex size-12 items-center justify-center rounded-[3px] border border-[#315447] bg-[var(--game-success-surface)] font-mono text-lg text-[var(--game-accent)]"
        aria-hidden="true"
      >
        ✓
      </div>

      <p className="mt-5 text-sm font-medium leading-6 text-[var(--game-text-strong)]">
        {reason === "signup"
          ? "인증 메일을 보냈습니다."
          : "이메일 인증이 아직 완료되지 않았습니다."}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--game-muted)]">
        메일함에서 인증 링크를 눌러 회원가입을 완료해 주세요.
      </p>

      <p className="mt-4 break-all rounded-[3px] border border-[var(--game-border)] bg-[var(--game-void)] px-4 py-3 font-mono text-sm text-[var(--game-text)]">
        {email}
      </p>

      <ul className="mt-5 space-y-1.5 text-left text-xs leading-5 text-[var(--game-muted)]">
        <li>· 메일이 보이지 않으면 스팸함도 확인해 주세요.</li>
        <li>· 위 이메일 주소가 정확한지 확인해 주세요.</li>
        <li>· 메일 도착까지 잠시 시간이 걸릴 수 있습니다.</li>
      </ul>

      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`mt-5 ${
            notice.kind === "error"
              ? "facility-alert"
              : "facility-success"
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
        className="facility-button-primary facility-focus mt-6 min-h-12 w-full px-5"
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
        className="facility-focus mt-4 rounded-[2px] px-2 py-2 text-sm text-[var(--game-muted)] transition-colors hover:text-[var(--game-text-strong)]"
      >
        다른 이메일로 다시 입력
      </button>
    </div>
  );
}
