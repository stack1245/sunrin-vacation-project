import type { Metadata } from "next";

import { AuthConfirmation } from "@/components/auth/AuthConfirmation";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export const metadata: Metadata = {
  title: "이메일 인증 | OutOfBounds",
  description: "OutOfBounds 회원가입 이메일을 인증합니다.",
};

export default function AuthConfirmPage() {
  return (
    <AuthPageShell
      eyebrow="EMAIL VERIFICATION"
      title="이메일 인증"
      description="안전한 계정 생성을 위해 인증 정보를 확인합니다."
    >
      <AuthConfirmation />
    </AuthPageShell>
  );
}
