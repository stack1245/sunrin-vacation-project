import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SOURCE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const AUTHENTICATION_SOURCE_DIRECTORIES = [
  "app/auth",
  "app/login",
  "app/signup",
  "components/auth",
  "components/common",
  "components/home",
  "config",
  "lib/auth",
  "lib/supabase",
] as const;
const FORBIDDEN_STAGE_IMPORT_PREFIXES = [
  "@/components/stages",
  "@/game/",
  "@/services/progress",
  "@/types/stage",
] as const;
const FORBIDDEN_STAGE_SOURCE_PATHS = [
  "components/stages/",
  "game/",
  "services/progress/",
  "types/stage",
] as const;
const IMPORT_SOURCE_PATTERN =
  /(?:\bfrom\s+|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g;

async function collectTypeScriptSourceFiles(
  directoryPath: string,
): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptSourceFiles(entryPath)));
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

function targetsStageImplementation(
  filePath: string,
  importSource: string,
): boolean {
  if (
    FORBIDDEN_STAGE_IMPORT_PREFIXES.some((prefix) =>
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

  return FORBIDDEN_STAGE_SOURCE_PATHS.some((sourcePath) =>
    sourceRelativePath.startsWith(sourcePath),
  );
}

test("main 인증 경계는 Stage 구현을 직접 참조하지 않는다", async () => {
  const authenticationFiles = (
    await Promise.all(
      AUTHENTICATION_SOURCE_DIRECTORIES.map((directoryPath) =>
        collectTypeScriptSourceFiles(path.join(SOURCE_ROOT, directoryPath)),
      ),
    )
  ).flat();
  const violations: string[] = [];

  for (const filePath of authenticationFiles) {
    const source = await readFile(filePath, "utf8");

    for (const importSource of collectImportSources(source)) {
      if (targetsStageImplementation(filePath, importSource)) {
        violations.push(
          `${path.relative(SOURCE_ROOT, filePath)} → ${importSource}`,
        );
      }
    }
  }

  assert.deepEqual(violations, []);
});
