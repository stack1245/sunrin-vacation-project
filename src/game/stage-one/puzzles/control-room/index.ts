/**
 * E 파트 · 보안 통제실 퍼즐 공개 진입점
 *
 * 다른 파트와 A의 통합 코드는 이 파일이 내보내는 것만 사용한다.
 * 내부 파일을 직접 import하는 깊은 상대 경로 의존을 만들지 않는다.
 */

export {
  CONTROL_ROOM_MAX_INPUT_LENGTH,
  CONTROL_ROOM_TAB_LABELS,
  CONTROL_ROOM_TAB_ORDER,
  ControlRoomPuzzle,
  type ControlRoomPuzzleOptions,
  type ControlRoomPuzzleSnapshot,
  type ControlRoomStatusTone,
} from "./controlRoomPuzzle.ts";

export {
  CONTROL_ROOM_SOLVED_EVENT,
  ControlRoomCompletionFlow,
  DOCUMENT_STORAGE_UNLOCKED_EVENT,
  type ControlRoomCommitInput,
  type ControlRoomCommitOutcome,
  type ControlRoomCommitResult,
  type ControlRoomCompletionEvent,
  type ControlRoomProgressPort,
  type ControlRoomSolvedPayload,
  type DocumentStorageUnlockedPayload,
} from "./completionFlow.ts";

export {
  CONTROL_ROOM_MAX_OTP_ATTEMPTS,
  CONTROL_ROOM_OTP_LENGTH,
  ControlRoomOtpConfigError,
  decodeSeedHex,
  deriveControlRoomOtp,
  describeControlRoomOtpRule,
  isControlRoomOtpShape,
  verifyControlRoomOtp,
  type ControlRoomOtpVerification,
} from "./otp.ts";

export {
  CONTROL_ROOM_CONSOLE_BANNER,
  CONTROL_ROOM_COOKIES,
  CONTROL_ROOM_NETWORK_ENTRIES,
  CONTROL_ROOM_NOTICE_LINES,
  CONTROL_ROOM_OTP_CONFIG,
  createControlRoomCookies,
} from "./puzzleData.ts";

export {
  ControlRoomOtpIssuer,
  issueControlRoomOtpSession,
  type ControlRoomOtpSession,
} from "./otpSession.ts";

export {
  buildControlRoomViewModel,
  CONTROL_ROOM_VISIBLE_LINES,
  type ControlRoomBodyLine,
  type ControlRoomTabView,
  type ControlRoomViewModel,
} from "./viewModel.ts";

export {
  executeVirtualCommand,
  parseVirtualCommand,
  VIRTUAL_CONSOLE_PROMPT,
  VirtualConsoleBuffer,
  type VirtualConsoleExecution,
  type VirtualConsoleIntent,
} from "./virtualConsole.ts";

export {
  VirtualCookieJar,
  type VirtualCookieLookup,
  type VirtualCookieView,
} from "./virtualCookieJar.ts";

export type {
  ControlRoomCloseReason,
  ControlRoomOtpConfig,
  ControlRoomPhase,
  ControlRoomPuzzleEvent,
  ControlRoomTabId,
  VirtualConsoleLevel,
  VirtualConsoleLine,
  VirtualCookie,
  VirtualNetworkEntry,
} from "./types.ts";
