/**
 * E 파트 · 격리 규칙 정적 검증
 *
 * "가짜 F12·가상 쿠키·가상 콘솔은 실제 브라우저 저장소·개발자 도구 권한과 완전히
 * 분리한다"는 파트 E의 핵심 제약을 소스 텍스트 수준에서 자동 강제한다.
 *
 * 누군가 나중에 실수로 `document.cookie` 나 `localStorage` 를 쓰면 이 테스트가 깨진다.
 */

import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** 검사 대상: 퍼즐 디렉터리 전체 + Room 디렉터리 전체. */
const TARGET_DIRECTORIES = [
  HERE,
  path.resolve(HERE, "../../rooms/control-room"),
];

/** 실제 브라우저 저장소·개발자 도구·전역 콘솔 접근을 나타내는 금지 토큰. */
const FORBIDDEN_BROWSER_TOKENS = [
  "document.cookie",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "console.log",
  "console.warn",
  "console.error",
  "console.info",
  "console.debug",
  "window.open",
  "debugger",
];

/**
 * Supabase 직접 접근 금지 토큰. 저장은 A의 progressBridge 경로로만 흘러야 한다.
 * (테이블·RPC 이름은 대소문자 구분 없이 검사한다.)
 */
const FORBIDDEN_SUPABASE_TOKENS = [
  "supabase",
  "user_stage_progress",
  "user_stage_saves",
  "createclient",
  ".rpc(",
];

/** 퍼즐 디렉터리에서 추가로 금지되는 토큰: Phaser는 타입조차 두지 않는다. */
const FORBIDDEN_PUZZLE_TOKENS = ["phaser"];

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 주석을 제거한 실행 코드만 남긴다.
 *
 * "Supabase를 직접 쓰지 않는다" 같은 문서 주석이 스캔에 걸리지 않도록
 * 라인·블록 주석을 벗겨내되 문자열 리터럴 내용은 유지한다.
 */
function stripComments(source: string): string {
  let result = "";
  let index = 0;
  let stringQuote: string | null = null;

  while (index < source.length) {
    const character = source[index];
    const pair = source.slice(index, index + 2);

    if (stringQuote) {
      result += character;

      if (character === "\\") {
        result += source[index + 1] ?? "";
        index += 2;
        continue;
      }

      if (character === stringQuote) {
        stringQuote = null;
      }

      index += 1;
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      stringQuote = character;
      result += character;
      index += 1;
      continue;
    }

    if (pair === "//") {
      const lineEnd = source.indexOf("\n", index);
      index = lineEnd === -1 ? source.length : lineEnd;
      continue;
    }

    if (pair === "/*") {
      const blockEnd = source.indexOf("*/", index + 2);
      index = blockEnd === -1 ? source.length : blockEnd + 2;
      continue;
    }

    result += character;
    index += 1;
  }

  return result;
}

function findToken(source: string, token: string): boolean {
  return stripComments(source).toLowerCase().includes(token.toLowerCase());
}

test("통제실 코드는 실제 브라우저 저장소·개발자 도구·전역 콘솔을 사용하지 않는다", async () => {
  for (const directory of TARGET_DIRECTORIES) {
    for (const file of await collectSourceFiles(directory)) {
      const source = await readFile(file, "utf8");

      for (const token of FORBIDDEN_BROWSER_TOKENS) {
        assert.ok(
          !findToken(source, token),
          `${path.basename(file)} 이(가) 금지 토큰 "${token}" 을 포함합니다.`,
        );
      }
    }
  }
});

test("통제실 코드는 Supabase 클라이언트·테이블·RPC를 직접 참조하지 않는다", async () => {
  for (const directory of TARGET_DIRECTORIES) {
    for (const file of await collectSourceFiles(directory)) {
      const source = await readFile(file, "utf8");

      for (const token of FORBIDDEN_SUPABASE_TOKENS) {
        assert.ok(
          !findToken(source, token),
          `${path.basename(file)} 이(가) 금지 토큰 "${token}" 을 포함합니다.`,
        );
      }
    }
  }
});

test("퍼즐 도메인 계층은 Phaser를 타입으로도 참조하지 않는다", async () => {
  for (const file of await collectSourceFiles(HERE)) {
    const source = await readFile(file, "utf8");

    for (const token of FORBIDDEN_PUZZLE_TOKENS) {
      assert.ok(
        !findToken(source, token),
        `${path.basename(file)} 이(가) Phaser를 참조합니다. 퍼즐 계층은 순수해야 합니다.`,
      );
    }
  }
});

test("Room 계층의 Phaser 의존은 타입 전용 import뿐이다", async () => {
  const roomDirectory = path.resolve(HERE, "../../rooms/control-room");

  for (const file of await collectSourceFiles(roomDirectory)) {
    const source = await readFile(file, "utf8");
    const runtimeImport = /import\s+(?!type\b)[^;]*from\s+["']phaser["']/;

    assert.ok(
      !runtimeImport.test(source),
      `${path.basename(file)} 이(가) Phaser를 런타임 import합니다. ` +
        "Room 계층은 `import type Phaser` 만 허용됩니다 (동적 로드는 A의 게임 호스트 책임).",
    );
  }
});

test("실제 F12 키(F12/기능키)를 바인딩하지 않는다", async () => {
  for (const directory of TARGET_DIRECTORIES) {
    for (const file of await collectSourceFiles(directory)) {
      const source = await readFile(file, "utf8");

      assert.ok(
        !/["']F12["']/.test(source),
        `${path.basename(file)} 이(가) 실제 F12 키를 바인딩합니다. ` +
          "가짜 DevTools는 게임 내 상호작용(E 키)으로만 열립니다.",
      );
    }
  }
});
