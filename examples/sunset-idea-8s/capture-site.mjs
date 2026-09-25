import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "assets", "site");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
await page.goto(process.env.SUNSET_URL ?? "http://127.0.0.1:3000/", {
  waitUntil: "domcontentloaded",
});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2500);
await page.screenshot({ path: join(out, "homepage.png") });
const projectTitle = process.env.SUNSET_PROJECT ?? "Nomo";
const projectLink = page
  .locator('a[href*="/listings/"]')
  .filter({ hasText: projectTitle })
  .first();
const href = (await projectLink.count())
  ? await projectLink.getAttribute("href")
  : null;
let card = null;
if (href) {
  const cardElement = projectLink.locator("xpath=ancestor::article[1]");
  card = await cardElement.boundingBox();
  await cardElement.hover();
  await page.waitForTimeout(250);
  await cardElement.screenshot({ path: join(out, "project-card-hover.png") });
}
const homeInfo = await page.evaluate(() => ({
  title: document.title,
  viewport: { width: innerWidth, height: innerHeight },
  headings: [...document.querySelectorAll("h1,h2")].map((el) =>
    el.textContent?.trim(),
  ),
  listingLinks: [...document.querySelectorAll('a[href*="/listings/"]')]
    .slice(0, 12)
    .map((el) => ({
      text: el.textContent?.trim(),
      href: el.getAttribute("href"),
    })),
  images: [...document.images]
    .slice(0, 12)
    .map((el) => ({
      alt: el.alt,
      loaded: el.complete && el.naturalWidth > 0,
      width: el.naturalWidth,
      src: el.currentSrc.slice(0, 160),
    })),
}));
let project = { title: projectTitle, href, card, status: "unavailable" };
if (href) {
  const response = await page.goto(new URL(href, page.url()).toString(), {
    waitUntil: "domcontentloaded",
  });
  await page.evaluate(() => document.fonts.ready);
  if (
    response?.ok() &&
    (await page.getByRole("heading", { name: projectTitle }).count())
  ) {
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(out, "project.png") });
    project = { title: projectTitle, href, card, status: "captured" };
  } else {
    project = { href, status: response?.status() ?? "unavailable" };
  }
}
writeFileSync(
  join(out, "capture.json"),
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      source: process.env.SUNSET_URL ?? "http://127.0.0.1:3000/",
      homeInfo,
      project,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ homeInfo, project }, null, 2));
await browser.close();
