"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import {
  GAME_DATA_RESET_CONFIRMATION,
  getNicknameValidationMessage,
  getPasswordValidationMessage,
  isGameDataResetConfirmed,
  normalizeNickname,
} from "@/lib/account/accountValidation";
import {
  PROFILE_UPDATED_EVENT,
  type ProfileUpdatedEventDetail,
} from "@/lib/account/profileEvents";
import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type Notice = {
  kind: "error" | "success";
  message: string;
} | null;

const inputClassNames =
  "mt-2 min-h-12 w-full rounded-md border border-white/15 bg-black/35 px-4 text-sm text-white outline-none transition-colors placeholder:text-stone-600 hover:border-white/25 focus:border-white/45 focus:ring-2 focus:ring-white/15 read-only:cursor-default read-only:text-stone-400";
const primaryButtonClassNames =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-stone-100 px-5 text-sm font-semibold text-stone-950 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c0d] disabled:cursor-not-allowed disabled:bg-stone-600 disabled:text-stone-300";
const dangerButtonClassNames =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-red-400/45 bg-red-950/45 px-5 text-sm font-semibold text-red-100 transition-colors hover:border-red-300/70 hover:bg-red-900/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c0d] disabled:cursor-not-allowed disabled:border-red-950 disabled:text-red-400/60";

function NoticeMessage({ notice }: { notice: Notice }) {
  if (!notice) {
    return null;
  }

  const colorClassNames =
    notice.kind === "success"
      ? "border-emerald-400/25 bg-emerald-950/35 text-emerald-100"
      : "border-red-400/25 bg-red-950/35 text-red-100";

  return (
    <p
      role={notice.kind === "error" ? "alert" : "status"}
      className={`mt-4 rounded-md border px-4 py-3 text-sm leading-6 ${colorClassNames}`}
    >
      {notice.message}
    </p>
  );
}

