import assert from "node:assert/strict";
import test from "node:test";

import { CONTROL_ROOM_COOKIES } from "./puzzleData.ts";
import { VirtualCookieJar } from "./virtualCookieJar.ts";

function createJar(): VirtualCookieJar {
  return new VirtualCookieJar(CONTROL_ROOM_COOKIES);
}

test("선언 순서를 유지한 채 전체 쿠키를 반환한다", () => {
  const names = createJar()
    .list()
    .map((cookie) => cookie.name);

  assert.deepEqual(
    names,
    CONTROL_ROOM_COOKIES.map((cookie) => cookie.name),
  );
});

test("마스킹된 쿠키는 목록에서 값을 가린다", () => {
  const session = createJar()
    .list()
    .find((cookie) => cookie.name === "sec.session");

  assert.ok(session);
  assert.equal(session.masked, true);
  assert.equal(session.revealed, false);
  assert.notEqual(session.displayValue, "0x1A4");
});

test("마스킹되지 않은 쿠키는 값을 그대로 노출한다", () => {
  const shift = createJar()
    .list()
    .find((cookie) => cookie.name === "sec.shift");

  assert.ok(shift);
  assert.equal(shift.displayValue, "7");
});

test("get()으로 열람하면 목록에도 평문으로 나타난다", () => {
  const jar = createJar();
  const lookup = jar.get("sec.session");

  assert.equal(lookup.found, true);
  assert.equal(lookup.found === true && lookup.value, "0x1A4");
  assert.equal(lookup.found === true && lookup.firstReveal, true);
  assert.equal(jar.isRevealed("sec.session"), true);

  const session = jar.list().find((cookie) => cookie.name === "sec.session");

  assert.equal(session?.displayValue, "0x1A4");
  assert.equal(session?.revealed, true);
});

test("두 번째 열람은 최초 열람으로 보고하지 않는다", () => {
  const jar = createJar();

  jar.get("sec.session");
  const second = jar.get("sec.session");

  assert.equal(second.found === true && second.firstReveal, false);
});

test("존재하지 않는 쿠키를 조회하면 미발견을 반환한다", () => {
  const jar = createJar();

  assert.deepEqual(jar.get("sec.unknown"), { found: false });
  assert.equal(jar.has("sec.unknown"), false);
});

test("이름의 앞뒤 공백을 무시한다", () => {
  const jar = createJar();

  assert.equal(jar.get("  sec.shift  ").found, true);
  assert.equal(jar.has(" sec.shift "), true);
});

test("resetReveals()는 열람 상태를 처음으로 되돌린다", () => {
  const jar = createJar();

  jar.get("sec.session");
  jar.resetReveals();

  assert.equal(jar.isRevealed("sec.session"), false);
});
