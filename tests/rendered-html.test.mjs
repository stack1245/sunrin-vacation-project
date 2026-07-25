import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the escape landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>The Escape<\/title>/i);
  assert.match(html, /게임을 시작하기/);
  assert.match(html, /href="\/stages"/);
  assert.match(html, /INTERACTIVE MYSTERY ARCHIVE/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("contains the requested game scaffolding and integrations", async () => {
  const [types, store, supabase, gamePage, packageJson, hosting] =
    await Promise.all([
      readFile(new URL("src/types/game.ts", projectRoot), "utf8"),
      readFile(new URL("src/store/useGameStore.ts", projectRoot), "utf8"),
      readFile(new URL("src/lib/supabaseClient.ts", projectRoot), "utf8"),
      readFile(new URL("src/app/stages/[id]/page.tsx", projectRoot), "utf8"),
      readFile(new URL("package.json", projectRoot), "utf8"),
      readFile(new URL(".openai/hosting.json", projectRoot), "utf8"),
    ]);

  assert.match(types, /interface Stage/);
  assert.match(types, /interface UserProgress/);
  assert.match(types, /interface InventoryItem/);
  assert.match(store, /create<GameState>/);
  assert.match(store, /useAttempt/);
  assert.match(store, /isAlarmActive/);
  assert.match(supabase, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(supabase, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(gamePage, /<GameHeader \/>/);
  assert.match(gamePage, /<PuzzleArea \/>/);
  assert.match(gamePage, /<Inventory \/>/);
  assert.match(packageJson, /"zustand"/);
  assert.match(packageJson, /"@supabase\/supabase-js"/);
  assert.match(hosting, /"project_id"/);

  await assert.rejects(access(new URL("app/page.tsx", projectRoot)));
});
