import type { AuthError } from "@supabase/supabase-js";

const errorMessages: Readonly<Record<string, string>> = {
  bad_code_verifier:
    "이미 처리된 인증 링크이거나 올바르지 않은 링크야.",
  bad_oauth_callback:
    "이미 처리된 인증 링크이거나 올바르지 않은 링크야.",
  bad_oauth_state:
    "인증 요청을 확인할 수 없어. 회원가입부터 다시 시도해 줘.",
  email_address_invalid: "사용할 수 없는 이메일 주소입니다.",
  email_address_not_authorized:
    "현재 인증 메일을 보낼 수 없는 이메일 주소야.",
  email_exists: "이미 가입된 이메일입니다. 로그인해 주세요.",
  email_not_confirmed:
    "이메일 인증이 아직 완료되지 않았어. 메일함을 확인하거나 인증 메일을 다시 요청해 줘.",
  email_provider_disabled:
    "현재 이메일 회원가입이 비활성화되어 있습니다. 관리자에게 문의해 주세요.",
  flow_state_expired:
    "인증 링크가 만료됐어. 인증 메일을 다시 요청해 줘.",
  flow_state_not_found:
    "이미 처리된 인증 링크이거나 올바르지 않은 링크야.",
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
  otp_expired: "인증 링크가 만료됐어. 인증 메일을 다시 요청해 줘.",
  over_email_send_rate_limit:
    "인증 메일 요청이 너무 많아. 잠시 후 다시 시도해 줘.",
  over_request_rate_limit:
    "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  request_timeout:
    "인증 서버의 응답이 늦어지고 있어. 잠시 후 다시 시도해 줘.",
  session_expired: "로그인 세션이 만료되었습니다. 다시 로그인해 주세요.",
  session_not_found: "로그인 정보를 찾을 수 없습니다. 다시 로그인해 주세요.",
  signup_disabled: "현재 신규 회원가입이 비활성화되어 있습니다.",
  unexpected_failure:
    "인증 요청을 처리하지 못했어. 잠시 후 다시 시도해 줘.",
  user_already_exists: "이미 가입된 이메일입니다. 로그인해 주세요.",
  validation_failed: "입력한 이메일과 비밀번호를 다시 확인해 주세요.",
  weak_password: "보안 기준을 충족하는 더 강한 비밀번호를 사용해 주세요.",
};

export function getAuthErrorMessage(
  error: AuthError,
  fallbackMessage: string,
): string {
  if (error.status === 429) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }

  return (error.code && errorMessages[error.code]) || fallbackMessage;
}
