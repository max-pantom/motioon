import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "assets");
mkdirSync(out, { recursive: true });
const base = process.env.SUNSET_URL ?? "http://127.0.0.1:3000/";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: "dark",
  reducedMotion: "reduce",
});
await context.addInitScript(() => localStorage.setItem("sunset-theme", "dark"));
const page = await context.newPage();
const records = [];

async function capture(name) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  const result = {
    name,
    url: page.url(),
    title: await page.title(),
    dark: await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    ),
  };
  await page.screenshot({ path: join(out, `${name}.png`) });
  records.push(result);
  return result;
}

await page.goto(base, { waitUntil: "domcontentloaded" });
await capture("homepage");
const project = page
  .locator('a[href*="/listings/"]')
  .filter({ hasText: "Nomo" })
  .first();
const projectLink = await project.getAttribute("href");
const projectBox = await project.boundingBox();
await project.hover();
await page.waitForTimeout(220);
await project.click();
await page.waitForURL(/\/listings\//);
await page.getByRole("heading", { name: "Nomo", exact: true }).waitFor();
await capture("nomo-project");
const developer = page
  .locator('a[href*="/developer/"] , a[href*="/developers/"]')
  .filter({ hasText: /\S/ })
  .first();
const developerLink = await developer.getAttribute("href");
const developerBox = await developer.boundingBox();
await developer.hover();
await developer.click();
await page.waitForURL(/\/developer(s)?\//);
await page.getByRole("heading", { name: "adnfng", exact: true }).waitFor();
await capture("developer");

if (records.some((record) => !record.dark))
  throw new Error("Sunset did not remain in dark mode throughout the capture.");
writeFileSync(
  join(out, "capture.json"),
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      source: base,
      viewport: { width: 1600, height: 900 },
      project: { href: projectLink, box: projectBox },
      developer: { href: developerLink, box: developerBox },
      pages: records,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    {
      project: { href: projectLink, box: projectBox },
      developer: { href: developerLink, box: developerBox },
      pages: records,
    },
    null,
    2,
  ),
);
await browser.close();
