/**
 * E 파트 · 보안 통제실 퍼즐 공통 타입
 *
 * 소유: 10602 김보민 (파트 E)
 *
 * ## 격리 규칙 (본 디렉터리 전체에 적용)
 *
 * 이 디렉터리의 모든 모듈은 순수 도메인 코드다. 아래를 절대 사용하지 않는다.
 *
 * - 실제 브라우저 저장소: `document.cookie`, `localStorage`, `sessionStorage`, `indexedDB`
 * - 실제 개발자 도구·전역 콘솔: `console`, `debugger`, `window`, `document`
 * - Supabase 클라이언트, 테이블명, RPC명 (저장은 A의 progressBridge 경로로만 간접 수행)
 * - Phaser 런타임 값 (타입 전용 import 조차 두지 않는다)
 *
 * "가짜 F12", "가상 쿠키", "가상 콘솔"은 전부 이 파일이 정의하는 평범한 게임 상태다.
 * 위 규칙은 `isolation.test.ts`의 정적 소스 스캔으로 자동 검증한다.
 */

/** 가짜 DevTools 창의 탭 식별자. UI 표시명은 별도로 한국어를 사용한다. */
export type ControlRoomTabId = "console" | "cookies" | "network" | "auth";

/** 가상 콘솔 한 줄의 표시 등급. 실제 console.log/warn/error와 무관한 게임 내부 값이다. */
export type VirtualConsoleLevel =
  | "system"
  | "input"
  | "output"
  | "success"
  | "warning"
  | "error";

/** 가상 콘솔 버퍼에 쌓이는 한 줄. */
export interface VirtualConsoleLine {
  readonly level: VirtualConsoleLevel;
  readonly text: string;
}

/** 가상 쿠키 한 개. 실제 Set-Cookie 헤더나 document.cookie와 무관하다. */
export interface VirtualCookie {
  readonly name: string;
  readonly value: string;
  /** 쿠키 탭에 함께 표시할 한국어 설명. 힌트 역할을 한다. */
  readonly note: string;
  /** true면 값이 마스킹되어 표시되고 콘솔 `cookie.get()`으로만 열람할 수 있다. */
  readonly masked?: boolean;
}

/** 가상 네트워크 탭에 표시할 요청 로그 한 건. 실제 fetch/XHR을 발생시키지 않는다. */
export interface VirtualNetworkEntry {
  readonly method: string;
  readonly path: string;
  readonly status: number;
  readonly summary: string;
  /** 항목을 펼쳤을 때 보이는 응답 본문 형태의 힌트. */
  readonly body: string;
}

/** OTP 파생 규칙 입력값. 퍼즐 데이터에서 주입되며 테스트에서 자유롭게 교체한다. */
export interface ControlRoomOtpConfig {
  /** 16진수 시드 문자열. 예: "1A4" */
  readonly seedHex: string;
  /** 체크섬 계산에 사용할 시프트 값. */
  readonly shift: number;
}

/** 퍼즐 진행 중 발생하는 사건. Room 어댑터와 테스트가 관찰한다. */
export type ControlRoomPuzzleEvent =
  | { readonly type: "opened"; readonly alreadySolved: boolean }
  | { readonly type: "closed"; readonly reason: ControlRoomCloseReason }
  | { readonly type: "otpRejected"; readonly attempt: number; readonly remaining: number }
  | { readonly type: "otpAccepted"; readonly attempts: number }
  | { readonly type: "lockedOut"; readonly attempts: number };

/** 가짜 DevTools 창이 닫힌 이유. */
export type ControlRoomCloseReason =
  | "user"
  | "solved"
  | "locked-out"
  | "disposed";

/** 퍼즐 단계. 저장되지 않는 세션 한정 상태다. */
export type ControlRoomPhase =
  | "browsing"
  | "verifying"
  | "committing"
  | "solved"
  | "locked-out";
