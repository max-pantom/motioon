import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { startProjectServer } from "../packages/server/project.mjs";
import { launchBrowser } from "../packages/renderer/render.mjs";

const fixture = fileURLToPath(
  new URL("./gold/openai-8s/motion.md", import.meta.url),
);

test("Studio shows cataloged audio cues through the shadcn and ElevenLabs panel", async () => {
  const server = await startProjectServer(fixture, { studio: true });
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(server.url);
    await page.locator(".ui-card-title").waitFor();
    assert.equal(
      await page.locator(".ui-card-title").textContent(),
      "Sound cues",
    );
    assert.equal(await page.locator("#sound-cue-select option").count(), 4);
    assert.equal(await page.locator(".ui-waveform canvas").count(), 1);
    await page.locator("#sound-cue-select").selectOption("1");
    await page.getByRole("button", { name: "Play cue preview" }).click();
    assert.equal(await page.locator("#sound-cue-select").inputValue(), "1");
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await server.close();
  }
});

test("Studio export offers sound, silent, and both download choices", async () => {
  const server = await startProjectServer(fixture, { studio: true });
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.route("**/api/render", (route) =>
      route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ id: "sound-choice-test" }),
      }),
    );
    await page.route("**/api/render/sound-choice-test", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "sound-choice-test",
          status: "complete",
          progress: 1,
          result: { frames: 192, seconds: 2 },
        }),
      }),
    );
    await page.goto(server.url);
    await page.locator("#export-open").click();
    await page.locator("#export-audio").selectOption("without");
    await page.locator("#render").click();
    await page.locator("#download-silent").waitFor({ state: "visible" });
    assert.equal(await page.locator("#download").isHidden(), true);
    assert.equal(
      await page.locator("#download-silent").getAttribute("href"),
      "/download/sound-choice-test/silent",
    );
    await page.locator("#export-audio").selectOption("both");
    assert.equal(await page.locator("#download").isVisible(), true);
    assert.equal(await page.locator("#download-silent").isVisible(), true);
    await page.locator("#export-audio").selectOption("with");
    assert.equal(await page.locator("#download-silent").isHidden(), true);
  } finally {
    await browser.close();
    await server.close();
  }
});
