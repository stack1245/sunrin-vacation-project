export const AUTH_CONFIRM_PATH = "/auth/confirm";

export function getEmailConfirmationUrl(): string {
  return new URL(AUTH_CONFIRM_PATH, window.location.origin).toString();
}
