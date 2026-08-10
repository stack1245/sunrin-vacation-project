/**
 * E 파트 · 가상 쿠키 저장소
 *
 * 게임 내부 전용 메모리 저장소다. 실제 `document.cookie`, `localStorage`,
 * `sessionStorage`, `indexedDB` 를 읽거나 쓰지 않으며 브라우저 API를 참조하지 않는다.
 * 인스턴스가 사라지면 값도 함께 사라지고 진행도 저장에도 포함되지 않는다.
 *
 * 마스킹된 쿠키는 목록에서 값이 가려져 있고, 콘솔에서 `cookie.get(name)` 으로
 * 한 번 열람해야 목록에도 평문으로 나타난다. 탐색 동선을 만들기 위한 장치다.
 */

import type { VirtualCookie } from "./types.ts";

/** 목록 표시에 필요한 형태로 가공된 가상 쿠키. */
export interface VirtualCookieView {
  readonly name: string;
  /** 마스킹 상태면 가려진 문자열, 열람했으면 실제 값. */
  readonly displayValue: string;
  readonly note: string;
  readonly masked: boolean;
  readonly revealed: boolean;
}

/** `cookie.get()` 조회 결과. */
export type VirtualCookieLookup =
  | { readonly found: true; readonly value: string; readonly firstReveal: boolean }
  | { readonly found: false };

const MASK = "••••••";

export class VirtualCookieJar {
  private readonly cookies: ReadonlyMap<string, VirtualCookie>;
  private readonly order: readonly string[];
  private readonly revealed = new Set<string>();

  constructor(cookies: readonly VirtualCookie[]) {
    const entries = new Map<string, VirtualCookie>();

    for (const cookie of cookies) {
      entries.set(cookie.name, cookie);
    }

    this.cookies = entries;
    this.order = cookies.map((cookie) => cookie.name);
  }

  /** 쿠키 탭에 표시할 전체 목록을 선언 순서대로 반환한다. */
  list(): readonly VirtualCookieView[] {
    return this.order.map((name) => {
      const cookie = this.cookies.get(name);

      if (!cookie) {
        return {
          name,
          displayValue: MASK,
          note: "",
          masked: true,
          revealed: false,
        };
      }

      const masked = cookie.masked === true;
      const revealed = this.revealed.has(name);

      return {
        name: cookie.name,
        displayValue: masked && !revealed ? MASK : cookie.value,
        note: cookie.note,
        masked,
        revealed,
      };
    });
  }

  /** 이름으로 값을 조회하고, 마스킹된 쿠키라면 이후 목록에서도 열람 상태로 바꾼다. */
  get(name: string): VirtualCookieLookup {
    const key = name.trim();
    const cookie = this.cookies.get(key);

    if (!cookie) {
      return { found: false };
    }

    const firstReveal = cookie.masked === true && !this.revealed.has(key);

    if (cookie.masked === true) {
      this.revealed.add(key);
    }

    return { found: true, value: cookie.value, firstReveal };
  }

  /** 쿠키 존재 여부만 확인한다. 열람 상태를 바꾸지 않는다. */
  has(name: string): boolean {
    return this.cookies.has(name.trim());
  }

  /** 마스킹된 쿠키가 이미 열람되었는지 확인한다. */
  isRevealed(name: string): boolean {
    return this.revealed.has(name.trim());
  }

  /** 단말을 다시 열었을 때 탐색을 처음부터 시작하도록 열람 상태를 되돌린다. */
  resetReveals(): void {
    this.revealed.clear();
  }
}
