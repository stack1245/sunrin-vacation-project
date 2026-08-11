export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 24;
export const PASSWORD_MIN_LENGTH = 8;
export const GAME_DATA_RESET_CONFIRMATION = "초기화";

export function normalizeNickname(value: string): string {
  return value.trim();
}

export function getNicknameValidationMessage(value: string): string | null {
  const nickname = normalizeNickname(value);

  if (nickname.length < NICKNAME_MIN_LENGTH) {
    return `닉네임은 ${NICKNAME_MIN_LENGTH}자 이상 입력해 주세요.`;
  }

  if (nickname.length > NICKNAME_MAX_LENGTH) {
    return `닉네임은 ${NICKNAME_MAX_LENGTH}자 이하로 입력해 주세요.`;
  }

  return null;
}

export function getPasswordValidationMessage(
  currentPassword: string,
  newPassword: string,
  passwordConfirmation: string,
): string | null {
  if (!currentPassword) {
    return "현재 비밀번호를 입력해 주세요.";
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return `새 비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 입력해 주세요.`;
  }

  if (newPassword === currentPassword) {
    return "현재 비밀번호와 다른 새 비밀번호를 입력해 주세요.";
  }

  if (newPassword !== passwordConfirmation) {
    return "새 비밀번호 확인이 일치하지 않습니다.";
  }

  return null;
}

export function isGameDataResetConfirmed(value: string): boolean {
  return value === GAME_DATA_RESET_CONFIRMATION;
}
