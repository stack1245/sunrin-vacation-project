/**
 * E 파트 · 가상 콘솔
 *
 * 게임 내부에서만 존재하는 페이크 콘솔이다. 전역 `console` 객체를 호출하지 않고,
 * 로그는 이 모듈이 들고 있는 배열에만 쌓인다. 명령 실행은 순수 함수이며
 * 진행도 저장이나 이벤트 발행 같은 부수효과를 직접 일으키지 않는다.
 *
 * 명령이 게임 상태 변화를 요구하면 부수효과 대신 `intent` 를 반환하고,
 * 실제 처리는 퍼즐 상태 머신(`controlRoomPuzzle.ts`)이 담당한다.
 * 덕분에 콘솔 자체는 저장·이벤트와 완전히 분리된 채로 단위 테스트할 수 있다.
 */

import { describeControlRoomOtpRule } from "./otp.ts";
import type { VirtualCookieJar } from "./virtualCookieJar.ts";
import type { VirtualConsoleLine, VirtualNetworkEntry } from "./types.ts";

/** 최대 보관 줄 수. 초과분은 오래된 순으로 버려 메모리 사용을 제한한다. */
export const VIRTUAL_CONSOLE_MAX_LINES = 200;

/** 콘솔 프롬프트 문자열. */
export const VIRTUAL_CONSOLE_PROMPT = "sec>";

/** 명령 실행이 퍼즐 상태 머신에 요청하는 후속 처리. */
export type VirtualConsoleIntent =
  | { readonly kind: "none" }
  | { readonly kind: "clear" }
  | { readonly kind: "close" }
  | { readonly kind: "verify-otp"; readonly code: string }
  | { readonly kind: "release-lockdown" };

/** 명령 실행 결과. */
export interface VirtualConsoleExecution {
  readonly lines: readonly VirtualConsoleLine[];
  readonly intent: VirtualConsoleIntent;
}

/** 파싱된 명령. */
export interface ParsedVirtualCommand {
  readonly namespace: string;
  readonly member: string | null;
  readonly args: readonly string[];
  readonly called: boolean;
}

/** 명령 실행에 필요한 읽기 전용 자료. */
export interface VirtualConsoleDeps {
  readonly cookies: VirtualCookieJar;
  readonly network: readonly VirtualNetworkEntry[];
  /** 봉쇄 해제 상태 문구를 만들기 위한 현재 진행 스냅숏. */
  readonly lockdown: () => {
    readonly verified: boolean;
    readonly released: boolean;
  };
}

const COMMAND_PATTERN =
  /^([a-zA-Z_][A-Za-z0-9_]*)(?:\.([a-zA-Z_][A-Za-z0-9_]*))?(?:\s*\(([^)]*)\)\s*)?$/;

function line(
  level: VirtualConsoleLine["level"],
  text: string,
): VirtualConsoleLine {
  return { level, text };
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];

    if ((first === '"' || first === "'" || first === "`") && first === last) {
      return trimmed.slice(1, -1);
    }
  }

  return trimmed;
}

/** 콘솔 입력 한 줄을 명령 구조로 파싱한다. 형식이 어긋나면 null을 반환한다. */
export function parseVirtualCommand(input: string): ParsedVirtualCommand | null {
  const trimmed = input.trim();
  const match = COMMAND_PATTERN.exec(trimmed);

  if (!match) {
    return null;
  }

  const [, namespace, member, rawArgs] = match;
  const called = rawArgs !== undefined;
  const args =
    rawArgs === undefined || rawArgs.trim().length === 0
      ? []
      : rawArgs.split(",").map(stripQuotes);

  return {
    namespace: namespace.toLowerCase(),
    member: member ? member.toLowerCase() : null,
    args,
    called,
  };
}

function helpLines(): readonly VirtualConsoleLine[] {
  return [
    line("system", "사용 가능한 명령"),
    line("output", "  help                     명령 목록 표시"),
    line("output", "  clear                    콘솔 출력 비우기"),
    line("output", "  cookie.list()            가상 쿠키 전체 조회"),
    line("output", "  cookie.get(name)         쿠키 값 조회 · 마스킹 해제"),
    line("output", "  net.list()               가상 네트워크 로그 조회"),
    line("output", "  otp.rule()               OTP 파생 규칙 조회"),
    line("output", "  otp.verify(code)         OTP 인증 시도"),
    line("output", "  lockdown.status()        문서 보관실 봉쇄 상태 확인"),
    line("output", "  lockdown.release()       인증 후 봉쇄 해제 실행"),
    line("output", "  exit                     단말 종료"),
  ];
}

function unknownCommand(input: string): VirtualConsoleExecution {
  return {
    lines: [
      line("error", `알 수 없는 명령입니다: ${input}`),
      line("output", "help 를 입력하면 사용 가능한 명령을 볼 수 있습니다."),
    ],
    intent: { kind: "none" },
  };
}

/**
 * 콘솔 명령 한 줄을 실행한다.
 *
 * 순수 함수처럼 동작하되 `cookie.get()` 만 예외적으로 쿠키 열람 상태를 바꾼다.
 * 진행도 저장을 요구하는 명령은 `intent` 로만 표현하고 직접 저장하지 않는다.
 */
