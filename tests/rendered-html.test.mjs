import assert from "node:assert/strict";
import test from "node:test";

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

test("server-renders the OutOfBounds landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /OutOfBounds/);
  assert.match(html, /Break the limits, escape the story/);
  assert.match(html, /GAME START/);
  assert.doesNotMatch(html, /codex-preview/);
});

test("server-renders the stage roadmap", async () => {
  const response = await render("/stages");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /STORY ROADMAP/);
  assert.match(html, /통제실/);
});
