import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { build } from "esbuild";

test("shadcn Studio shell builds and exposes every editor control", async () => {
  const shell = readFileSync(
    new URL("../packages/studio/studio-shell.jsx", import.meta.url),
    "utf8",
  );
  const editor = readFileSync(
    new URL("../packages/studio/studio.js", import.meta.url),
    "utf8",
  );
  const ids = new Set([...shell.matchAll(/\bid="([\w-]+)"/g)].map((m) => m[1]));
  const dynamic = new Set([
    "playhead",
    "discard",
    "html-edit",
    "property-error",
    "source-apply",
    "source-value",
    "source-color-input",
  ]);
  const used = new Set(
    [...editor.matchAll(/\$\("([\w-]+)"\)/g)].map((m) => m[1]),
  );
  assert.deepEqual(
    [...used].filter((id) => !ids.has(id) && !dynamic.has(id)),
    [],
  );
  const output = await build({
    entryPoints: [
      new URL("../packages/studio/studio-shell.jsx", import.meta.url).pathname,
    ],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
  });
  assert.ok(output.outputFiles[0].contents.length > 0);
});