export function executeVirtualCommand(
  input: string,
  deps: VirtualConsoleDeps,
): VirtualConsoleExecution {
  const raw = input.trim();

  if (raw.length === 0) {
    return { lines: [], intent: { kind: "none" } };
  }

  const command = parseVirtualCommand(raw);

  if (!command) {
    return unknownCommand(raw);
  }

  const { namespace, member, args } = command;

  if (namespace === "help" && !member) {
    return { lines: helpLines(), intent: { kind: "none" } };
  }

  if (namespace === "clear" && !member) {
    return { lines: [], intent: { kind: "clear" } };
  }

  if ((namespace === "exit" || namespace === "quit") && !member) {
    return {
      lines: [line("system", "단말 세션을 종료합니다.")],
      intent: { kind: "close" },
    };
  }

  if (namespace === "whoami" && !member) {
    return {
      lines: [line("output", "guest@control-room (권한 없음 · 인증 필요)")],
      intent: { kind: "none" },
    };
  }

  if (namespace === "cookie") {
    if (member === "list") {
      const views = deps.cookies.list();

      return {
        lines: [
          line("system", `가상 쿠키 ${views.length}건`),
          ...views.map((cookie) =>
            line("output", `  ${cookie.name} = ${cookie.displayValue}`),
          ),
        ],
        intent: { kind: "none" },
      };
    }

    if (member === "get") {
      const name = args[0] ?? "";

      if (name.length === 0) {
        return {
          lines: [line("error", "쿠키 이름을 입력하세요. 예: cookie.get(\"sec.shift\")")],
          intent: { kind: "none" },
        };
      }

      const lookup = deps.cookies.get(name);

      if (!lookup.found) {
        return {
          lines: [line("error", `쿠키를 찾을 수 없습니다: ${name}`)],
          intent: { kind: "none" },
        };
      }

      const lines = [line("output", `${name} = ${lookup.value}`)];

      if (lookup.firstReveal) {
        lines.push(line("success", "마스킹이 해제되어 쿠키 탭에도 표시됩니다."));
      }

      return { lines, intent: { kind: "none" } };
    }
  }

  if (namespace === "net" && member === "list") {
    return {
      lines: [
        line("system", `가상 네트워크 로그 ${deps.network.length}건`),
        ...deps.network.map((entry) =>
          line(
            "output",
            `  ${entry.status} ${entry.method} ${entry.path} — ${entry.summary}`,
          ),
        ),
      ],
      intent: { kind: "none" },
    };
  }

  if (namespace === "otp") {
    if (member === "rule") {
      return {
        lines: [
          line("system", "OTP 파생 규칙"),
          ...describeControlRoomOtpRule().map((text) => line("output", `  ${text}`)),
        ],
        intent: { kind: "none" },
      };
    }

    if (member === "verify") {
      const code = args[0] ?? "";

      if (code.length === 0) {
        return {
          lines: [line("error", "인증 코드를 입력하세요. 예: otp.verify(\"000000\")")],
          intent: { kind: "none" },
        };
      }

      return { lines: [], intent: { kind: "verify-otp", code } };
    }
  }

  if (namespace === "lockdown") {
    const { verified, released } = deps.lockdown();

    if (member === "status") {
      return {
        lines: [
          line(
            released ? "success" : "warning",
            released
              ? "sec.lockdown = released — 문서 보관실 접근 가능"
              : "sec.lockdown = engaged — 문서 보관실 봉쇄 중",
          ),
          line("output", `  인증 상태: ${verified ? "통과" : "미인증"}`),
        ],
        intent: { kind: "none" },
      };
    }

    if (member === "release") {
      if (!verified) {
        return {
          lines: [
            line("error", "401 OTP_REQUIRED — 인증을 먼저 통과해야 합니다."),
          ],
          intent: { kind: "none" },
        };
      }

      return { lines: [], intent: { kind: "release-lockdown" } };
    }
  }

  return unknownCommand(raw);
}

/**
 * 가상 콘솔 출력 버퍼.
 *
 * 전역 console을 대체하지 않으며 오직 가짜 DevTools 화면 렌더링에만 쓰인다.
 */
export class VirtualConsoleBuffer {
  private lines: VirtualConsoleLine[] = [];
  private readonly maxLines: number;

  constructor(maxLines: number = VIRTUAL_CONSOLE_MAX_LINES) {
    this.maxLines = maxLines;
  }

  /** 현재 버퍼를 읽기 전용으로 반환한다. */
  snapshot(): readonly VirtualConsoleLine[] {
    return this.lines;
  }

  /** 여러 줄을 한 번에 추가하고 최대 길이를 넘으면 오래된 줄부터 버린다. */
  push(...entries: readonly VirtualConsoleLine[]): void {
    if (entries.length === 0) {
      return;
    }

    this.lines = [...this.lines, ...entries];

    if (this.lines.length > this.maxLines) {
      this.lines = this.lines.slice(this.lines.length - this.maxLines);
    }
  }

  /** 텍스트 목록을 같은 등급으로 추가한다. */
  pushTexts(
    level: VirtualConsoleLine["level"],
    texts: readonly string[],
  ): void {
    this.push(...texts.map((text) => line(level, text)));
  }

  /** 버퍼를 비운다. */
  clear(): void {
    this.lines = [];
  }
}
