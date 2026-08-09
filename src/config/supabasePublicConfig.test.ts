import assert from "node:assert/strict";
import test from "node:test";

import { resolveSupabasePublicConfig } from "./supabasePublicConfig.ts";

test("Supabase 공개 설정의 앞뒤 공백을 제거한다", () => {
  assert.deepEqual(
    resolveSupabasePublicConfig({
      url: "  https://project.supabase.co  ",
      publishableKey: "  sb_publishable_example  ",
    }),
    {
      url: "https://project.supabase.co",
      publishableKey: "sb_publishable_example",
    },
  );
});

test("publishable key가 없으면 기존 anon key를 사용한다", () => {
  assert.deepEqual(
    resolveSupabasePublicConfig({
      url: "https://project.supabase.co",
      legacyAnonKey: "legacy-anon-key",
    }),
    {
      url: "https://project.supabase.co",
      publishableKey: "legacy-anon-key",
    },
  );
});

test("publishable key가 있으면 기존 anon key보다 우선한다", () => {
  assert.equal(
    resolveSupabasePublicConfig({
      url: "https://project.supabase.co",
      publishableKey: "preferred-key",
      legacyAnonKey: "legacy-key",
    })?.publishableKey,
    "preferred-key",
  );
});

test("URL 또는 키가 비어 있으면 설정되지 않은 상태로 처리한다", () => {
  assert.equal(resolveSupabasePublicConfig({ publishableKey: "key" }), null);
  assert.equal(
    resolveSupabasePublicConfig({
      url: "https://project.supabase.co",
      publishableKey: "   ",
    }),
    null,
  );
});
