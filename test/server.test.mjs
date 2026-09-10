import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileFile } from "../packages/core/index.mjs";
import { startProjectServer } from "../packages/server/project.mjs";
const source = `---\nwidth: 320\nheight: 180\nfps: 30\nduration: 1\n---\n## Scene: intro (0s-1s)\n<link rel="stylesheet" href="./style.css">\n<h1 data-motion="title">Hello</h1>`;
test("standalone compile keeps raw HTML relative stylesheet and asset references", () => {
  const dir = mkdtempSync(join(tmpdir(), "motioon-compile-"));
  try {
    writeFileSync(join(dir, "motion.md"), source);
    writeFileSync(join(dir, "style.css"), "h1{color:red}");
    mkdirSync(join(dir, "assets"));
    writeFileSync(join(dir, "assets", "data.json"), "{}");
    const out = join(dir, "dist", "composition.html");
    compileFile(join(dir, "motion.md"), out);
    assert.ok(existsSync(out));
    assert.equal(
      readFileSync(join(dir, "dist", "style.css"), "utf8"),
      "h1{color:red}",
    );
    assert.ok(existsSync(join(dir, "dist", "assets", "data.json")));
    compileFile(join(dir, "motion.md"), out);
    assert.ok(!existsSync(join(dir, "dist", "dist")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("local server serves assets, enforces write token, and rejects stale source saves", async () => {
  const dir = mkdtempSync(join(tmpdir(), "motioon-server-"));
  let service;
  try {
    const file = join(dir, "motion.md");
    writeFileSync(file, source);
    writeFileSync(join(dir, "style.css"), "h1{color:red}");
    service = await startProjectServer(file, { studio: true });
    const project = await (await fetch(service.url + "/api/project")).json();
    assert.equal((await fetch(service.url + "/style.css")).status, 200);
    const post = (data, headers = {}) =>
      fetch(service.url + "/api/source", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-motion-token": project.token,
          ...headers,
        },
        body: JSON.stringify(data),
      });
    assert.equal((await post({ source, revision: "stale" })).status, 409);
    assert.equal(
      (await post({ source: "broken", revision: project.revision })).status,
      400,
    );
    assert.equal(
      (
        await post(
          { source, revision: project.revision },
          { origin: "https://example.com" },
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await post({
          source: source.replace("Hello", "Changed"),
          revision: project.revision,
        })
      ).status,
      200,
    );
    assert.match(readFileSync(file, "utf8"), /Changed/);
  } finally {
    await service?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
