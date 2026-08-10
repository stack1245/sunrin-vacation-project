/**
 * E 파트 · 가짜 DevTools 뷰모델
 *
 * 퍼즐 스냅숏을 화면에 그릴 문자열로만 변환하는 순수 계층이다.
 * Phaser 어댑터는 이 뷰모델만 읽고 텍스트를 갱신하므로, 렌더링 규칙을
 * 브라우저 없이 그대로 테스트할 수 있다.
 */

import {
  CONTROL_ROOM_TAB_LABELS,
  CONTROL_ROOM_TAB_ORDER,
  type ControlRoomPuzzleSnapshot,
  type ControlRoomStatusTone,
} from "./controlRoomPuzzle.ts";
import { CONTROL_ROOM_OTP_LENGTH } from "./otp.ts";
import type { ControlRoomTabId, VirtualConsoleLevel } from "./types.ts";
import { VIRTUAL_CONSOLE_PROMPT } from "./virtualConsole.ts";

/** 본문에 한 번에 표시할 최대 줄 수. 작은 화면에서도 잘리지 않는 값이다. */
export const CONTROL_ROOM_VISIBLE_LINES = 11;

/** 탭 표시 정보. */
export interface ControlRoomTabView {
  readonly id: ControlRoomTabId;
  readonly label: string;
  readonly active: boolean;
}

/** 본문 한 줄. */
export interface ControlRoomBodyLine {
  readonly text: string;
  readonly level: VirtualConsoleLevel;
}

/** 가짜 DevTools 창 전체 뷰모델. */
export interface ControlRoomViewModel {
  readonly title: string;
  readonly tabs: readonly ControlRoomTabView[];
  readonly bodyLines: readonly ControlRoomBodyLine[];
  readonly inputLine: string;
  readonly caretVisible: boolean;
  readonly statusText: string;
  readonly statusTone: ControlRoomStatusTone;
  readonly footer: string;
}

const TITLE = "SEC-DEVTOOLS · 통제실 로컬 단말 (게임 내부 전용)";

/**
 * 안내 문구는 탭에 따라 달라진다.
 *
 * 콘솔 탭에서는 모든 인쇄 가능한 문자가 입력으로 들어가므로 닫기 단축키를 안내하지 않고
 * `exit` 명령을 안내한다. 나머지 탭에서는 Q 로 닫는다.
 */
function footer(snapshot: ControlRoomPuzzleSnapshot): string {
  return snapshot.activeTab === "console"
    ? "Tab 탭이동 · Enter 실행 · Backspace 지움 · exit 닫기"
    : "Tab 탭이동 · Enter 실행 · Backspace 지움 · Q 닫기";
}

function tabs(active: ControlRoomTabId): readonly ControlRoomTabView[] {
  return CONTROL_ROOM_TAB_ORDER.map((id, index) => ({
    id,
    label: `${index + 1} ${CONTROL_ROOM_TAB_LABELS[id]}`,
    active: id === active,
  }));
}

function tail<T>(items: readonly T[], count: number): readonly T[] {
  return items.length <= count ? items : items.slice(items.length - count);
}

function consoleBody(
  snapshot: ControlRoomPuzzleSnapshot,
): readonly ControlRoomBodyLine[] {
  return tail(snapshot.consoleLines, CONTROL_ROOM_VISIBLE_LINES).map((line) => ({
    text: line.text,
    level: line.level,
  }));
}

function cookiesBody(
  snapshot: ControlRoomPuzzleSnapshot,
): readonly ControlRoomBodyLine[] {
  const header: ControlRoomBodyLine = {
    text: "이름                  값             설명",
    level: "system",
  };
  const rows = snapshot.cookies.map((cookie): ControlRoomBodyLine => {
    const name = cookie.name.padEnd(20, " ");
    const value = cookie.displayValue.padEnd(14, " ");

    return {
      text: `${name}${value}${cookie.note}`,
      level: cookie.masked && !cookie.revealed ? "warning" : "output",
    };
  });
  const hint: ControlRoomBodyLine = {
    text: '가려진 값은 콘솔에서 cookie.get("이름") 으로 열람합니다.',
    level: "system",
  };

  return tail([header, ...rows, hint], CONTROL_ROOM_VISIBLE_LINES);
}

