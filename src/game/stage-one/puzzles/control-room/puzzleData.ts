/**
 * E 파트 · 보안 통제실 퍼즐 데이터
 *
 * 가짜 DevTools 안에서 플레이어가 읽게 될 모든 콘텐츠를 한곳에 모았다.
 * 이 값들은 게임 내부 상수일 뿐이며 실제 쿠키·네트워크 요청과 아무 관계가 없다.
 *
 * ## 정답 도출 경로
 *
 * 1. 쿠키 탭에서 `sec.shift` 를 읽는다.
 * 2. `sec.session` 은 마스킹되어 있으므로 콘솔에서 `cookie.get("sec.session")` 으로 연다.
 * 3. 네트워크 탭 `POST /security/otp/issue` 응답 또는 콘솔 `otp.rule()` 로 파생 규칙을 얻는다.
 * 4. 규칙대로 계산한 6자리를 인증 탭이나 `otp.verify("......")` 로 제출한다.
 *
 * 기본 데이터 기준 정답은 `deriveControlRoomOtp()` 가 계산하며 여기에 하드코딩하지 않는다.
 */

import type {
  ControlRoomOtpConfig,
  VirtualCookie,
  VirtualNetworkEntry,
} from "./types.ts";

/**
 * 기본 OTP 설정.
 *
 * `shift` 는 D 파트(과학 실험실)가 인계하는 "보안 통제실 코드 단서"와 연결할 수 있는 지점이다.
 * D의 값이 확정되면 이 상수만 교체하면 되고 퍼즐 로직은 그대로 둔다.
 * 확정 전까지는 통제실 벽면 안내판과 네트워크 로그가 같은 값을 자체 제공한다.
 */
export const CONTROL_ROOM_OTP_CONFIG: ControlRoomOtpConfig = {
  seedHex: "1A4",
  shift: 7,
};

/** 가상 쿠키 목록. 실제 document.cookie를 읽거나 쓰지 않는다. */
export const CONTROL_ROOM_COOKIES: readonly VirtualCookie[] = [
  {
    name: "sec.session",
    value: "0x1A4",
    note: "세션 시드 (16진수). 마스킹 해제 필요",
    masked: true,
  },
  {
    name: "sec.shift",
    value: "7",
    note: "체크섬 시프트 계수",
  },
  {
    name: "sec.lockdown",
    value: "engaged",
    note: "문서 보관실 봉쇄 상태",
  },
  {
    name: "sec.otp_channel",
    value: "terminal-only",
    note: "OTP 발급 경로. 외부 전송 없음",
  },
  {
    name: "sec.audit",
    value: "off",
    note: "감사 로그 비활성. 흔적이 남지 않는다",
  },
];

/** 가상 네트워크 로그. 실제 fetch/XHR을 발생시키지 않는 정적 텍스트다. */
export const CONTROL_ROOM_NETWORK_ENTRIES: readonly VirtualNetworkEntry[] = [
  {
    method: "POST",
    path: "/security/otp/issue",
    status: 202,
    summary: "OTP 발급 요청 수락됨",
    body: '{ "delivery": "terminal-only", "rule": "otp = base ++ check" }',
  },
  {
    method: "GET",
    path: "/security/otp/rule",
    status: 200,
    summary: "파생 규칙 조회",
    body: '{ "base": "dec(sec.session) 마지막 3자리", "check": "(digitsum(base) * sec.shift) mod 1000" }',
  },
  {
    method: "POST",
    path: "/storage/lockdown/release",
    status: 401,
    summary: "봉쇄 해제 거부됨 · 인증 선행 필요",
    body: '{ "error": "OTP_REQUIRED", "hint": "인증 후 lockdown.release() 재시도" }',
  },
  {
    method: "GET",
    path: "/storage/document/manifest",
    status: 403,
    summary: "문서 목록 접근 차단",
    body: '{ "error": "STORAGE_SEALED", "unlockedBy": "sec.lockdown" }',
  },
];

/** 콘솔 탭 진입 시 미리 채워지는 배너. */
export const CONTROL_ROOM_CONSOLE_BANNER: readonly string[] = [
  "OutOfBounds 보안 콘솔 v2.4 — 통제실 로컬 단말",
  "이 콘솔은 연구소 보안망 전용입니다. 외부 시스템과 연결되어 있지 않습니다.",
  "사용 가능한 명령을 보려면 help 를 입력하세요.",
];

/** 통제실 벽면 안내판 문구. 상호작용으로 읽을 수 있는 보조 힌트다. */
export const CONTROL_ROOM_NOTICE_LINES: readonly string[] = [
  "보안 수칙 3항: 봉쇄 해제는 통제실 단말에서만 승인된다.",
  "보안 수칙 7항: 세션 시드는 16진수로 보관하고 평문으로 옮겨 적지 않는다.",
  "보안 수칙 9항: 체크섬 계수는 실험동 승인 코드와 동일하게 유지한다.",
];
