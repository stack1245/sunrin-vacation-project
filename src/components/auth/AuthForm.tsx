"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { EmailVerificationNotice } from "@/components/auth/EmailVerificationNotice";
import { getEmailConfirmationUrl } from "@/lib/auth/email-redirect";
import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

interface FormNotice {
  kind: "error" | "success";
  message: string;
}

interface VerificationRequest {
  email: string;
  reason: "signup" | "unconfirmed_login";
}

const AUTH_INPUT_CLASS_NAMES =
  "mt-2 min-h-12 w-full rounded-md border border-white/15 bg-black/35 px-4 text-base text-white outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-stone-600 hover:border-white/25 focus:border-white/60 focus:bg-black/50 focus:ring-2 focus:ring-white/15";

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const isSignup = mode === "signup";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<FormNotice | null>(null);
  const [verificationRequest, setVerificationRequest] =
    useState<VerificationRequest | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setNotice({
        kind: "error",
        message:
          "현재 회원 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const nickname = String(formData.get("nickname") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(
      formData.get("passwordConfirmation") ?? "",
    );

    setNotice(null);

    if (isSignup && (nickname.length < 2 || nickname.length > 24)) {
      setNotice({
        kind: "error",
        message: "닉네임은 공백을 제외하고 2자 이상 24자 이하로 입력해 주세요.",
      });
      return;
    }

    if (password.length < 8) {
      setNotice({
        kind: "error",
        message: "비밀번호는 8자 이상 입력해 주세요.",
      });
      return;
    }

    if (isSignup && password !== passwordConfirmation) {
      setNotice({
        kind: "error",
        message: "비밀번호 확인이 일치하지 않습니다.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname,
            },
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
          setIsSubmitting(false);
          return;
        }

        if (data.session) {
          router.replace("/");
          router.refresh();
          return;
        }

        form.reset();
        setVerificationRequest({
          email,
          reason: "signup",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.code === "email_not_confirmed") {
          form.reset();
          setVerificationRequest({
            email,
            reason: "unconfirmed_login",
          });
          setIsSubmitting(false);
          return;
        }

        setNotice({
          kind: "error",
          message: getAuthErrorMessage(
            error,
            "로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ),
        });
        setIsSubmitting(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setNotice({
        kind: "error",
        message: isSignup
          ? "네트워크 연결을 확인한 뒤 회원가입을 다시 시도해 주세요."
          : "네트워크 연결을 확인한 뒤 로그인을 다시 시도해 주세요.",
      });
      setIsSubmitting(false);
    }
  }

  if (verificationRequest) {
    return (
      <EmailVerificationNotice
        email={verificationRequest.email}
        reason={verificationRequest.reason}
        onUseDifferentEmail={() => {
          setVerificationRequest(null);
          setNotice(null);
        }}
      />
    );
  }

  return (
    <>
      {!configured && (
        <p
          role="alert"
          className="mb-5 rounded-md border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm leading-6 text-amber-100"
        >
          현재 회원 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해
          주세요.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
        {isSignup && (
          <div>
            <label
              htmlFor={`${mode}-nickname`}
              className="text-sm font-medium text-stone-200"
            >
              닉네임
            </label>
            <input
              id={`${mode}-nickname`}
              name="nickname"
              type="text"
              autoComplete="nickname"
              required
              minLength={2}
              maxLength={24}
              placeholder="2~24자"
              className={AUTH_INPUT_CLASS_NAMES}
            />
          </div>
        )}

        <div>
          <label
            htmlFor={`${mode}-email`}
            className="text-sm font-medium text-stone-200"
          >
            이메일
          </label>
          <input
            id={`${mode}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className={AUTH_INPUT_CLASS_NAMES}
          />
        </div>

        <div>
          <label
            htmlFor={`${mode}-password`}
            className="text-sm font-medium text-stone-200"
          >
            비밀번호
          </label>
          <input
            id={`${mode}-password`}
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={8}
            className={AUTH_INPUT_CLASS_NAMES}
            aria-describedby={isSignup ? `${mode}-password-hint` : undefined}
          />
          {isSignup && (
            <p
              id={`${mode}-password-hint`}
              className="mt-2 text-xs text-stone-500"
            >
              8자 이상의 비밀번호를 입력해 주세요.
            </p>
          )}
        </div>

        {isSignup && (
          <div>
            <label
              htmlFor={`${mode}-password-confirmation`}
              className="text-sm font-medium text-stone-200"
            >
              비밀번호 확인
            </label>
            <input
              id={`${mode}-password-confirmation`}
              name="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={AUTH_INPUT_CLASS_NAMES}
            />
          </div>
        )}

        {notice && (
          <p
            role={notice.kind === "error" ? "alert" : "status"}
            className={`rounded-md border px-4 py-3 text-sm leading-6 ${
              notice.kind === "error"
                ? "border-red-300/20 bg-red-300/10 text-red-100"
                : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
            }`}
          >
            {notice.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !configured}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-white/60 bg-white/10 px-6 text-sm font-semibold tracking-[0.12em] text-white transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white/15 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:border-white/15 disabled:bg-white/5 disabled:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-4 focus-visible:ring-offset-[#030708]"
        >
          {isSubmitting
            ? "처리 중..."
            : isSignup
              ? "회원가입"
              : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-400">
        {isSignup ? "이미 계정이 있으신가요?" : "아직 계정이 없으신가요?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="rounded-sm font-medium text-stone-100 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
        >
          {isSignup ? "로그인" : "회원가입"}
        </Link>
      </p>
    </>
  );
}
