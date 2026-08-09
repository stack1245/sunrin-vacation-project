import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const STAGE_ONE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const FORBIDDEN_INFRASTRUCTURE_IMPORTS = [
  "@supabase/",
  "@/lib/supabase/",
  "@/services/",
] as const;

async function collectProductionTypeScriptFiles(
  directoryPath: string,
): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== "adapters") {
        files.push(...(await collectProductionTypeScriptFiles(entryPath)));
      }
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts")
    ) {
      files.push(entryPath);
    }
  }

  return files;
}

test("Stage 1 도메인과 게임 코어는 인프라를 직접 참조하지 않는다", async () => {
  const productionFiles =
    await collectProductionTypeScriptFiles(STAGE_ONE_ROOT);
  const violations: string[] = [];

  for (const filePath of productionFiles) {
    const source = await readFile(filePath, "utf8");

    for (const forbiddenImport of FORBIDDEN_INFRASTRUCTURE_IMPORTS) {
      if (source.includes(forbiddenImport)) {
        violations.push(
          `${path.relative(STAGE_ONE_ROOT, filePath)} → ${forbiddenImport}`,
        );
      }
    }
  }

  assert.deepEqual(violations, []);
});
