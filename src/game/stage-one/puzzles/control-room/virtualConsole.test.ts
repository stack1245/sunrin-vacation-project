import assert from "node:assert/strict";
import test from "node:test";

import {
  CONTROL_ROOM_COOKIES,
  CONTROL_ROOM_NETWORK_ENTRIES,
} from "./puzzleData.ts";
import {
  executeVirtualCommand,
  parseVirtualCommand,
  VirtualConsoleBuffer,
  VIRTUAL_CONSOLE_MAX_LINES,
  type VirtualConsoleDeps,
} from "./virtualConsole.ts";
import { VirtualCookieJar } from "./virtualCookieJar.ts";

function createDeps(
  lockdown = { verified: false, released: false },
): VirtualConsoleDeps {
  return {
    cookies: new VirtualCookieJar(CONTROL_ROOM_COOKIES),
    network: CONTROL_ROOM_NETWORK_ENTRIES,
    lockdown: () => lockdown,
  };
}

test("명령 파서가 네임스페이스·멤버·인자를 분리한다", () => {
  assert.deepEqual(parseVirtualCommand('cookie.get("sec.shift")'), {
    namespace: "cookie",
    member: "get",
    args: ["sec.shift"],
    called: true,
  });
  assert.deepEqual(parseVirtualCommand("help"), {
    namespace: "help",
    member: null,
    args: [],
    called: false,
  });
  assert.equal(parseVirtualCommand("!!!invalid###"), null);
});

test("따옴표 종류와 공백을 인자에서 정리한다", () => {
  const single = parseVirtualCommand("otp.verify('123456')");
  const backtick = parseVirtualCommand("otp.verify(`123456`)");
  const bare = parseVirtualCommand("otp.verify( 123456 )");

  assert.deepEqual(single?.args, ["123456"]);
  assert.deepEqual(backtick?.args, ["123456"]);
  assert.deepEqual(bare?.args, ["123456"]);
});

test("help는 사용 가능한 명령 목록을 출력한다", () => {
  const { lines, intent } = executeVirtualCommand("help", createDeps());
  const merged = lines.map((line) => line.text).join("\n");

  assert.equal(intent.kind, "none");
  assert.ok(merged.includes("cookie.get"));
  assert.ok(merged.includes("otp.verify"));
  assert.ok(merged.includes("lockdown.release"));
});

test("알 수 없는 명령은 오류와 도움말 안내를 출력한다", () => {
  const { lines, intent } = executeVirtualCommand("hack.everything()", createDeps());

  assert.equal(intent.kind, "none");
  assert.equal(lines[0].level, "error");
});

test("cookie.list()는 마스킹 상태를 유지한 채 출력한다", () => {
  const { lines } = executeVirtualCommand("cookie.list()", createDeps());
  const merged = lines.map((line) => line.text).join("\n");

  assert.ok(merged.includes("sec.shift = 7"));
  assert.ok(!merged.includes("0x1A4"), "마스킹된 시드가 목록에 노출되었습니다.");
});

test("cookie.get()은 마스킹을 해제하고 최초 해제를 안내한다", () => {
  const deps = createDeps();
  const { lines } = executeVirtualCommand('cookie.get("sec.session")', deps);
  const merged = lines.map((line) => line.text).join("\n");

  assert.ok(merged.includes("sec.session = 0x1A4"));
  assert.ok(lines.some((line) => line.level === "success"));
  assert.equal(deps.cookies.isRevealed("sec.session"), true);
});

test("net.list()는 모든 가상 요청 로그를 출력한다", () => {
  const { lines } = executeVirtualCommand("net.list()", createDeps());
  const merged = lines.map((line) => line.text).join("\n");

  for (const entry of CONTROL_ROOM_NETWORK_ENTRIES) {
    assert.ok(merged.includes(entry.path));
  }
});

test("otp.verify()는 검증 intent만 반환하고 직접 판정하지 않는다", () => {
  const { intent } = executeVirtualCommand('otp.verify("123456")', createDeps());

  assert.deepEqual(intent, { kind: "verify-otp", code: "123456" });
});

test("미인증 상태의 lockdown.release()는 거부한다", () => {
  const { lines, intent } = executeVirtualCommand(
    "lockdown.release()",
    createDeps({ verified: false, released: false }),
  );

  assert.equal(intent.kind, "none");
  assert.ok(lines[0].text.includes("OTP_REQUIRED"));
});

test("인증 후 lockdown.release()는 해제 intent를 반환한다", () => {
  const { intent } = executeVirtualCommand(
    "lockdown.release()",
    createDeps({ verified: true, released: false }),
  );

  assert.deepEqual(intent, { kind: "release-lockdown" });
});

test("lockdown.status()는 인증·해제 상태를 반영한다", () => {
  const before = executeVirtualCommand(
    "lockdown.status()",
    createDeps({ verified: false, released: false }),
  );
  const after = executeVirtualCommand(
    "lockdown.status()",
    createDeps({ verified: true, released: true }),
  );

  assert.ok(before.lines[0].text.includes("engaged"));
  assert.ok(after.lines[0].text.includes("released"));
});

test("clear와 exit는 각각 비우기·닫기 intent를 반환한다", () => {
  assert.equal(executeVirtualCommand("clear", createDeps()).intent.kind, "clear");
  assert.equal(executeVirtualCommand("exit", createDeps()).intent.kind, "close");
});

test("버퍼는 최대 줄 수를 넘기면 오래된 줄부터 버린다", () => {
  const buffer = new VirtualConsoleBuffer();

  for (let index = 0; index < VIRTUAL_CONSOLE_MAX_LINES + 25; index += 1) {
    buffer.push({ level: "output", text: `line-${index}` });
  }

  const snapshot = buffer.snapshot();

  assert.equal(snapshot.length, VIRTUAL_CONSOLE_MAX_LINES);
  assert.equal(snapshot[0].text, "line-25");
  assert.equal(
    snapshot[snapshot.length - 1].text,
    `line-${VIRTUAL_CONSOLE_MAX_LINES + 24}`,
  );
});