export function AccountSettings() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(configured);
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [resetNotice, setResetNotice] = useState<Notice>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const client = supabase;
    let isMounted = true;

    async function loadAccount() {
      const { data, error } = await client.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      const fallbackNickname =
        data.user.email?.split("@")[0]?.trim() || "플레이어";

      setUserId(data.user.id);
      setEmail(data.user.email ?? "");

      const { data: ensuredNickname, error: profileError } =
        await client.rpc("ensure_my_profile");

      if (!isMounted) {
        return;
      }

      if (profileError) {
        setNickname(fallbackNickname);
        setProfileNotice({
          kind: "error",
          message:
            "회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        });
      } else {
        setNickname(ensuredNickname || fallbackNickname);
      }

      setIsLoading(false);
    }

    void loadAccount();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleNicknameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();
    const validationMessage = getNicknameValidationMessage(nickname);

    if (!supabase || !userId || isSavingNickname) {
      return;
    }

    if (validationMessage) {
      setProfileNotice({ kind: "error", message: validationMessage });
      return;
    }

    const normalizedNickname = normalizeNickname(nickname);
    setIsSavingNickname(true);
    setProfileNotice(null);

    const { error } = await supabase
      .from("profiles")
      .update({ nickname: normalizedNickname })
      .eq("id", userId);

    if (error) {
      setProfileNotice({
        kind: "error",
        message: "닉네임을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
      setIsSavingNickname(false);
      return;
    }

    setNickname(normalizedNickname);
    window.dispatchEvent(
      new CustomEvent<ProfileUpdatedEventDetail>(PROFILE_UPDATED_EVENT, {
        detail: { nickname: normalizedNickname },
      }),
    );
    setProfileNotice({ kind: "success", message: "닉네임을 저장했습니다." });
    setIsSavingNickname(false);
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();
    const validationMessage = getPasswordValidationMessage(
      currentPassword,
      newPassword,
      passwordConfirmation,
    );

    if (!supabase || !email || isChangingPassword) {
      return;
    }

    if (validationMessage) {
      setPasswordNotice({ kind: "error", message: validationMessage });
      return;
    }

    setIsChangingPassword(true);
    setPasswordNotice(null);

    const { error: verificationError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (verificationError) {
      setPasswordNotice({
        kind: "error",
        message:
          verificationError.code === "invalid_credentials"
            ? "현재 비밀번호가 올바르지 않습니다."
            : getAuthErrorMessage(
                verificationError,
                "현재 비밀번호를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
              ),
      });
      setIsChangingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordNotice({
        kind: "error",
        message: getAuthErrorMessage(
          error,
          "비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      });
      setIsChangingPassword(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setPasswordConfirmation("");
    setPasswordNotice({
      kind: "success",
      message: "비밀번호를 변경했습니다.",
    });
    setIsChangingPassword(false);
  }

  async function handleDataReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();

    if (!supabase || isResettingData) {
      return;
    }

    if (!isGameDataResetConfirmed(resetConfirmation)) {
      setResetNotice({
        kind: "error",
        message: `확인란에 ${GAME_DATA_RESET_CONFIRMATION}를 정확히 입력해 주세요.`,
      });
      return;
    }

    setIsResettingData(true);
    setResetNotice(null);

    const { error } = await supabase.rpc("reset_my_game_data");

    if (error) {
      setResetNotice({
        kind: "error",
        message:
          "게임 데이터를 초기화하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
      setIsResettingData(false);
      return;
    }

    setResetConfirmation("");
    setResetNotice({
      kind: "success",
      message:
        "게임 진행도와 저장 데이터를 초기화했습니다. 회원 정보는 유지됩니다.",
    });
    setIsResettingData(false);
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase || isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      setProfileNotice({
        kind: "error",
        message: "로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
      setIsSigningOut(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (!configured) {
    return (
      <div role="alert" className="rounded-lg border border-amber-400/30 bg-amber-950/35 p-5 text-sm leading-6 text-amber-100">
        회원 기능 설정이 완료되지 않았습니다. 환경변수 설정을 확인해 주세요.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/15 bg-black/45 p-8 text-center text-sm text-stone-400 backdrop-blur-md" aria-live="polite">
        회원 정보를 불러오는 중입니다.
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-lg border border-white/15 bg-black/50 p-5 shadow-xl shadow-black/20 backdrop-blur-md sm:p-7" aria-labelledby="account-basic-title">
        <p className="text-[0.65rem] font-semibold tracking-[0.26em] text-stone-500">PROFILE</p>
        <h2 id="account-basic-title" className="mt-2 text-xl font-semibold text-white">기본 정보</h2>
        <p className="mt-2 text-sm leading-6 text-stone-400">이메일은 로그인 식별자로 사용되며 여기서는 변경하지 않습니다.</p>

        <div className="mt-6">
          <label htmlFor="account-email" className="text-sm font-medium text-stone-200">이메일</label>
          <input id="account-email" type="email" value={email} readOnly className={inputClassNames} />
        </div>

        <form className="mt-5" onSubmit={handleNicknameSubmit} noValidate>
          <label htmlFor="account-nickname" className="text-sm font-medium text-stone-200">닉네임</label>
          <input
            id="account-nickname"
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            minLength={2}
            maxLength={24}
            autoComplete="nickname"
            required
            className={inputClassNames}
          />
          <p className="mt-2 text-xs leading-5 text-stone-500">2자 이상 24자 이하로 입력해 주세요.</p>
          <button type="submit" disabled={isSavingNickname} className={`mt-5 ${primaryButtonClassNames}`}>
            {isSavingNickname ? "저장 중" : "닉네임 저장"}
          </button>
          <NoticeMessage notice={profileNotice} />
        </form>

        <div className="mt-7 border-t border-white/10 pt-5">
          <button type="button" onClick={handleSignOut} disabled={isSigningOut} className="text-sm font-medium text-stone-300 underline decoration-stone-600 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">
            {isSigningOut ? "로그아웃 중" : "이 기기에서 로그아웃"}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-white/15 bg-black/50 p-5 shadow-xl shadow-black/20 backdrop-blur-md sm:p-7" aria-labelledby="account-password-title">
        <p className="text-[0.65rem] font-semibold tracking-[0.26em] text-stone-500">SECURITY</p>
        <h2 id="account-password-title" className="mt-2 text-xl font-semibold text-white">비밀번호 변경</h2>
        <p className="mt-2 text-sm leading-6 text-stone-400">현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.</p>

        <form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit} noValidate>
          <div>
            <label htmlFor="current-password" className="text-sm font-medium text-stone-200">현재 비밀번호</label>
            <input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required className={inputClassNames} />
          </div>
          <div>
            <label htmlFor="new-password" className="text-sm font-medium text-stone-200">새 비밀번호</label>
            <input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required className={inputClassNames} />
          </div>
          <div>
            <label htmlFor="new-password-confirmation" className="text-sm font-medium text-stone-200">새 비밀번호 확인</label>
            <input id="new-password-confirmation" type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} autoComplete="new-password" minLength={8} required className={inputClassNames} />
          </div>
          <button type="submit" disabled={isChangingPassword} className={primaryButtonClassNames}>
            {isChangingPassword ? "변경 중" : "비밀번호 변경"}
          </button>
          <NoticeMessage notice={passwordNotice} />
        </form>
      </section>

      <section className="rounded-lg border border-red-400/25 bg-black/55 p-5 shadow-xl shadow-black/20 backdrop-blur-md lg:col-span-2 sm:p-7" aria-labelledby="account-reset-title">
        <p className="text-[0.65rem] font-semibold tracking-[0.26em] text-red-300/70">DANGER ZONE</p>
        <h2 id="account-reset-title" className="mt-2 text-xl font-semibold text-white">게임 데이터 초기화</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">
          모든 스테이지 진행도, 최고 기록과 세부 저장 데이터를 삭제하고 처음 상태로 되돌립니다. 이메일, 닉네임과 로그인 계정은 삭제되지 않습니다.
        </p>

        <form className="mt-6 max-w-xl" onSubmit={handleDataReset} noValidate>
          <label htmlFor="reset-confirmation" className="text-sm font-medium text-stone-200">
            계속하려면 <strong className="text-red-200">{GAME_DATA_RESET_CONFIRMATION}</strong>를 입력해 주세요.
          </label>
          <input
            id="reset-confirmation"
            type="text"
            value={resetConfirmation}
            onChange={(event) => setResetConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className={inputClassNames}
          />
          <button
            type="submit"
            disabled={isResettingData || !isGameDataResetConfirmed(resetConfirmation)}
            className={`mt-5 ${dangerButtonClassNames}`}
          >
            {isResettingData ? "초기화 중" : "게임 데이터 초기화"}
          </button>
          <NoticeMessage notice={resetNotice} />
        </form>
      </section>
    </div>
  );
}
