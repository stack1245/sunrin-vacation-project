import { readFile } from "node:fs/promises";
import path from "node:path";

const ENVIRONMENT_ASSIGNMENT_PATTERN =
  /^(\s*(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=\s*)(.*)$/;

function hideEnvironmentValues(contents) {
  return contents
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(ENVIRONMENT_ASSIGNMENT_PATTERN);
      return match ? `${match[1]}<VALUE>` : line;
    })
    .join("\n");
}

async function readEnvironmentStructure(filePath) {
  const contents = await readFile(filePath, "utf8");
  return hideEnvironmentValues(contents);
}

const projectRoot = process.cwd();
const examplePath = path.join(projectRoot, ".env.example");
const localPath = path.join(projectRoot, ".env.local");

try {
  const [exampleStructure, localStructure] = await Promise.all([
    readEnvironmentStructure(examplePath),
    readEnvironmentStructure(localPath),
  ]);

  if (exampleStructure !== localStructure) {
    throw new Error(
      ".env.local과 .env.example은 값 외의 변수명, 순서, 주석, 공백이 같아야 합니다.",
    );
  }

  console.log("환경변수 파일 구조가 값 외에는 완전히 일치합니다.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`환경변수 구조 검사 실패: ${message}`);
  process.exitCode = 1;
}
