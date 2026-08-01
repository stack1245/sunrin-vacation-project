import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/AuthForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export const metadata: Metadata = {
  title: "회원가입 | OutOfBounds",
  description: "OutOfBounds 계정을 생성합니다.",
};

export default function SignupPage() {
  return (
    <AuthPageShell
      eyebrow="CREATE ACCOUNT"
      title="회원가입"
      description="새 계정을 만들고 첫 번째 탈출을 준비하세요."
    >
      <AuthForm mode="signup" />
    </AuthPageShell>
  );
}