function networkBody(
  snapshot: ControlRoomPuzzleSnapshot,
): readonly ControlRoomBodyLine[] {
  const lines: ControlRoomBodyLine[] = [];

  for (const entry of snapshot.network) {
    lines.push({
      text: `${entry.status} ${entry.method} ${entry.path}`,
      level: entry.status >= 400 ? "error" : "output",
    });
    lines.push({ text: `      ${entry.body}`, level: "system" });
  }

  return tail(lines, CONTROL_ROOM_VISIBLE_LINES);
}

function authBody(
  snapshot: ControlRoomPuzzleSnapshot,
): readonly ControlRoomBodyLine[] {
  const lines: ControlRoomBodyLine[] = [
    { text: "보안 인증 (OTP)", level: "system" },
    { text: "", level: "output" },
  ];

  if (snapshot.released) {
    lines.push({
      text: "인증 완료 · 문서 보관실 봉쇄가 해제되었습니다.",
      level: "success",
    });
    return lines;
  }

  if (snapshot.verified) {
    lines.push(
      { text: "인증 완료 · 봉쇄 해제가 남아 있습니다.", level: "success" },
      {
        text: "Enter 를 누르거나 콘솔에서 lockdown.release() 를 실행하세요.",
        level: "warning",
      },
    );
    return lines;
  }

  const filled = snapshot.otpInput.padEnd(CONTROL_ROOM_OTP_LENGTH, "_");
  const boxes = filled.split("").join(" ");

  lines.push(
    { text: `  ${boxes}`, level: "output" },
    { text: "", level: "output" },
    {
      text: `숫자 ${CONTROL_ROOM_OTP_LENGTH}자리를 입력하고 Enter 를 누르세요.`,
      level: "system",
    },
    {
      text: `남은 시도 ${snapshot.remainingAttempts}회 · 누적 실패 ${snapshot.failedAttempts}회`,
      level: snapshot.remainingAttempts <= 2 ? "error" : "system",
    },
  );

  return lines;
}

function inputLine(snapshot: ControlRoomPuzzleSnapshot): string {
  if (snapshot.busy) {
    return "처리 중…";
  }

  if (snapshot.activeTab === "console") {
    return `${VIRTUAL_CONSOLE_PROMPT} ${snapshot.consoleInput}`;
  }

  if (snapshot.activeTab === "auth") {
    return snapshot.verified
      ? "Enter · 봉쇄 해제 실행"
      : `OTP > ${snapshot.otpInput}`;
  }

  return "읽기 전용 탭입니다. 1 을 눌러 콘솔로 돌아갑니다.";
}

/**
 * 스냅숏을 화면 표현으로 변환한다.
 *
 * 정답 OTP나 내부 저장 필드명 같은 민감한 값을 화면에 넣지 않는다.
 */
export function buildControlRoomViewModel(
  snapshot: ControlRoomPuzzleSnapshot,
): ControlRoomViewModel {
  const body =
    snapshot.activeTab === "console"
      ? consoleBody(snapshot)
      : snapshot.activeTab === "cookies"
        ? cookiesBody(snapshot)
        : snapshot.activeTab === "network"
          ? networkBody(snapshot)
          : authBody(snapshot);

  return {
    title: TITLE,
    tabs: tabs(snapshot.activeTab),
    bodyLines: body,
    inputLine: inputLine(snapshot),
    caretVisible:
      !snapshot.busy &&
      (snapshot.activeTab === "console" ||
        (snapshot.activeTab === "auth" && !snapshot.verified)),
    statusText: snapshot.statusText,
    statusTone: snapshot.statusTone,
    footer: footer(snapshot),
  };
}
