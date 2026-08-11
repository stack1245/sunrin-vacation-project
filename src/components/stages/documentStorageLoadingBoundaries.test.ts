import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const COMPONENT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const DOCUMENT_STORAGE_IMPORT_PREFIX =
  "@/game/stage-one/puzzles/document-storage";
const DOCUMENT_STORAGE_PUZZLE_HOSTS = [
  ["AgoGameHost.tsx", "agoPuzzleScene"],
  ["MathdokuGameHost.tsx", "mathdokuPuzzleScene"],
  ["NQueensGameHost.tsx", "nQueensPuzzleScene"],
  ["ResourceAllocationGameHost.tsx", "resourceAllocationPuzzleScene"],
  ["TtfGameHost.tsx", "ttfPuzzleScene"],
] as const;

async function readComponent(fileName: string): Promise<string> {
  return readFile(path.join(COMPONENT_DIRECTORY, fileName), "utf8");
}

test("문서 보관실 퍼즐 호스트는 선택되기 전까지 지연 로드한다", async () => {
  const modalSource = await readComponent("DocumentStoragePuzzleModal.tsx");

  for (const [hostFileName] of DOCUMENT_STORAGE_PUZZLE_HOSTS) {
    const componentName = hostFileName.replace(/\.tsx$/u, "");

    assert.match(
      modalSource,
      new RegExp(`dynamic\\([\\s\\S]*import\\(\"\\./${componentName}\"\\)`, "u"),
      `${componentName}은(는) 동적 import 경계 안에 있어야 합니다.`,
    );
    assert.doesNotMatch(
      modalSource,
      new RegExp(`import\\s+${componentName}\\s+from`, "u"),
      `${componentName}을(를) 정적으로 불러오면 초기 Phaser 번들이 중복됩니다.`,
    );
  }
});

test("각 퍼즐 호스트는 배럴 대신 자신의 Scene만 직접 참조한다", async () => {
  for (const [hostFileName, sceneModuleName] of
    DOCUMENT_STORAGE_PUZZLE_HOSTS) {
    const hostSource = await readComponent(hostFileName);

    assert.match(
      hostSource,
      new RegExp(
        `from \"${DOCUMENT_STORAGE_IMPORT_PREFIX}/${sceneModuleName}\"`,
        "u",
      ),
    );
    assert.doesNotMatch(
      hostSource,
      new RegExp(`from \"${DOCUMENT_STORAGE_IMPORT_PREFIX}\"`, "u"),
      `${hostFileName}에서 배럴을 참조하면 다른 퍼즐까지 함께 포함될 수 있습니다.`,
    );
  }
});

test("공통 Phaser 호스트는 이벤트 계약만 직접 참조한다", async () => {
  const hostSource = await readComponent("PhaserPuzzleHost.tsx");

  assert.match(
    hostSource,
    new RegExp(
      `from \"${DOCUMENT_STORAGE_IMPORT_PREFIX}/documentStoragePuzzleEvents\"`,
      "u",
    ),
  );
  assert.doesNotMatch(
    hostSource,
    new RegExp(`from \"${DOCUMENT_STORAGE_IMPORT_PREFIX}\"`, "u"),
  );
});
