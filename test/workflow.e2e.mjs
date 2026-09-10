import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  copyFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  launchBrowser,
  inspectFrames,
  renderVideo,
  runFfmpeg,
} from "../packages/renderer/render.mjs";
import { startProjectServer } from "../packages/server/project.mjs";
import { loadComposition } from "../packages/core/index.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const digest = (b) => createHash("sha256").update(b).digest("hex");
const fixture = `---\ntitle: Test composition\nwidth: 320\nheight: 180\nfps: 30\nduration: 1\nbackground: "#ffffff"\n---\n# Direction\nPreserve this brief.\n## scene: intro\n\`\`\`motion\nduration: 1\nelements:\n  - id: title\n    type: text\n    text: Hello\n    color: "#112233"\n    font_size: 30\n    opacity: 0.7\n    enter: fade-up 0.4\n\`\`\`\n`;
function setup() {
  const dir = mkdtempSync(join(tmpdir(), "motioon-e2e-"));
  const file = join(dir, "motion.md");
  writeFileSync(file, fixture);
  return {
    dir,
    file,
    close: () => rmSync(dir, { recursive: true, force: true }),
  };
}
test(
  "deterministic seeking preserves full viewport, opacity and CSS animation state",
  { timeout: 60000 },
  async () => {
    const p = setup();
    try {
      const results = await inspectFrames(p.file, { frames: [20, 0, 20] });
      assert.equal(digest(results[0].buffer), digest(results[2].buffer));
      assert.notEqual(digest(results[0].buffer), digest(results[1].buffer));
      assert.equal(results[0].buffer.readUInt32BE(16), 320);
      assert.equal(results[0].buffer.readUInt32BE(20), 180);
      const service = await startProjectServer(p.file),
        browser = await launchBrowser();
      try {
        const page = await browser.newPage({
          viewport: { width: 320, height: 180 },
        });
        await page.goto(service.url);
        await page.evaluate(() => motion.seekAsync(0.8));
        assert.equal(
          await page
            .locator("[data-id=title]")
            .evaluate((e) => e.style.opacity),
          "0.7",
        );
      } finally {
        await browser.close();
        await service.close();
      }
      const raw = readFileSync(
        new URL("../examples/html-scenes/motion.md", import.meta.url),
        "utf8",
      );
      writeFileSync(p.file, raw);
      const shots = await inspectFrames(p.file, { frames: [10, 60, 10] });
      assert.equal(digest(shots[0].buffer), digest(shots[2].buffer));
      assert.notEqual(digest(shots[0].buffer), digest(shots[1].buffer));
    } finally {
      p.close();
    }
  },
);
test(
  "MP4, WebM, cached frame ranges, and audio produce decodable video",
  { timeout: 120000 },
  async () => {
    const p = setup();
    try {
      await runFfmpeg([
        "-y",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=440:duration=1",
        "-c:a",
        "pcm_s16le",
        join(p.dir, "tone.wav"),
      ]);
      writeFileSync(
        p.file,
        fixture.replace(
          "background:",
          "audio:\n  - src: ./tone.wav\n    at: 0.1\n    volume: 0.5\nbackground:",
        ),
      );
      const first = await renderVideo(p.file, {
        out: join(p.dir, "video.mp4"),
        workers: 2,
      });
      assert.equal(first.frames, 30);
      assert.equal(first.cachedFrames, 0);
      assert.ok(existsSync(first.out));
      const decoded = await runFfmpeg([
        "-i",
        first.out,
        "-map",
        "0:v",
        "-f",
        "framemd5",
        "-",
      ]);
      assert.equal(
        decoded
          .toString()
          .split("\n")
          .filter((l) => l && !l.startsWith("#")).length,
        30,
      );
      const sound = await runFfmpeg([
        "-i",
        first.out,
        "-map",
        "0:a",
        "-f",
        "s16le",
        "-",
      ]);
      assert.ok(sound.length > 10000);
      const second = await renderVideo(p.file, {
        out: join(p.dir, "range.webm"),
        from: 5,
        to: 15,
      });
      assert.equal(second.frames, 10);
      assert.equal(second.cachedFrames, 10);
      const decoded2 = await runFfmpeg([
        "-i",
        second.out,
        "-map",
        "0:v",
        "-f",
        "framemd5",
        "-",
      ]);
      assert.equal(
        decoded2
          .toString()
          .split("\n")
          .filter((l) => l && !l.startsWith("#")).length,
        10,
      );
      writeFileSync(
        p.file,
        readFileSync(p.file, "utf8").replace("text: Hello", "text: Changed"),
      );
      const third = await renderVideo(p.file, {
        out: join(p.dir, "changed.mp4"),
        from: 0,
        to: 2,
      });
      assert.equal(third.cachedFrames, 0);
    } finally {
      p.close();
    }
  },
);
test(
  "Studio saves source, undo/redo persists, export downloads, errors stay visible",
  { timeout: 120000 },
  async () => {
    const p = setup();
    const service = await startProjectServer(p.file, { studio: true });
    const browser = await launchBrowser();
    try {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 960 },
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(service.url);
      await page.waitForSelector("[data-element=title]");
      await page.locator("[data-element=title]").click();
      await page.locator("textarea[name=text]").fill("Saved from Studio");
      await page.getByRole("button", { name: "Save adjustments" }).click();
      await page.waitForFunction(
        () =>
          document.querySelector("#save-state").textContent ===
          "All changes saved",
      );
      assert.equal(
        loadComposition(p.file).scenes[0].elements[0].text,
        "Saved from Studio",
      );
      await page.locator("textarea[name=text]").fill("Unsaved draft");
      await page
        .getByRole("button", { name: "Undo edit", exact: true })
        .click();
      assert.equal(
        await page.locator("textarea[name=text]").inputValue(),
        "Unsaved draft",
      );
      assert.equal(
        loadComposition(p.file).scenes[0].elements[0].text,
        "Saved from Studio",
      );
      await page
        .getByRole("button", { name: "Discard adjustments", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Undo edit", exact: true })
        .click();
      await page.waitForFunction(
        () => document.querySelector("textarea[name=text]").value === "Hello",
      );
      assert.equal(loadComposition(p.file).scenes[0].elements[0].text, "Hello");
      await page
        .getByRole("button", { name: "Redo edit", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          document.querySelector("textarea[name=text]").value ===
          "Saved from Studio",
      );
      await page
        .getByRole("button", { name: "Edit source", exact: true })
        .click();
      await page.locator("#source-text").fill("broken");
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      await page.waitForFunction(
        () => document.querySelector("#source-error").textContent.length > 0,
      );
      assert.match(readFileSync(p.file, "utf8"), /Saved from Studio/);
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: "Export video", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Render video", exact: true })
        .click();
      await page.waitForSelector("#download:not([hidden])", { timeout: 90000 });
      const href = await page.locator("#download").getAttribute("href");
      const download = await fetch(service.url + href);
      assert.equal(download.status, 200);
      assert.ok((await download.arrayBuffer()).byteLength > 1000);
      await page.keyboard.press("Escape");
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(100);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.deepEqual(errors, []);
      const denied = await fetch(service.url + "/api/source", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: fixture }),
      });
      assert.equal(denied.status, 403);
    } finally {
      await browser.close();
      await service.close();
      p.close();
    }
  },
);
test(
  "MCP client negotiates and uses real validation, patch and image tools",
  { timeout: 60000 },
  async () => {
    const p = setup();
    const client = new Client({ name: "motioon-test", version: "1.0" });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [resolve("packages/mcp/server.mjs")],
      env: { ...process.env },
    });
    try {
      await client.connect(transport);
      const { tools } = await client.listTools();
      assert.ok(tools.some((t) => t.name === "motion_render"));
      const valid = await client.callTool({
        name: "motion_validate",
        arguments: { file: p.file },
      });
      assert.equal(JSON.parse(valid.content[0].text).ok, true);
      const patched = await client.callTool({
        name: "motion_patch",
        arguments: {
          file: p.file,
          scene: "intro",
          element: "title",
          set: { text: "From an agent" },
        },
      });
      assert.ok(!patched.isError);
      assert.equal(
        loadComposition(p.file).scenes[0].elements[0].text,
        "From an agent",
      );
      const frames = await client.callTool({
        name: "motion_inspect_frames",
        arguments: { file: p.file, frames: [15] },
      });
      assert.ok(
        frames.content.some(
          (c) => c.type === "image" && c.mimeType === "image/png",
        ),
      );
      const bad = await client.callTool({
        name: "motion_patch",
        arguments: { file: p.file, scene: "missing", set: { duration: 2 } },
      });
      assert.equal(bad.isError, true);
    } finally {
      await client.close();
      p.close();
    }
  },
);
