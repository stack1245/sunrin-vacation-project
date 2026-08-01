import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/AuthForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export const metadata: Metadata = {
  title: "로그인 | OutOfBounds",
  description: "OutOfBounds 계정에 로그인합니다.",
};

export default function LoginPage() {
  return (
    <AuthPageShell
      eyebrow="ACCOUNT ACCESS"
      title="로그인"
      description="계정에 로그인하고 경계 밖의 이야기를 계속하세요."
    >
      <AuthForm mode="login" />
    </AuthPageShell>
  );
}

