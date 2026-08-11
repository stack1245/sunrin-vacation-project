import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { getStageOneBackdropTextureKey, STAGE_ONE_ENVIRONMENT_ASSETS } from "./environmentAssets.ts";

test("환경 에셋 키와 경로는 중복되지 않고 실제 파일을 가리킨다", () => {
  const assets = Object.values(STAGE_ONE_ENVIRONMENT_ASSETS);
  const keys = assets.map((asset) => asset.key);
  const paths = assets.map((asset) => asset.path);

  assert.equal(new Set(keys).size, keys.length);
  assert.equal(new Set(paths).size, paths.length);

  for (const assetPath of paths) {
    assert.equal(existsSync(path.join(process.cwd(), "public", assetPath)), true);
  }
});

test("연구소 외부와 내부는 서로 다른 배경을 사용한다", () => {
  assert.equal(getStageOneBackdropTextureKey("outside"), STAGE_ONE_ENVIRONMENT_ASSETS.exteriorBackdrop.key);
  assert.equal(getStageOneBackdropTextureKey("science-lab"), STAGE_ONE_ENVIRONMENT_ASSETS.interiorBackdrop.key);
});
