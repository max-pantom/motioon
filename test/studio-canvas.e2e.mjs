import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startProjectServer } from "../packages/server/project.mjs";
import { launchBrowser } from "../packages/renderer/render.mjs";

test("Studio quick-edits source colors and drags a layer on canvas", async () => {
  const dir = mkdtempSync(join(tmpdir(), "motion-canvas-"));
  const file = join(dir, "motion.md");
  writeFileSync(
    file,
    `---\nversion: 1\nwidth: 320\nheight: 180\nfps: 24\nduration: 2\nbackground: "#ffffff"\n---\n\n## scene: title\n\`\`\`motion\nkind: card\nduration: 2\nelements:\n  - id: word\n    type: text\n    text: Move me\n    color: "#111111"\n    font_size: 38\n    x: 50%\n    y: 50%\n\`\`\`\n`,
  );
  let server;
  let browser;
  try {
    server = await startProjectServer(file, { studio: true });
    browser = await launchBrowser();
    const page = await browser.newPage({
      viewport: { width: 1280, height: 850 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(server.url);
    await page.waitForFunction(() => window.motioonComposition?.scenes?.length);
    await page.locator("#source-open").click();
    const source = page.locator("#source-text");
    assert.match(await source.inputValue(), /#111111/);
    await page.locator('[data-color="#111111"]').click();
    assert.equal(
      await page.locator("#source-hint").textContent(),
      "Line 18 · color",
    );
    await page.locator("#source-value").fill("#FF4400");
    await page.locator("#source-apply").click();
    assert.match(await source.inputValue(), /color: "#FF4400"/);
    assert.match(
      await page.locator("#source-highlight").innerHTML(),
      /syntax-color/,
    );
    await page.locator("#source-save").click();
    await page.locator("#source-dialog").waitFor({ state: "hidden" });
    assert.match(readFileSync(file, "utf8"), /color: "#FF4400"/);

    await page.locator("#canvas-mode").click();
    const layer = page
      .frameLocator("#composition")
      .locator('[data-motion-id="word"]');
    await layer.waitFor();
    const box = await layer.boundingBox();
    const frame = await page.locator("#composition").boundingBox();
    const scale = frame.width / 320;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 30 * scale, cy + 10 * scale, { steps: 4 });
    await page.mouse.up();
    await page.waitForFunction(() =>
      document
        .querySelector("#status")
        ?.textContent?.includes("moved and saved"),
    );
    const updated = readFileSync(file, "utf8");
    const x = Number(/\bx: ([\d.]+)%/.exec(updated)?.[1]);
    const y = Number(/\by: ([\d.]+)%/.exec(updated)?.[1]);
    assert.ok(x > 57 && x < 61, `x moved to ${x}%`);
    assert.ok(y > 54 && y < 58, `y moved to ${y}%`);
    assert.deepEqual(errors, []);
  } finally {
    if (browser) await browser.close();
    if (server) await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
