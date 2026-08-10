import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const STAGE_ONE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_ROOT = path.resolve(STAGE_ONE_ROOT, "../..");
const INFRASTRUCTURE_IMPORT_PREFIXES = [
  "@supabase/",
  "@/lib/supabase/",
  "@/services/",
] as const;
const INFRASTRUCTURE_SOURCE_PATHS = ["lib/supabase/", "services/"] as const;
const IMPORT_SOURCE_PATTERN =
  /(?:\bfrom\s+|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g;

async function collectStageOneSourceFiles(
  directoryPath: string,
): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== "adapters") {
        files.push(...(await collectStageOneSourceFiles(entryPath)));
      }
      continue;
    }

    if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".test.tsx")
    ) {
      files.push(entryPath);
    }
  }

  return files;
}

function collectImportSources(source: string): string[] {
  return [...source.matchAll(IMPORT_SOURCE_PATTERN)].map((match) => match[1]);
}

function targetsInfrastructure(filePath: string, importSource: string): boolean {
  if (
    INFRASTRUCTURE_IMPORT_PREFIXES.some((prefix) =>
      importSource.startsWith(prefix),
    )
  ) {
    return true;
  }

  if (!importSource.startsWith(".")) {
    return false;
  }

  const resolvedImportPath = path.resolve(path.dirname(filePath), importSource);
  const sourceRelativePath = path
    .relative(SOURCE_ROOT, resolvedImportPath)
    .replaceAll("\\", "/");

  return INFRASTRUCTURE_SOURCE_PATHS.some((sourcePath) =>
    sourceRelativePath.startsWith(sourcePath),
  );
}

test("Stage 1 도메인과 게임 코어는 인프라를 직접 참조하지 않는다", async () => {
  const productionFiles = await collectStageOneSourceFiles(STAGE_ONE_ROOT);
  const violations: string[] = [];

  for (const filePath of productionFiles) {
    const source = await readFile(filePath, "utf8");

    for (const importSource of collectImportSources(source)) {
      if (targetsInfrastructure(filePath, importSource)) {
        violations.push(
          `${path.relative(STAGE_ONE_ROOT, filePath)} → ${importSource}`,
        );
      }
    }
  }

  assert.deepEqual(violations, []);
});
