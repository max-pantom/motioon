import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { tmpdir } from "node:os";
import { ffmpegPath } from "../renderer/render.mjs";

function durationOf(file) {
  const result = spawnSync(ffmpegPath, ["-hide_banner", "-i", file], {
    encoding: "utf8",
  });
  const match = result.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  if (!match)
    throw new Error(`Could not read captured video duration: ${file}`);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

export async function captureProduct(
  file,
  {
    url,
    out = "assets/ui/capture.webm",
    id = "ui.capture",
    flow,
    seconds = 2,
    width = 1440,
    height = 900,
  } = {},
) {
  const root = dirname(resolve(file));
  if (!url || !/^https?:\/\//.test(url))
    throw new Error("Capture needs an http(s) URL.");
  if (!/^[\w.-]+$/.test(id))
    throw new Error(
      "Capture id must use letters, digits, dots, dashes or underscores.",
    );
  if (
    extname(out) !== ".webm" ||
    isAbsolute(out) ||
    relative(root, resolve(root, out)).startsWith("..")
  )
    throw new Error("Capture output must be a project-local .webm path.");
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 60)
    throw new Error("Capture seconds must be 0–60.");
  if (![width, height].every((n) => Number.isInteger(n) && n > 0 && n <= 3840))
    throw new Error(
      "Capture width and height must be positive integers up to 3840.",
    );
  const steps = flow ? JSON.parse(readFileSync(resolve(flow), "utf8")) : [];
  if (!Array.isArray(steps))
    throw new Error("Capture flow must be a JSON array.");
  const path = resolve(root, out);
  if (existsSync(path))
    throw new Error(`Capture output already exists: ${path}`);
  const catalogPath = join(root, "assets", "catalog.json");
  const catalog = existsSync(catalogPath)
    ? JSON.parse(readFileSync(catalogPath, "utf8"))
    : {};
  if (Object.hasOwn(catalog, id))
    throw new Error(`Catalog id already exists: ${id}`);
  mkdirSync(dirname(path), { recursive: true });
  const recordingDir = mkdtempSync(join(tmpdir(), "motioon-capture-"));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      recordVideo: { dir: recordingDir, size: { width, height } },
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    for (const step of steps) {
      if (step.wait != null)
        await page.waitForTimeout(
          Math.min(10000, Math.max(0, Number(step.wait))),
        );
      else if (step.click) await page.locator(step.click).click();
      else if (step.type)
        await page.locator(step.type.selector).fill(String(step.type.text));
      else if (step.press) await page.keyboard.press(step.press);
      else if (step.scroll)
        await page.mouse.wheel(
          Number(step.scroll.x || 0),
          Number(step.scroll.y || 0),
        );
      else if (step.goto)
        await page.goto(step.goto, { waitUntil: "domcontentloaded" });
      else throw new Error(`Unknown capture step: ${JSON.stringify(step)}`);
    }
    if (seconds) await page.waitForTimeout(seconds * 1000);
    const video = page.video();
    await page.close();
    await video.saveAs(path);
    await context.close();
    const dur = durationOf(path);
    catalog[id] = {
      src: relative(root, path),
      kind: "video",
      dur: Number(dur.toFixed(3)),
      w: width,
      h: height,
    };
    mkdirSync(dirname(catalogPath), { recursive: true });
    writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
    return { file: path, id, duration: dur, catalog: catalogPath };
  } finally {
    await browser?.close();
    rmSync(recordingDir, { recursive: true, force: true });
  }
}
