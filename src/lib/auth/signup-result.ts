import type { User } from "@supabase/supabase-js";

export const EXISTING_EMAIL_SIGNUP_MESSAGE =
  "이미 가입된 이메일입니다. 로그인해 주세요.";

type SignupUser = Pick<User, "identities">;

/**
 * 이메일 확인이 활성화된 Supabase는 계정 열거를 막기 위해 중복 가입에도
 * 오류 대신 identity가 없는 사용자 객체를 반환할 수 있다.
 */
export function isExistingEmailSignup(
  user: SignupUser | null,
): boolean {
  return Array.isArray(user?.identities) && user.identities.length === 0;
}
